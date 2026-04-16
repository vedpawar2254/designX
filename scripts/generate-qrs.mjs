import fs from 'node:fs/promises'
import path from 'node:path'
import QRCode from 'qrcode'

const projectRoot = process.cwd()
const outputDir = path.join(projectRoot, 'public', 'qr')
const pixelXPath = path.join(projectRoot, 'public', 'assets', 'pixel-x.svg')

const brandColor = '#8b1a6b'
const lightColor = '#ffffff'
const labelColor = '#f8f3fb'
const payloadColor = '#e8c9e2'
const labelAreaHeight = 120
const scale = 16

const qrTargets = [
  { letter: 'D', label: 'Scan to find D' },
  { letter: 'E', label: 'Scan to find E' },
  { letter: 'S', label: 'Scan to find S' },
  { letter: 'I', label: 'Scan to find I' },
  { letter: 'G', label: 'Scan to find G' },
  { letter: 'N', label: 'Scan to find N' },
  { letter: 'X', label: 'Scan to find X' },
].map((item) => ({
  ...item,
  payload: `DESIGNX:SCAN:${item.letter}`,
  filename: `qr-${item.letter.toLowerCase()}.svg`,
}))

const pixelXSvg = await fs.readFile(pixelXPath, 'utf8')
const pixelXDataUri = `data:image/svg+xml;base64,${Buffer.from(pixelXSvg).toString('base64')}`

await fs.mkdir(outputDir, { recursive: true })

for (const target of qrTargets) {
  const rawSvg = await QRCode.toString(target.payload, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    version: 8,
    margin: 2,
    color: {
      dark: brandColor,
      light: lightColor,
    },
  })

  const viewBoxMatch = rawSvg.match(/viewBox="0 0 (\d+) (\d+)"/)
  if (!viewBoxMatch) {
    throw new Error(`Unable to parse QR viewBox for ${target.letter}`)
  }

  const qrWidth = Number(viewBoxMatch[1])
  const qrHeight = Number(viewBoxMatch[2])
  const qrPixelWidth = qrWidth * scale
  const qrPixelHeight = qrHeight * scale
  const totalHeight = qrPixelHeight + labelAreaHeight

  const iconBoxSize = Math.round(qrPixelWidth * 0.23)
  const iconInset = Math.max(6, Math.round(iconBoxSize * 0.13))
  const iconBackgroundX = Math.round((qrPixelWidth - iconBoxSize) / 2)
  const iconBackgroundY = Math.round((qrPixelHeight - iconBoxSize) / 2)
  const iconSize = iconBoxSize - iconInset * 2
  const iconX = iconBackgroundX + iconInset
  const iconY = iconBackgroundY + iconInset

  const labelY = qrPixelHeight + 42
  const payloadY = qrPixelHeight + 86
  const qrBody = rawSvg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim()

  const enhancedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qrPixelWidth} ${totalHeight}" role="img" aria-label="${target.label}">
  <g transform="scale(${scale})" shape-rendering="crispEdges">
    ${qrBody}
  </g>
  <g>
    <rect x="${iconBackgroundX}" y="${iconBackgroundY}" width="${iconBoxSize}" height="${iconBoxSize}" rx="${Math.round(iconBoxSize * 0.14)}" fill="#ffffff" />
    <image href="${pixelXDataUri}" x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" preserveAspectRatio="xMidYMid meet" />
  </g>
  <text x="${Math.round(qrPixelWidth / 2)}" y="${labelY}" text-anchor="middle" fill="${labelColor}" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" letter-spacing="1">${target.label.toUpperCase()}</text>
  <text x="${Math.round(qrPixelWidth / 2)}" y="${payloadY}" text-anchor="middle" fill="${payloadColor}" font-family="Arial, Helvetica, sans-serif" font-size="20" letter-spacing="0.6">${target.payload}</text>
</svg>`

  await fs.writeFile(path.join(outputDir, target.filename), enhancedSvg, 'utf8')
}

const manifest = qrTargets.map((target) => ({
  letter: target.letter,
  label: target.label,
  payload: target.payload,
  file: `/qr/${target.filename}`,
}))

await fs.writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

const qrCards = qrTargets
  .map(
    (target) => `
      <article class="card">
        <img src="./${target.filename}" alt="${target.label}" />
        <h2>${target.label}</h2>
        <p>${target.payload}</p>
      </article>`,
  )
  .join('\n')

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DesignX QR Codes</title>
    <style>
      :root {
        color-scheme: dark;
      }
      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        background: linear-gradient(180deg, #2d0a3e 0%, #8b1a6b 40%, #c2185b 100%);
        color: #fff;
      }
      main {
        max-width: 1080px;
        margin: 0 auto;
        padding: 24px 20px 36px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 28px;
        letter-spacing: 0.8px;
      }
      .subtitle {
        margin: 0 0 20px;
        color: #f2d9ee;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
      }
      .card {
        margin: 0;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        background: rgba(29, 6, 37, 0.35);
        backdrop-filter: blur(4px);
        padding: 12px;
      }
      .card img {
        display: block;
        width: 100%;
        height: auto;
        background: #1f0a27;
        border-radius: 12px;
      }
      .card h2 {
        margin: 10px 0 4px;
        font-size: 16px;
      }
      .card p {
        margin: 0;
        font-size: 12px;
        color: #eecde8;
        word-break: break-all;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>DesignX QR Set</h1>
      <p class="subtitle">Foreground color is matched to app background and each code includes the centered X mark.</p>
      <section class="grid">
${qrCards}
      </section>
    </main>
  </body>
</html>
`

await fs.writeFile(path.join(outputDir, 'index.html'), indexHtml, 'utf8')

console.log(`Generated ${qrTargets.length} QR codes in ${outputDir}`)
