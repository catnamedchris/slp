const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const tables = [
  { name: 'Table-A1-Raw-Scores-to-Age-Equivalents', startPage: 1, endPage: 3 },
  { name: 'Table-B13-Raw-Scores-to-Standard-Scores-Age-12-13-Months', startPage: 4, endPage: 5 },
  { name: 'Table-B14-Raw-Scores-to-Standard-Scores-Age-14-15-Months', startPage: 6, endPage: 7 },
  { name: 'Table-B15-Raw-Scores-to-Standard-Scores-Age-16-18-Months', startPage: 8, endPage: 9 },
  { name: 'Table-B16-Raw-Scores-to-Standard-Scores-Age-19-21-Months', startPage: 10, endPage: 11 },
  { name: 'Table-B17-Raw-Scores-to-Standard-Scores-Age-22-24-Months', startPage: 12, endPage: 13 },
  { name: 'Table-B18-Raw-Scores-to-Standard-Scores-Age-25-27-Months', startPage: 14, endPage: 15 },
  { name: 'Table-B19-Raw-Scores-to-Standard-Scores-Age-28-30-Months', startPage: 16, endPage: 17 },
  { name: 'Table-B20-Raw-Scores-to-Standard-Scores-Age-31-33-Months', startPage: 18, endPage: 19 },
  { name: 'Table-B21-Raw-Scores-to-Standard-Scores-Age-34-36-Months', startPage: 20, endPage: 21 },
  { name: 'Table-B22-Raw-Scores-to-Standard-Scores-Age-37-39-Months', startPage: 22, endPage: 23 },
  { name: 'Table-B23-Raw-Scores-to-Standard-Scores-Age-40-42-Months', startPage: 24, endPage: 25 },
  { name: 'Table-B24-Raw-Scores-to-Standard-Scores-Age-43-45-Months', startPage: 26, endPage: 27 },
  { name: 'Table-B25-Raw-Scores-to-Standard-Scores-Age-46-48-Months', startPage: 28, endPage: 29 },
  { name: 'Table-B26-Raw-Scores-to-Standard-Scores-Age-49-53-Months', startPage: 30, endPage: 31 },
  { name: 'Table-B27-Raw-Scores-to-Standard-Scores-Age-54-59-Months', startPage: 32, endPage: 33 },
  { name: 'Table-B28-Raw-Scores-to-Standard-Scores-Age-60-65-Months', startPage: 34, endPage: 35 },
  { name: 'Table-B29-Raw-Scores-to-Standard-Scores-Age-66-71-Months', startPage: 36, endPage: 37 },
  { name: 'Table-C1-Standard-Scores-to-Percentile-Ranks', startPage: 38, endPage: 38 },
  { name: 'Table-D1-Sums-of-Subdomain-Standard-Scores-to-Domain-Standard-Scores', startPage: 39, endPage: 39 },
];

async function splitPdf() {
  const inputPath = path.join(__dirname, '../assets/dayc/DAYC2 Scoring Manual.pdf');
  const outputDir = path.join(__dirname, '../assets/dayc/tables');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  for (const table of tables) {
    const newPdf = await PDFDocument.create();
    const pageIndices = [];
    
    for (let i = table.startPage - 1; i <= table.endPage - 1; i++) {
      pageIndices.push(i);
    }

    const pages = await newPdf.copyPages(pdfDoc, pageIndices);
    pages.forEach(page => newPdf.addPage(page));

    const outputBytes = await newPdf.save();
    const outputPath = path.join(outputDir, `${table.name}.pdf`);
    fs.writeFileSync(outputPath, outputBytes);
    console.log(`Created: ${table.name}.pdf`);
  }

  console.log('\nDone! All tables extracted to assets/tables/');
}

splitPdf().catch(console.error);
