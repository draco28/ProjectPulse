/**
 * Screenshot Capture Script for ProjectPulse Marketing Assets
 *
 * Uses Playwright to capture screenshots from HTML mockups
 * Run: node scripts/capture-screenshots.mjs
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const screenshots = [
  {
    name: 'hero-banner',
    source: 'mockups/Default theme/01-dashboard-dark-neumorphic-coral.html',
    output: 'assets/hero-banner.png',
    viewport: { width: 1400, height: 900 },
    description: 'Main dashboard for README hero'
  },
  {
    name: 'phase-timeline',
    source: 'mockups/alternatives/COMBINED-01-phase-timeline.html',
    output: 'assets/phase-timeline.png',
    viewport: { width: 1400, height: 900 },
    description: 'Phase timeline for "How It Works" section'
  },
  {
    name: 'sprint-kanban',
    source: 'mockups/alternatives/COMBINED-02-sprint-kanban.html',
    output: 'assets/sprint-kanban.png',
    viewport: { width: 1400, height: 900 },
    description: 'Sprint Kanban board for feature showcase'
  },
  {
    name: 'agent-sessions',
    source: 'mockups/alternatives/COMBINED-03-agent-sessions.html',
    output: 'assets/agent-sessions.png',
    viewport: { width: 1400, height: 900 },
    description: 'Agent sessions for AI-first differentiation'
  },
  {
    name: 'knowledge-base',
    source: 'mockups/Default theme/03-knowledge-dark-neumorphic-coral.html',
    output: 'assets/knowledge-base.png',
    viewport: { width: 1400, height: 900 },
    description: 'Knowledge base for feature showcase'
  },
  {
    name: 'issues-tracker',
    source: 'mockups/Default theme/02-issues-dark-neumorphic-coral.html',
    output: 'assets/issues-tracker.png',
    viewport: { width: 1400, height: 900 },
    description: 'Issues tracker for feature showcase'
  }
];

async function captureScreenshots() {
  console.log('🎬 Starting screenshot capture...\n');

  // Ensure assets directory exists
  await mkdir(join(projectRoot, 'assets'), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    deviceScaleFactor: 2, // Retina quality
  });

  for (const screenshot of screenshots) {
    const page = await context.newPage();
    await page.setViewportSize(screenshot.viewport);

    const sourcePath = join(projectRoot, screenshot.source);
    const outputPath = join(projectRoot, screenshot.output);

    console.log(`📸 Capturing: ${screenshot.name}`);
    console.log(`   Source: ${screenshot.source}`);
    console.log(`   Output: ${screenshot.output}`);

    try {
      await page.goto(`file://${sourcePath}`, { waitUntil: 'networkidle' });

      // Wait for fonts and animations to settle
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: outputPath,
        fullPage: false,
      });

      console.log(`   ✅ Success!\n`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
    }

    await page.close();
  }

  await browser.close();

  console.log('🎉 Screenshot capture complete!');
  console.log('\nGenerated files:');
  screenshots.forEach(s => console.log(`  - ${s.output}`));
}

// Also create OG image (1200x630 for social sharing)
async function createOGImage() {
  console.log('\n🖼️  Creating OG image for social sharing...\n');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  await page.setViewportSize({ width: 1200, height: 630 });

  // Create a custom HTML page for OG image
  const ogHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 1200px;
          height: 630px;
          background: linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%);
          font-family: 'Inter', system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .bg-pattern {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image:
            radial-gradient(circle at 20% 80%, rgba(255, 139, 106, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(96, 165, 250, 0.1) 0%, transparent 50%);
        }
        .content {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 60px;
        }
        .logo {
          font-size: 28px;
          font-weight: 800;
          color: #FF8B6A;
          letter-spacing: -0.5px;
          margin-bottom: 30px;
        }
        h1 {
          font-size: 56px;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 24px;
          background: linear-gradient(135deg, #FFFFFF 0%, #E0E0E0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .subtitle {
          font-size: 24px;
          color: #A0A0A0;
          margin-bottom: 40px;
        }
        .metrics {
          display: flex;
          gap: 40px;
          justify-content: center;
        }
        .metric {
          text-align: center;
        }
        .metric-value {
          font-size: 36px;
          font-weight: 700;
          color: #FF8B6A;
        }
        .metric-label {
          font-size: 14px;
          color: #808080;
          margin-top: 4px;
        }
        .badge {
          position: absolute;
          bottom: 30px;
          right: 40px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.1);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          color: #A0A0A0;
        }
      </style>
    </head>
    <body>
      <div class="bg-pattern"></div>
      <div class="content">
        <div class="logo">ProjectPulse</div>
        <h1>Project Management<br/>Built for AI Agents</h1>
        <p class="subtitle">The platform where 95% of interactions happen via MCP tools</p>
        <div class="metrics">
          <div class="metric">
            <div class="metric-value">86+</div>
            <div class="metric-label">MCP Tools</div>
          </div>
          <div class="metric">
            <div class="metric-value">98%</div>
            <div class="metric-label">Token Reduction</div>
          </div>
          <div class="metric">
            <div class="metric-value">15</div>
            <div class="metric-label">Auto-Generated Docs</div>
          </div>
        </div>
      </div>
      <div class="badge">
        <span>Open Source</span>
      </div>
    </body>
    </html>
  `;

  await page.setContent(ogHTML, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const outputPath = join(projectRoot, 'public/images/og-image.png');
  await mkdir(join(projectRoot, 'public/images'), { recursive: true });

  await page.screenshot({
    path: outputPath,
    fullPage: false,
  });

  console.log(`✅ OG image created: public/images/og-image.png`);

  await browser.close();
}

// Run both
async function main() {
  await captureScreenshots();
  await createOGImage();

  console.log('\n📋 Next steps:');
  console.log('1. Add hero-banner.png to README.md');
  console.log('2. Reference og-image.png in metadata');
  console.log('3. Use screenshots in landing page components');
}

main().catch(console.error);
