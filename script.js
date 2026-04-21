const slider = document.getElementById('integrationSlider');
const integrationValue = document.getElementById('integrationValue');
const ctValue = document.getElementById('ctValue');
const ccValue = document.getElementById('ccValue');
const totalValue = document.getElementById('totalValue');
const diagnosisText = document.getElementById('diagnosisText');
const canvas = document.getElementById('costChart');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

function transactionCost(x) {
  // Disminuye al integrar más
  return 88 - 0.72 * x + 0.0022 * Math.pow(x - 25, 2);
}

function coordinationCost(x) {
  // Aumenta de forma más acelerada al integrar más
  return 12 + 0.16 * x + 0.009 * Math.pow(x - 10, 2);
}

function totalCost(x) {
  return transactionCost(x) + coordinationCost(x);
}

function computeOptimalX() {
  let bestX = 0;
  let best = Infinity;
  for (let x = 0; x <= 100; x += 0.2) {
    const total = totalCost(x);
    if (total < best) {
      best = total;
      bestX = x;
    }
  }
  return bestX;
}

const optimalX = computeOptimalX();

function formatNum(v) {
  return v.toFixed(1);
}

function getYBounds() {
  let min = Infinity;
  let max = -Infinity;
  for (let x = 0; x <= 100; x += 1) {
    const values = [transactionCost(x), coordinationCost(x), totalCost(x)];
    min = Math.min(min, ...values);
    max = Math.max(max, ...values);
  }
  return { min: Math.floor(min - 5), max: Math.ceil(max + 5) };
}

const bounds = getYBounds();

function mapX(x) {
  const left = 72;
  const right = W - 38;
  return left + (x / 100) * (right - left);
}

function mapY(y) {
  const top = 34;
  const bottom = H - 62;
  return bottom - ((y - bounds.min) / (bounds.max - bounds.min)) * (bottom - top);
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, 'rgba(55,162,255,0.08)');
  gradient.addColorStop(1, 'rgba(255,255,255,0.01)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // grid
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;

  for (let i = 0; i <= 5; i++) {
    const y = 34 + (i * (H - 96)) / 5;
    ctx.beginPath();
    ctx.moveTo(72, y);
    ctx.lineTo(W - 38, y);
    ctx.stroke();
  }

  for (let i = 0; i <= 10; i++) {
    const x = mapX(i * 10);
    ctx.beginPath();
    ctx.moveTo(x, 34);
    ctx.lineTo(x, H - 62);
    ctx.stroke();
  }

  // axes labels
  ctx.fillStyle = 'rgba(236,244,255,0.78)';
  ctx.font = '600 14px Inter, Arial';
  ctx.fillText('Costo', 20, 28);
  ctx.fillText('Nivel de integración vertical (%)', W / 2 - 110, H - 18);

  ctx.font = '500 13px Inter, Arial';
  for (let i = 0; i <= 10; i++) {
    const xValue = i * 10;
    const x = mapX(xValue);
    ctx.fillText(String(xValue), x - 8, H - 40);
  }

  for (let i = 0; i <= 5; i++) {
    const yValue = bounds.max - (i * (bounds.max - bounds.min)) / 5;
    const y = 34 + (i * (H - 96)) / 5;
    ctx.fillText(yValue.toFixed(0), 26, y + 4);
  }
}

function drawCurve(fn, color, glow = false) {
  ctx.beginPath();
  for (let x = 0; x <= 100; x += 1) {
    const px = mapX(x);
    const py = mapY(fn(x));
    if (x === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawAreaToOptimal() {
  const ox = mapX(optimalX);
  ctx.fillStyle = 'rgba(61,220,151,0.08)';
  ctx.fillRect(ox - 16, 34, 32, H - 96);

  ctx.setLineDash([7, 6]);
  ctx.strokeStyle = 'rgba(61,220,151,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ox, 34);
  ctx.lineTo(ox, H - 62);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(61,220,151,1)';
  ctx.font = '700 13px Inter, Arial';
  ctx.fillText(`Óptimo ≈ ${optimalX.toFixed(1)}%`, ox - 34, 24);
}

function drawCurrentMarker(x) {
  const tx = mapX(x);
  const ty = mapY(totalCost(x));

  // vertical guide
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = 'rgba(255,255,255,0.32)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tx, H - 62);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.setLineDash([]);

  // point
  ctx.beginPath();
  ctx.arc(tx, ty, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255,255,255,0.9)';
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(tx, ty, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#0b1624';
  ctx.fill();

  // tooltip
  const boxW = 162;
  const boxH = 58;
  let boxX = tx + 14;
  let boxY = ty - 72;
  if (boxX + boxW > W - 20) boxX = tx - boxW - 14;
  if (boxY < 18) boxY = ty + 16;

  ctx.fillStyle = 'rgba(6, 14, 24, 0.92)';
  roundRect(ctx, boxX, boxY, boxW, boxH, 12, true, false);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.stroke();

  ctx.fillStyle = '#eaf4ff';
  ctx.font = '700 13px Inter, Arial';
  ctx.fillText(`Integración: ${x.toFixed(0)}%`, boxX + 12, boxY + 20);
  ctx.font = '500 12px Inter, Arial';
  ctx.fillStyle = '#b8c7dc';
  ctx.fillText(`Costo total: ${totalCost(x).toFixed(1)}`, boxX + 12, boxY + 40);
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function updateDiagnosis(x) {
  const ct = transactionCost(x);
  const cc = coordinationCost(x);
  const total = totalCost(x);

  integrationValue.textContent = `${x.toFixed(0)}%`;
  ctValue.textContent = formatNum(ct);
  ccValue.textContent = formatNum(cc);
  totalValue.textContent = formatNum(total);

  const diff = x - optimalX;
  let text = '';

  if (Math.abs(diff) <= 6) {
    text = `La empresa está cerca del punto óptimo. En este rango, Codelco logra un equilibrio atractivo entre control interno y eficiencia de mercado.`;
  } else if (diff < -6) {
    text = `Predomina el uso del mercado. Aquí los costos de transacción siguen siendo relativamente altos, por lo que convendría integrar más actividades críticas.`;
  } else {
    text = `Predomina la integración interna. En este rango, la coordinación se vuelve más costosa y puede aparecer burocracia, por lo que convendría externalizar parte de las actividades.`;
  }

  diagnosisText.textContent = text;
}

function drawChart(x) {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawAreaToOptimal();
  drawCurve(transactionCost, '#37a2ff', true);
  drawCurve(coordinationCost, '#ff9a3c', true);
  drawCurve(totalCost, '#3ddc97', true);
  drawCurrentMarker(x);
}

function updateAll() {
  const x = parseFloat(slider.value);
  updateDiagnosis(x);
  drawChart(x);
}

slider.addEventListener('input', updateAll);
updateAll();
