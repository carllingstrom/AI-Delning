import { createCanvas } from 'canvas';

interface CostData {
  x: string;
  y: number;
}

export function generatePieChartImage(costData: CostData[], width: number = 200, height: number = 200): string {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Set background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  // Colors for the pie chart - ensure good contrast and visibility
  const colors = [
    '#FECB00', // AI Sweden yellow
    '#E76F51', // Red orange (good contrast with yellow)
    '#4A90E2', // Sky blue
    '#A8D5BA', // Mint green
    '#9B5DE5', // Purple
    '#F4A261', // Orange
    '#7FB3D3', // Light sky blue
    '#2E5984', // Light blue
    '#1B365D', // Medium blue
    '#0D1B2A'  // Dark blue
  ];

  // Calculate total
  const total = costData.reduce((sum, item) => sum + item.y, 0);
  if (total === 0) return canvas.toDataURL();

  // Draw pie chart
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;

  let currentAngle = 0;

  costData.forEach((item, index) => {
    const percentage = item.y / total;
    const angle = percentage * 2 * Math.PI;

    // Draw pie slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    currentAngle += angle;
  });

  return canvas.toDataURL();
}

export function generateSimplePieChart(costData: CostData[]): string {
  // For now, return a simple base64 encoded image
  // This is a placeholder - in a real implementation, you'd generate an actual pie chart
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');

  // Set background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 200, 200);

  // Draw a simple pie chart
  const centerX = 100;
  const centerY = 100;
  const radius = 80;

  const total = costData.reduce((sum, item) => sum + item.y, 0);
  if (total === 0) return canvas.toDataURL();

  const colors = [
    '#FECB00', '#E76F51', '#4A90E2', '#A8D5BA', '#9B5DE5',
    '#F4A261', '#7FB3D3', '#2E5984', '#1B365D', '#0D1B2A'
  ];

  let currentAngle = 0;

  costData.forEach((item, index) => {
    const percentage = item.y / total;
    const angle = percentage * 2 * Math.PI;

    // Draw pie slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    currentAngle += angle;
  });

  return canvas.toDataURL();
} 