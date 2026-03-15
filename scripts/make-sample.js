import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const pageCount = Number.parseInt(process.argv[2] ?? '16', 10);
const outputPath = path.resolve(process.argv[3] ?? './sample-input.pdf');

if (!Number.isInteger(pageCount) || pageCount <= 0) {
  console.error('Usage: npm run make-sample -- <pageCount> [outputPath]');
  process.exit(1);
}

const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.HelveticaBold);
const pageWidth = 595.28;
const pageHeight = 841.89;

for (let index = 1; index <= pageCount; index += 1) {
  const page = pdf.addPage([pageWidth, pageHeight]);

  page.drawRectangle({
    x: 36,
    y: 36,
    width: pageWidth - 72,
    height: pageHeight - 72,
    borderWidth: 2,
    borderColor: rgb(0.1, 0.1, 0.1),
  });

  page.drawText(`Sample page ${index}`, {
    x: 72,
    y: pageHeight / 2,
    size: 42,
    font,
    color: rgb(0.05, 0.05, 0.7),
  });
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, await pdf.save());
console.log(`Created sample PDF: ${outputPath}`);

