/**
 * Document Generation History Storage
 * Persists document generation records in localStorage (for instant querying & metadata)
 * and stores full generated document blobs in IndexedDB (for reliable re-downloading).
 */

export interface GeneratedDocumentRecord {
  id: string;
  timestamp: number;
  createdAt: string;
  title: string;
  subtitle?: string;
  author?: string;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  itemCount: number;
  notebookName: string;
  format: 'docx' | 'zip' | 'pdf';
  captionsSummary: string[];
}

const STORAGE_KEY = 'colab2doc_generation_history';
const DB_NAME = 'colab2doc_db';
const DB_VERSION = 1;
const BLOB_STORE_NAME = 'generated_doc_blobs';

// Format bytes into readable string
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

// In-memory fallback cache if IndexedDB is unavailable
const memoryBlobCache = new Map<string, Blob>();

// Initialize IndexedDB
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(BLOB_STORE_NAME)) {
        db.createObjectStore(BLOB_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Store blob in IndexedDB
async function storeBlob(id: string, blob: Blob): Promise<void> {
  memoryBlobCache.set(id, blob);
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BLOB_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(BLOB_STORE_NAME);
      const request = store.put(blob, id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB store error, relying on in-memory blob cache:', err);
  }
}

// Retrieve blob from IndexedDB
export async function getBlob(id: string): Promise<Blob | null> {
  if (memoryBlobCache.has(id)) {
    return memoryBlobCache.get(id) || null;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([BLOB_STORE_NAME], 'readonly');
      const store = transaction.objectStore(BLOB_STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => {
        const result = request.result;
        if (result instanceof Blob) {
          memoryBlobCache.set(id, result);
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('IndexedDB retrieve error:', err);
    return null;
  }
}

// Remove blob from IndexedDB
async function deleteBlob(id: string): Promise<void> {
  memoryBlobCache.delete(id);
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([BLOB_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(BLOB_STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  } catch (err) {
    // Ignore error
  }
}

// Clear all blobs
async function clearAllBlobs(): Promise<void> {
  memoryBlobCache.clear();
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([BLOB_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(BLOB_STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  } catch (err) {
    // Ignore error
  }
}

// Get all metadata records from localStorage
export function getHistoryRecords(): GeneratedDocumentRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
    return [];
  } catch (err) {
    console.error('Failed to parse generation history from localStorage:', err);
    return [];
  }
}

// Save a new record and its blob
export async function addHistoryRecord(
  entry: {
    title: string;
    subtitle?: string;
    author?: string;
    fileName: string;
    itemCount: number;
    notebookName: string;
    format: 'docx' | 'zip' | 'pdf';
    captionsSummary?: string[];
  },
  blob: Blob
): Promise<GeneratedDocumentRecord> {
  const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date();
  
  const record: GeneratedDocumentRecord = {
    id,
    timestamp: now.getTime(),
    createdAt: now.toISOString(),
    title: entry.title || entry.fileName,
    subtitle: entry.subtitle,
    author: entry.author,
    fileName: entry.fileName,
    fileSize: blob.size,
    fileSizeFormatted: formatBytes(blob.size),
    itemCount: entry.itemCount,
    notebookName: entry.notebookName || 'Untitled Notebook',
    format: entry.format,
    captionsSummary: entry.captionsSummary || [],
  };

  // 1. Store blob in IndexedDB
  await storeBlob(id, blob);

  // 2. Save metadata to localStorage (capped at 50 most recent records)
  try {
    const current = getHistoryRecords();
    const updated = [record, ...current].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save history metadata to localStorage:', err);
  }

  return record;
}

// Delete an individual record
export async function deleteHistoryRecord(id: string): Promise<GeneratedDocumentRecord[]> {
  await deleteBlob(id);
  try {
    const current = getHistoryRecords();
    const filtered = current.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.error('Failed to delete history record:', err);
    return getHistoryRecords();
  }
}

// Clear all records
export async function clearAllHistory(): Promise<void> {
  await clearAllBlobs();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}

// Trigger download of a history document
export async function downloadHistoryItem(record: GeneratedDocumentRecord): Promise<boolean> {
  try {
    const blob = await getBlob(record.id);
    if (!blob) {
      return false;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = record.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  } catch (err) {
    console.error('Failed to download history document:', err);
    return false;
  }
}
