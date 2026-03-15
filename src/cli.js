#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Command, InvalidArgumentError } from 'commander';

import { renderBookletPdf } from './pdf.js';

function parsePositiveInteger(value, label) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new InvalidArgumentError(`${label} must be a positive integer.`);
  }

  return parsed;
}

function formatMaybeBlank(pageNumber) {
  return pageNumber === null ? 'blank' : String(pageNumber);
}

const program = new Command();

program
  .name('a4toa3')
  .description('Convert an A4 PDF into an imposed A3 booklet PDF.')
  .requiredOption('-i, --input <file>', 'Path to the input A4 PDF file')
  .requiredOption('-o, --output <file>', 'Path to the output A3 PDF file')
  .option(
    '-s, --signature-sheets <count>',
    'Sheets per signature (4 sheets = 16 pages)',
    (value) => parsePositiveInteger(value, 'signature-sheets'),
    4,
  )
  .action(async (options) => {
    const inputPath = path.resolve(options.input);
    const outputPath = path.resolve(options.output);
    const inputBytes = await readFile(inputPath);
    const result = await renderBookletPdf({
      inputBytes,
      signatureSheets: options.signatureSheets,
    });

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, result.bytes);

    console.log(`Created ${outputPath}`);
    console.log(`Input pages: ${result.plan.totalPages}`);
    console.log(`Output A3 sides: ${result.plan.outputPageCount}`);
    console.log(`Signatures: ${result.plan.signatureCount}`);
    console.log(`Inserted blank pages: ${result.plan.blankPageCount}`);

    for (const signature of result.plan.signatures) {
      console.log(`\nSignature ${signature.signatureIndex} (${signature.startPage}-${signature.endPage})`);

      for (const sheet of signature.sheets) {
        console.log(
          `  Sheet ${sheet.sheetNumber}: front [${formatMaybeBlank(sheet.front.left)}, ${formatMaybeBlank(sheet.front.right)}] | back [${formatMaybeBlank(sheet.back.left)}, ${formatMaybeBlank(sheet.back.right)}]`,
        );
      }
    }

    console.log('\nPrint the output duplex on A3 landscape sheets, typically using short-edge flip.');
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

