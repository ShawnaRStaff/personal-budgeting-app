const sharp = require('sharp');
const path = require('path');

const WIDTH = 1024;
const HEIGHT = 500;

// SVG with wallet icon (matching app icon), app name, and tagline
const svgContent = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0D0D0D;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGradient)"/>

  <!-- Subtle grid pattern -->
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="0.5" opacity="0.03"/>
  </pattern>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>

  <!-- Decorative circles -->
  <circle cx="900" cy="80" r="150" fill="#4CAF50" opacity="0.08"/>
  <circle cx="120" cy="420" r="100" fill="#4CAF50" opacity="0.05"/>

  <!-- App Icon (rounded square with wallet icon - matching app icon) -->
  <g transform="translate(100, 130)">
    <!-- Icon background -->
    <rect width="180" height="180" rx="36" fill="#0D0D0D"/>
    <!-- Wallet icon (Material Design account-balance-wallet) -->
    <g transform="translate(30, 30) scale(5)">
      <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#4CAF50"/>
    </g>
  </g>

  <!-- App Name -->
  <text x="320" y="200" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="bold" fill="#ffffff">
    Personal Budget
  </text>

  <!-- Tagline -->
  <text x="320" y="270" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#888888">
    Track expenses • Manage budgets • Reach your goals
  </text>

  <!-- Feature highlights -->
  <g transform="translate(320, 320)">
    <circle cx="12" cy="12" r="8" fill="#4CAF50"/>
    <text x="32" y="18" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#cccccc">Simple expense tracking</text>
  </g>
  <g transform="translate(320, 360)">
    <circle cx="12" cy="12" r="8" fill="#4CAF50"/>
    <text x="32" y="18" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#cccccc">Budget alerts &amp; insights</text>
  </g>
  <g transform="translate(320, 400)">
    <circle cx="12" cy="12" r="8" fill="#4CAF50"/>
    <text x="32" y="18" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#cccccc">Savings goals with progress tracking</text>
  </g>

  <!-- Accent line -->
  <rect x="320" y="290" width="80" height="4" rx="2" fill="#4CAF50"/>
</svg>
`;

async function generateFeatureGraphic() {
  const outputPath = path.join(__dirname, '..', 'assets', 'feature-graphic.png');
  
  await sharp(Buffer.from(svgContent))
    .png()
    .toFile(outputPath);
  
  console.log(`Feature graphic generated: ${outputPath}`);
}

generateFeatureGraphic().catch(console.error);
