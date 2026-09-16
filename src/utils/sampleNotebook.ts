// Sample notebook generator that creates realistic, self-contained data science outputs

function createPlotDataUrl(title: string, type: 'loss' | 'heatmap' | 'roc' | 'importance'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 900, 540);

  // Border & subtle padding
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(10, 10, 880, 520);

  // Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText(title, 60, 55);

  if (type === 'loss') {
    // Subtitle
    ctx.fillStyle = '#64748b';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Model convergence across 25 training epochs (AdamW optimizer, lr=1e-4)', 60, 80);

    // Grid lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let y = 120; y <= 450; y += 60) {
      ctx.beginPath();
      ctx.moveTo(80, y);
      ctx.lineTo(840, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 120);
    ctx.lineTo(80, 450);
    ctx.lineTo(840, 450);
    ctx.stroke();

    // Training curve (Blue)
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const trainLoss = [0.88, 0.72, 0.61, 0.54, 0.49, 0.44, 0.40, 0.36, 0.33, 0.30, 0.28, 0.25, 0.23, 0.21, 0.20, 0.19, 0.18, 0.17, 0.16, 0.15, 0.14, 0.14, 0.13, 0.13, 0.12];
    trainLoss.forEach((loss, i) => {
      const x = 80 + (i / 24) * 750;
      const y = 450 - ((0.9 - loss) / 0.8) * 310;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Validation curve (Amber)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    const valLoss = [0.89, 0.75, 0.64, 0.58, 0.52, 0.47, 0.43, 0.39, 0.37, 0.35, 0.34, 0.33, 0.31, 0.30, 0.29, 0.29, 0.28, 0.28, 0.27, 0.27, 0.26, 0.26, 0.26, 0.25, 0.25];
    valLoss.forEach((loss, i) => {
      const x = 80 + (i / 24) * 750;
      const y = 450 - ((0.9 - loss) / 0.8) * 310;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Legend
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(660, 60, 24, 4);
    ctx.fillStyle = '#1e293b';
    ctx.font = '13px system-ui';
    ctx.fillText('Train Loss', 695, 66);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(770, 60, 24, 4);
    ctx.fillStyle = '#1e293b';
    ctx.fillText('Val Loss', 805, 66);

    // Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '12px system-ui';
    ctx.fillText('Epochs', 460, 485);
    ctx.fillText('Loss', 45, 110);
  } else if (type === 'heatmap') {
    // Correlation Matrix Heatmap
    const features = ['tenure', 'monthly_charges', 'total_charges', 'support_calls', 'churn'];
    const matrix = [
      [1.0, 0.24, 0.82, -0.15, -0.35],
      [0.24, 1.0, 0.65, 0.42, 0.58],
      [0.82, 0.65, 1.0, 0.12, 0.18],
      [-0.15, 0.42, 0.12, 1.0, 0.62],
      [-0.35, 0.58, 0.18, 0.62, 1.0],
    ];

    const cellW = 120;
    const cellH = 65;
    const startX = 170;
    const startY = 110;

    // Feature labels
    ctx.font = '13px system-ui';
    features.forEach((feat, i) => {
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'right';
      ctx.fillText(feat, startX - 15, startY + i * cellH + 40);
      ctx.textAlign = 'center';
      ctx.fillText(feat, startX + i * cellW + 60, startY - 15);
    });

    // Heatmap cells
    matrix.forEach((row, r) => {
      row.forEach((val, c) => {
        const norm = (val + 1) / 2; // 0 to 1
        const rColor = Math.round(240 - norm * 180);
        const gColor = Math.round(180 + norm * 40);
        const bColor = Math.round(100 + norm * 150);

        ctx.fillStyle = `rgb(${rColor}, ${gColor}, ${bColor})`;
        ctx.fillRect(startX + c * cellW, startY + r * cellH, cellW - 4, cellH - 4);

        ctx.fillStyle = Math.abs(val) > 0.5 ? '#ffffff' : '#0f172a';
        ctx.font = 'bold 15px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(val.toFixed(2), startX + c * cellW + cellW / 2, startY + r * cellH + cellH / 2 + 5);
      });
    });
  } else if (type === 'roc') {
    // ROC Curve
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let step = 0; step <= 1; step += 0.2) {
      const y = 450 - step * 320;
      const x = 120 + step * 650;
      ctx.beginPath();
      ctx.moveTo(120, y);
      ctx.lineTo(770, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, 130);
      ctx.lineTo(x, 450);
      ctx.stroke();
    }

    // Diagonal random line
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(120, 450);
    ctx.lineTo(770, 130);
    ctx.stroke();
    ctx.setLineDash([]);

    // Actual ROC curve
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(120, 450);
    ctx.bezierCurveTo(150, 220, 280, 145, 770, 130);
    ctx.stroke();

    // Area fill
    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.beginPath();
    ctx.moveTo(120, 450);
    ctx.bezierCurveTo(150, 220, 280, 145, 770, 130);
    ctx.lineTo(770, 450);
    ctx.closePath();
    ctx.fill();

    // Text callout
    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 16px system-ui';
    ctx.fillText('AUC-ROC Score = 0.942', 450, 280);
    ctx.fillStyle = '#64748b';
    ctx.font = '13px system-ui';
    ctx.fillText('False Positive Rate', 410, 485);
  } else {
    // Feature Importance
    const items = [
      { name: 'Monthly Charges', val: 0.34 },
      { name: 'Customer Support Calls', val: 0.28 },
      { name: 'Contract Type (Month-to-Month)', val: 0.19 },
      { name: 'Tenure (Months)', val: 0.12 },
      { name: 'Payment Method (Electronic)', val: 0.07 },
    ];

    items.forEach((item, i) => {
      const y = 140 + i * 65;
      ctx.fillStyle = '#1e293b';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(item.name, 280, y + 22);

      // Background bar
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(300, y, 480, 32);

      // Value bar
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(300, y, 480 * (item.val / 0.4), 32);

      // Percentage label
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(`${(item.val * 100).toFixed(1)}%`, 310 + 480 * (item.val / 0.4), y + 21);
    });
  }

  return canvas.toDataURL('image/png');
}

export function generateSampleNotebookJson(): any {
  const plotLoss = createPlotDataUrl('Training & Validation Loss Across Epochs', 'loss');
  const plotHeatmap = createPlotDataUrl('Correlation Heatmap: Feature Interactions', 'heatmap');
  const plotRoc = createPlotDataUrl('Receiver Operating Characteristic (ROC) Curve', 'roc');
  const plotImportance = createPlotDataUrl('XGBoost Top Predictive Feature Importances', 'importance');

  return {
    cells: [
      {
        cell_type: 'code',
        execution_count: 1,
        metadata: {},
        source: [
          'import pandas as pd\n',
          'import numpy as np\n',
          'df = pd.read_csv("customer_churn.csv")\n',
          'display(df.head(6))',
        ],
        outputs: [
          {
            output_type: 'execute_result',
            execution_count: 1,
            data: {
              'text/plain': '   customerID  tenure  monthly_charges  churn\n0  7590-VHVEG       1            29.85     No\n1  5575-GNVDE      34            56.95     No\n2  3668-QPYBK       2            53.85    Yes',
              'text/html': `
<div style="font-family:system-ui;max-width:100%;overflow-x:auto;">
  <table style="border-collapse:collapse;width:100%;font-size:12.5px;color:#1e293b;">
    <thead>
      <tr style="background:#f1f5f9;text-align:left;border-bottom:2px solid #cbd5e1;">
        <th style="padding:8px 12px;">Index</th>
        <th style="padding:8px 12px;">Customer ID</th>
        <th style="padding:8px 12px;">Tenure (Mos)</th>
        <th style="padding:8px 12px;">Contract</th>
        <th style="padding:8px 12px;">Monthly Charges</th>
        <th style="padding:8px 12px;">Total Charges</th>
        <th style="padding:8px 12px;">Churn Status</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid #e2e8f0;background:#ffffff;">
        <td style="padding:7px 12px;font-weight:600;color:#64748b;">0</td>
        <td style="padding:7px 12px;font-family:monospace;">7590-VHVEG</td>
        <td style="padding:7px 12px;">1</td>
        <td style="padding:7px 12px;">Month-to-month</td>
        <td style="padding:7px 12px;">$29.85</td>
        <td style="padding:7px 12px;">$29.85</td>
        <td style="padding:7px 12px;"><span style="color:#15803d;background:#dcfce7;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600;">Retained</span></td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0;background:#f8fafc;">
        <td style="padding:7px 12px;font-weight:600;color:#64748b;">1</td>
        <td style="padding:7px 12px;font-family:monospace;">5575-GNVDE</td>
        <td style="padding:7px 12px;">34</td>
        <td style="padding:7px 12px;">One year</td>
        <td style="padding:7px 12px;">$56.95</td>
        <td style="padding:7px 12px;">$1889.50</td>
        <td style="padding:7px 12px;"><span style="color:#15803d;background:#dcfce7;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600;">Retained</span></td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0;background:#ffffff;">
        <td style="padding:7px 12px;font-weight:600;color:#64748b;">2</td>
        <td style="padding:7px 12px;font-family:monospace;">3668-QPYBK</td>
        <td style="padding:7px 12px;">2</td>
        <td style="padding:7px 12px;">Month-to-month</td>
        <td style="padding:7px 12px;">$53.85</td>
        <td style="padding:7px 12px;">$108.15</td>
        <td style="padding:7px 12px;"><span style="color:#b91c1c;background:#fee2e2;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600;">Churned</span></td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0;background:#f8fafc;">
        <td style="padding:7px 12px;font-weight:600;color:#64748b;">3</td>
        <td style="padding:7px 12px;font-family:monospace;">7795-CFOCW</td>
        <td style="padding:7px 12px;">45</td>
        <td style="padding:7px 12px;">One year</td>
        <td style="padding:7px 12px;">$42.30</td>
        <td style="padding:7px 12px;">$1840.75</td>
        <td style="padding:7px 12px;"><span style="color:#15803d;background:#dcfce7;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600;">Retained</span></td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0;background:#ffffff;">
        <td style="padding:7px 12px;font-weight:600;color:#64748b;">4</td>
        <td style="padding:7px 12px;font-family:monospace;">9237-HQITU</td>
        <td style="padding:7px 12px;">2</td>
        <td style="padding:7px 12px;">Month-to-month</td>
        <td style="padding:7px 12px;">$70.70</td>
        <td style="padding:7px 12px;">$151.65</td>
        <td style="padding:7px 12px;"><span style="color:#b91c1c;background:#fee2e2;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600;">Churned</span></td>
      </tr>
    </tbody>
  </table>
</div>`,
            },
            metadata: {},
          },
        ],
      },
      {
        cell_type: 'code',
        execution_count: 2,
        metadata: {},
        source: [
          '# Feature Correlation Matrix\n',
          'plt.figure(figsize=(10, 6))\n',
          'sns.heatmap(df.corr(), annot=True, cmap="coolwarm")\n',
          'plt.title("Correlation Heatmap: Feature Interactions")\n',
          'plt.show()',
        ],
        outputs: [
          {
            output_type: 'display_data',
            data: {
              'image/png': plotHeatmap.replace('data:image/png;base64,', ''),
              'text/plain': '<Figure size 900x540 with 2 Axes>',
            },
            metadata: {},
          },
        ],
      },
      {
        cell_type: 'code',
        execution_count: 3,
        metadata: {},
        source: [
          'print("Initiating XGBoost Cross-Validation Pipeline...")\n',
          'for fold in range(1, 4):\n',
          '    print(f"[Fold {fold}/3] Validation AUROC: {0.932 + fold*0.005:.4f} | LogLoss: {0.241 - fold*0.004:.4f}")\n',
          'print("Optimal hyperparameters found: max_depth=5, learning_rate=0.03, n_estimators=350")',
        ],
        outputs: [
          {
            output_type: 'stream',
            name: 'stdout',
            text: [
              'Initiating XGBoost Cross-Validation Pipeline...\n',
              '[Fold 1/3] Validation AUROC: 0.9370 | LogLoss: 0.2370\n',
              '[Fold 2/3] Validation AUROC: 0.9420 | LogLoss: 0.2330\n',
              '[Fold 3/3] Validation AUROC: 0.9470 | LogLoss: 0.2290\n',
              'Optimal hyperparameters found: max_depth=5, learning_rate=0.03, n_estimators=350\n',
            ],
          },
        ],
      },
      {
        cell_type: 'code',
        execution_count: 4,
        metadata: {},
        source: [
          'plt.figure(figsize=(10, 6))\n',
          'plt.plot(train_loss, label="Train Loss")\n',
          'plt.plot(val_loss, "--", label="Val Loss")\n',
          'plt.title("Training & Validation Loss Across Epochs")\n',
          'plt.show()',
        ],
        outputs: [
          {
            output_type: 'display_data',
            data: {
              'image/png': plotLoss.replace('data:image/png;base64,', ''),
              'text/plain': '<Figure size 900x540 with 1 Axes>',
            },
            metadata: {},
          },
        ],
      },
      {
        cell_type: 'code',
        execution_count: 5,
        metadata: {},
        source: [
          'plt.figure(figsize=(10, 6))\n',
          'plt.plot(fpr, tpr, color="emerald", lw=3.5)\n',
          'plt.title("Receiver Operating Characteristic (ROC) Curve")\n',
          'plt.show()',
        ],
        outputs: [
          {
            output_type: 'display_data',
            data: {
              'image/png': plotRoc.replace('data:image/png;base64,', ''),
              'text/plain': '<Figure size 900x540 with 1 Axes>',
            },
            metadata: {},
          },
        ],
      },
      {
        cell_type: 'code',
        execution_count: 6,
        metadata: {},
        source: [
          'print("--- Evaluation Metrics on Out-of-Sample Test Set ---")\n',
          'print(classification_report(y_test, y_pred, target_names=["Retained", "Churned"]))',
        ],
        outputs: [
          {
            output_type: 'stream',
            name: 'stdout',
            text: [
              '--- Evaluation Metrics on Out-of-Sample Test Set ---\n',
              '              precision    recall  f1-score   support\n\n',
              '    Retained       0.96      0.95      0.95      1035\n',
              '     Churned       0.87      0.89      0.88       374\n\n',
              '    accuracy                           0.93      1409\n',
              '   macro avg       0.91      0.92      0.92      1409\n',
              'weighted avg       0.93      0.93      0.93      1409\n',
            ],
          },
        ],
      },
      {
        cell_type: 'code',
        execution_count: 7,
        metadata: {},
        source: [
          'plt.figure(figsize=(10, 6))\n',
          'plt.title("XGBoost Top Predictive Feature Importances")\n',
          'plt.show()',
        ],
        outputs: [
          {
            output_type: 'display_data',
            data: {
              'image/png': plotImportance.replace('data:image/png;base64,', ''),
              'text/plain': '<Figure size 900x540 with 1 Axes>',
            },
            metadata: {},
          },
        ],
      },
    ],
    metadata: {
      kernelspec: {
        display_name: 'Python 3 (ipykernel)',
        language: 'python',
        name: 'python3',
      },
      language_info: {
        name: 'python',
        version: '3.10.12',
      },
    },
    nbformat: 4,
    nbformat_minor: 4,
  };
}
