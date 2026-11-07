// Generates clean, medical-illustrative SVG data URIs for eczema skin check-ins
// Designed so demo photos load immediately with zero external network dependencies

export function generateSkinSvg({
  bodyArea = 'face',
  severity = 'mild', // 'clear' | 'mild' | 'moderate' | 'flare'
  seed = 1,
}: {
  bodyArea: string;
  severity: 'clear' | 'mild' | 'moderate' | 'flare';
  seed?: number;
}): string {
  // Color palette depending on severity
  let baseColor = '#FDE8DC';
  let patchColor = 'rgba(235, 120, 110, 0.15)';
  let scratchVisible = false;
  let rednessOpacity = 0.15;
  let spotCount = 3;
  let severityLabel = 'Calm';

  if (severity === 'clear') {
    baseColor = '#FBEFE8';
    rednessOpacity = 0.05;
    patchColor = 'rgba(230, 140, 130, 0.08)';
    spotCount = 1;
    severityLabel = 'Calm (Score 90)';
  } else if (severity === 'mild') {
    baseColor = '#FCE3D6';
    rednessOpacity = 0.25;
    patchColor = 'rgba(235, 110, 100, 0.3)';
    spotCount = 4;
    severityLabel = 'Mild Pinkness (Score 75)';
  } else if (severity === 'moderate') {
    baseColor = '#FAD9C9';
    rednessOpacity = 0.45;
    patchColor = 'rgba(225, 80, 75, 0.55)';
    spotCount = 7;
    severityLabel = 'Moderate Flare (Score 55)';
  } else if (severity === 'flare') {
    baseColor = '#F8CEBC';
    rednessOpacity = 0.7;
    patchColor = 'rgba(215, 60, 55, 0.75)';
    scratchVisible = true;
    spotCount = 12;
    severityLabel = 'High Flare (Score 35)';
  }

  // Draw area outline and soft eczema patches
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <radialGradient id="skinGlow" cx="50%" cy="50%" r="65%">
        <stop offset="0%" stop-color="${baseColor}"/>
        <stop offset="100%" stop-color="#EED0BD"/>
      </radialGradient>
      <radialGradient id="patchGrad1" cx="45%" cy="45%" r="50%">
        <stop offset="0%" stop-color="${patchColor}"/>
        <stop offset="70%" stop-color="${patchColor.replace(/[\d.]+\)$/, '0.2)')}"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
      <radialGradient id="patchGrad2" cx="55%" cy="52%" r="40%">
        <stop offset="0%" stop-color="${patchColor}"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
      <filter id="blurFilter">
        <feGaussianBlur stdDeviation="8" />
      </filter>
    </defs>

    <!-- Skin background frame -->
    <rect width="400" height="400" rx="28" fill="url(#skinGlow)"/>

    <!-- Subtle anatomic guide outline -->
    <g stroke="rgba(120, 90, 80, 0.12)" stroke-width="2" fill="none">
      ${
        bodyArea === 'face'
          ? `<ellipse cx="200" cy="200" rx="140" ry="170" />
             <path d="M 160 190 Q 200 230 240 190" stroke="rgba(120, 90, 80, 0.08)" />`
          : bodyArea === 'elbows'
          ? `<path d="M 120 100 Q 200 210 130 320 M 170 195 Q 210 205 240 195" />`
          : bodyArea === 'knees'
          ? `<circle cx="200" cy="200" r="120" />
             <path d="M 150 200 Q 200 170 250 200" stroke-width="1.5" />`
          : `<rect x="80" y="80" width="240" height="240" rx="30" />`
      }
    </g>

    <!-- Main Eczema Patch Blobs with organic blur -->
    <g filter="url(#blurFilter)">
      <ellipse cx="${180 + (seed % 20)}" cy="${190 + (seed % 15)}" rx="${70 + spotCount * 4}" ry="${60 + spotCount * 3}" fill="url(#patchGrad1)" />
      <ellipse cx="${215 - (seed % 15)}" cy="${215 + (seed % 25)}" rx="${55 + spotCount * 3}" ry="${45 + spotCount * 2}" fill="url(#patchGrad2)" />
      ${
        severity === 'flare' || severity === 'moderate'
          ? `<circle cx="${195 + (seed % 10)}" cy="${185 - (seed % 10)}" r="${35 + spotCount * 2}" fill="rgba(215, 65, 60, ${rednessOpacity})" />`
          : ''
      }
    </g>

    <!-- Fine dryness flaking dots -->
    ${Array.from({ length: spotCount * 2 })
      .map((_, i) => {
        const x = 160 + ((i * 37 + seed * 13) % 80);
        const y = 170 + ((i * 43 + seed * 19) % 75);
        return `<circle cx="${x}" cy="${y}" r="${1 + (i % 2)}" fill="rgba(255, 255, 255, 0.45)" />`;
      })
      .join('\n')}

    <!-- Scratch marks if present -->
    ${
      scratchVisible
        ? `<g stroke="rgba(180, 40, 35, 0.65)" stroke-width="1.6" stroke-linecap="round">
            <line x1="175" y1="185" x2="215" y2="192" />
            <line x1="170" y1="195" x2="208" y2="204" />
            <line x1="182" y1="205" x2="222" y2="211" />
           </g>`
        : ''
    }

    <!-- Area tag badge (subtle on photo) -->
    <g transform="translate(18, 358)">
      <rect width="130" height="26" rx="8" fill="rgba(30, 45, 40, 0.45)" backdrop-filter="blur(4px)" />
      <text x="65" y="17" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="600" text-anchor="middle">
        ${bodyArea.toUpperCase()} · ${severityLabel}
      </text>
    </g>
  </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
