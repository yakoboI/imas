require('dotenv').config();

module.exports = {
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  pdfOptions: {
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    }
  },
  thermalOptions: {
    width: '80mm',
    printBackground: true
  }
};

