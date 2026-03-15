import test from 'node:test';
import assert from 'node:assert/strict';

import { PDFDocument } from 'pdf-lib';

import { buildBookletPlan, flattenSides } from '../src/imposition.js';
import { renderBookletPdf } from '../src/pdf.js';

test('buildBookletPlan reproduces the 16-page example signature', () => {
  const plan = buildBookletPlan(16, { signatureSheets: 4 });
  const signature = plan.signatures[0];

  assert.equal(plan.signatureCount, 1);
  assert.deepEqual(signature.sheets.map((sheet) => sheet.front), [
    { left: 16, right: 1 },
    { left: 14, right: 3 },
    { left: 12, right: 5 },
    { left: 10, right: 7 },
  ]);
  assert.deepEqual(signature.sheets.map((sheet) => sheet.back), [
    { left: 2, right: 15 },
    { left: 4, right: 13 },
    { left: 6, right: 11 },
    { left: 8, right: 9 },
  ]);
});

test('buildBookletPlan pads incomplete signatures with blanks', () => {
  const plan = buildBookletPlan(20, { signatureSheets: 4 });
  const secondSignature = plan.signatures[1];

  assert.equal(plan.signatureCount, 2);
  assert.equal(plan.blankPageCount, 12);
  assert.equal(secondSignature.blankPageCount, 12);
  assert.deepEqual(secondSignature.sheets[0], {
    signatureIndex: 2,
    sheetNumber: 1,
    front: { left: null, right: 17 },
    back: { left: 18, right: null },
  });
});

test('flattenSides returns front/back output order for each sheet', () => {
  const plan = buildBookletPlan(8, { signatureSheets: 2 });

  assert.deepEqual(flattenSides(plan), [
    { signatureIndex: 1, sheetNumber: 1, side: 'front', left: 8, right: 1 },
    { signatureIndex: 1, sheetNumber: 1, side: 'back', left: 2, right: 7 },
    { signatureIndex: 1, sheetNumber: 2, side: 'front', left: 6, right: 3 },
    { signatureIndex: 1, sheetNumber: 2, side: 'back', left: 4, right: 5 },
  ]);
});

test('renderBookletPdf creates A3 landscape output pages', async () => {
  const inputPdf = await PDFDocument.create();

  for (let index = 0; index < 5; index += 1) {
    inputPdf.addPage([595.28, 841.89]);
  }

  const { bytes, plan, sheetSize } = await renderBookletPdf({
    inputBytes: await inputPdf.save(),
    signatureSheets: 2,
  });

  const outputPdf = await PDFDocument.load(bytes);

  assert.equal(plan.outputPageCount, 4);
  assert.equal(outputPdf.getPageCount(), 4);
  assert.ok(sheetSize.width > sheetSize.height);
  assert.equal(Math.round(sheetSize.width), Math.round(595.28 * 2));
  assert.equal(Math.round(sheetSize.height), Math.round(841.89));
});

test('renderBookletPdf reports a readable error for malformed input PDFs', async () => {
  await assert.rejects(
    () => renderBookletPdf({
      inputBytes: Buffer.from('not-a-pdf'),
      signatureSheets: 2,
    }),
    /Failed to read input PDF:/,
  );
});

