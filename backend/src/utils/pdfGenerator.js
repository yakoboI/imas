const puppeteer = require('puppeteer');
const pdfConfig = require('../config/pdf');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Function to find Chrome executable
function findChromeExecutable() {
  const platform = os.platform();
  const possiblePaths = [];
  
  // Check environment variable first (highest priority)
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  
  if (platform === 'win32') {
    // Common Chrome installation paths on Windows
    possiblePaths.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
    );
    
    // Check Puppeteer's bundled Chrome (installed via: npx puppeteer browsers install chrome)
    const puppeteerCache = path.join(os.homedir(), '.cache', 'puppeteer');
    if (fs.existsSync(puppeteerCache)) {
      // Look for chrome.exe in subdirectories
      // Structure: .cache/puppeteer/chrome/{version}/chrome-win64/chrome.exe
      try {
        // Check if there's a 'chrome' subdirectory
        const chromeDir = path.join(puppeteerCache, 'chrome');
        if (fs.existsSync(chromeDir)) {
          const versionDirs = fs.readdirSync(chromeDir);
          for (const versionDir of versionDirs) {
            const chromePath = path.join(chromeDir, versionDir, 'chrome-win64', 'chrome.exe');
            if (fs.existsSync(chromePath)) {
              possiblePaths.push(chromePath);
            }
          }
        }
        // Also check direct subdirectories (older Puppeteer versions)
        const subdirs = fs.readdirSync(puppeteerCache);
        for (const subdir of subdirs) {
          if (subdir !== 'chrome') {
            const chromePath = path.join(puppeteerCache, subdir, 'chrome-win64', 'chrome.exe');
            if (fs.existsSync(chromePath)) {
              possiblePaths.push(chromePath);
            }
          }
        }
      } catch (err) {
        // Ignore errors reading directory
      }
    }
  } else if (platform === 'darwin') {
    // macOS
    possiblePaths.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    
    // Check Puppeteer's bundled Chrome
    const puppeteerCache = path.join(os.homedir(), '.cache', 'puppeteer');
    if (fs.existsSync(puppeteerCache)) {
      try {
        const subdirs = fs.readdirSync(puppeteerCache);
        for (const subdir of subdirs) {
          const chromePath = path.join(puppeteerCache, subdir, 'chrome-mac-x64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing');
          if (fs.existsSync(chromePath)) {
            possiblePaths.push(chromePath);
          }
        }
      } catch (err) {
        // Ignore errors
      }
    }
  } else if (platform === 'linux') {
    // Linux
    possiblePaths.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    );
    
    // Check Puppeteer's bundled Chrome
    const puppeteerCache = path.join(os.homedir(), '.cache', 'puppeteer');
    if (fs.existsSync(puppeteerCache)) {
      try {
        const subdirs = fs.readdirSync(puppeteerCache);
        for (const subdir of subdirs) {
          const chromePath = path.join(puppeteerCache, subdir, 'chrome-linux64', 'chrome');
          if (fs.existsSync(chromePath)) {
            possiblePaths.push(chromePath);
          }
        }
      } catch (err) {
        // Ignore errors
      }
    }
  }
  
  // Try each path
  for (const chromePath of possiblePaths) {
    if (chromePath && fs.existsSync(chromePath)) {
      return chromePath;
    }
  }
  
  return null;
}

async function generatePDF(html, templateType = 'a4') {
  let launchOptions = { ...pdfConfig.puppeteer };
  
  // Try to find Chrome executable
  const chromePath = findChromeExecutable();
  if (chromePath) {
    launchOptions.executablePath = chromePath;
    console.log(`Using Chrome at: ${chromePath}`);
  } else {
    // If Chrome not found, try to use Puppeteer's bundled Chrome
    // This will work if Chrome was installed via: npx puppeteer browsers install chrome
    console.warn('System Chrome not found. Attempting to use Puppeteer bundled Chrome...');
    console.warn('If this fails, install Chrome via: npx puppeteer browsers install chrome');
  }

  let browser;
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (error) {
    // If launch fails, provide helpful error message
    if (error.message.includes('Could not find Chrome')) {
      throw new Error(
        'Chrome browser not found. Please either:\n' +
        '1. Install Chrome browser on your system, or\n' +
        '2. Run: npx puppeteer browsers install chrome\n' +
        '3. Set CHROME_PATH environment variable to your Chrome executable path'
      );
    }
    throw error;
  }

  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });

    let pdfOptions = pdfConfig.pdfOptions;

    if (templateType === 'thermal') {
      pdfOptions = {
        ...pdfConfig.thermalOptions,
        printBackground: true
      };
    }

    const pdfBuffer = await page.pdf(pdfOptions);
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { generatePDF };

