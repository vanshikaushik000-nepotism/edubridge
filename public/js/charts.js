/* ═══════════════════════════════════════════
   EduBridge — Canvas Charts
   Line, Bar, Donut, Sparkline renderers
   ═══════════════════════════════════════════ */

const Charts = {
  /* ── Sparkline — tiny line chart inside grade cards ── */
  sparkline(canvas, data, color = '#6366f1') {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    if (data.length < 2) return;

    const min = Math.min(...data) - 5;
    const max = Math.max(...data) + 5;
    const range = max - min || 1;
    const step = w / (data.length - 1);

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    data.forEach((val, i) => {
      const x = i * step;
      const y = h - ((val - min) / range) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, color.replace(')', ', 0.2)').replace('rgb', 'rgba'));
    gradient.addColorStop(1, 'transparent');

    ctx.lineTo((data.length - 1) * step, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  },

  /* ── Line Chart — grade trends ── */
  lineChart(canvas, datasets, labels) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 20, right: 20, bottom: 35, left: 45 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Find min/max
    let allVals = [];
    datasets.forEach(ds => allVals.push(...ds.data));
    const min = Math.floor(Math.min(...allVals) / 10) * 10;
    const max = Math.ceil(Math.max(...allVals) / 10) * 10;
    const range = max - min || 1;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 4; i++) {
      const val = min + (range / 4) * i;
      const y = padding.top + chartH - (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      ctx.fillText(Math.round(val), padding.left - 8, y + 4);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    const step = chartW / (labels.length - 1);
    labels.forEach((label, i) => {
      const x = padding.left + i * step;
      ctx.fillText(label, x, h - 8);
    });

    // Draw datasets
    datasets.forEach(ds => {
      const points = ds.data.map((val, i) => ({
        x: padding.left + i * step,
        y: padding.top + chartH - ((val - min) / range) * chartH,
      }));

      // Line
      ctx.beginPath();
      ctx.strokeStyle = ds.color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Gradient fill
      const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
      gradient.addColorStop(0, ds.color.replace(')', ', 0.15)').replace('rgb', 'rgba').replace('#', ''));
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
      ctx.lineTo(points[0].x, padding.top + chartH);
      ctx.closePath();

      // Use hex color for gradient
      const r = parseInt(ds.color.slice(1, 3), 16);
      const g = parseInt(ds.color.slice(3, 5), 16);
      const b = parseInt(ds.color.slice(5, 7), 16);
      const grad2 = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
      grad2.addColorStop(0, `rgba(${r},${g},${b},0.15)`);
      grad2.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad2;
      ctx.fill();

      // Dots
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = ds.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0e1a';
        ctx.fill();
      });
    });
  },

  /* ── Bar Chart ── */
  barChart(canvas, data, labels, colors) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 20, right: 20, bottom: 35, left: 45 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const max = Math.ceil(Math.max(...data) / 10) * 10;
    const barWidth = (chartW / data.length) * 0.6;
    const gap = (chartW / data.length) * 0.4;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 4; i++) {
      const val = (max / 4) * i;
      const y = padding.top + chartH - (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      ctx.fillText(Math.round(val), padding.left - 8, y + 4);
    }

    // Bars
    data.forEach((val, i) => {
      const x = padding.left + i * (chartW / data.length) + gap / 2;
      const barH = (val / max) * chartH;
      const y = padding.top + chartH - barH;
      const color = colors ? colors[i] : '#6366f1';

      // Bar with rounded top
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(x, y + radius);
      ctx.arcTo(x, y, x + barWidth, y, radius);
      ctx.arcTo(x + barWidth, y, x + barWidth, y + barH, radius);
      ctx.lineTo(x + barWidth, padding.top + chartH);
      ctx.lineTo(x, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Value on top
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(val, x + barWidth / 2, y - 6);

      // Label
      ctx.fillStyle = '#64748b';
      ctx.fillText(labels[i] || '', x + barWidth / 2, h - 8);
    });
  },

  /* ── Donut Chart — attendance breakdown ── */
  donutChart(canvas, data, colors, labels) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(canvas.clientWidth, canvas.clientHeight);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 10;
    const innerR = outerR * 0.65;
    const total = data.reduce((a, b) => a + b, 0) || 1;

    let startAngle = -Math.PI / 2;

    data.forEach((val, i) => {
      const sliceAngle = (val / total) * Math.PI * 2;

      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
      ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();

      startAngle += sliceAngle;
    });

    // Center text
    const mainPct = total > 0 ? Math.round((data[0] / total) * 100) : 0;
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${mainPct}%`, cx, cy - 6);
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Present', cx, cy + 14);
  },
};
