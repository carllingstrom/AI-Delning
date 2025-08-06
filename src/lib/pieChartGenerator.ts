import { createCanvas } from 'canvas';

interface CostData {
  x: string;
  y: number;
}

export function generatePieChartImage(costData: CostData[], width: number = 200, height: number = 200): string {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Set background
  ctx.fillStyle = '#121f2b';
  ctx.fillRect(0, 0, width, height);

  // Colors for the pie chart - using the design system colorscale
  const colors = [
    '#fecb00', // Primary yellow
    '#007399', // Light blue
    '#004d66', // Blue
    '#34af8f', // Accent green
    '#ff153b', // Accent red
    '#224556', // Blue-gray
    '#f4f2e6', // Off-white
    '#fffefa', // White
    // Additional colors for more variety
    '#fecb00', // Primary yellow (repeated for more data points)
    '#007399', // Light blue (repeated)
    '#004d66', // Blue (repeated)
    '#34af8f', // Accent green (repeated)
    '#ff153b', // Accent red (repeated)
    '#224556', // Blue-gray (repeated)
    '#f4f2e6', // Off-white (repeated)
    '#fffefa'  // White (repeated)
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
    ctx.strokeStyle = '#fffefa';
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
  ctx.fillStyle = '#121f2b';
  ctx.fillRect(0, 0, 200, 200);

  // Draw a simple pie chart
  const centerX = 100;
  const centerY = 100;
  const radius = 80;

  const total = costData.reduce((sum, item) => sum + item.y, 0);
  if (total === 0) return canvas.toDataURL();

  // Using the design system colorscale
  const colors = [
    '#fecb00', // Primary yellow
    '#007399', // Light blue
    '#004d66', // Blue
    '#34af8f', // Accent green
    '#ff153b', // Accent red
    '#224556', // Blue-gray
    '#f4f2e6', // Off-white
    '#fffefa'  // White
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
    ctx.strokeStyle = '#fffefa';
    ctx.lineWidth = 2;
    ctx.stroke();

    currentAngle += angle;
  });

  return canvas.toDataURL();
} 