import { PDFDocument } from 'pdf-lib';

import { buildBookletPlan, flattenSides } from './imposition.js';

function getPortraitDimensions(page) {
  const { width, height } = page.getSize();

  return {
    width: Math.min(width, height),
    height: Math.max(width, height),
  };
}

function computePlacement(embeddedPage, slot) {
  const scale = Math.min(slot.width / embeddedPage.width, slot.height / embeddedPage.height);
  const drawWidth = embeddedPage.width * scale;
  const drawHeight = embeddedPage.height * scale;

  return {
    x: slot.x + ((slot.width - drawWidth) / 2),
    y: slot.y + ((slot.height - drawHeight) / 2),
    width: drawWidth,
    height: drawHeight,
  };
}

function hasRenderableContents(sourcePage) {
  const contents = sourcePage?.node?.Contents?.();

  if (!contents) {
    return false;
  }

  if (typeof contents.size === 'function') {
    return contents.size() > 0;
  }

  return true;
}

async function embedSourcePage(targetPdf, sourcePage, cache, key) {
  if (cache.has(key)) {
    return cache.get(key);
  }

  try {
    const embedded = await targetPdf.embedPage(sourcePage);
    cache.set(key, embedded);
    return embedded;
  } catch (error) {
    if (error instanceof Error && error.message.includes('missing Contents')) {
      cache.set(key, null);
      return null;
    }

    throw error;
  }
}

export async function renderBookletPdf(options) {
  const { inputBytes, signatureSheets = 4 } = options;

  if (!inputBytes) {
    throw new Error('inputBytes is required.');
  }

  const sourcePdf = await PDFDocument.load(inputBytes);
  const totalPages = sourcePdf.getPageCount();

  if (totalPages === 0) {
    throw new Error('The input PDF does not contain any pages.');
  }

  const plan = buildBookletPlan(totalPages, { signatureSheets });
  const sourcePages = sourcePdf.getPages();
  const firstPageSize = getPortraitDimensions(sourcePages[0]);
  const outputPdf = await PDFDocument.create();
  const embeddedCache = new Map();
  const slotWidth = firstPageSize.width;
  const sheetWidth = slotWidth * 2;
  const sheetHeight = firstPageSize.height;
  const slots = {
    left: { x: 0, y: 0, width: slotWidth, height: sheetHeight },
    right: { x: slotWidth, y: 0, width: slotWidth, height: sheetHeight },
  };

  for (const side of flattenSides(plan)) {
    const page = outputPdf.addPage([sheetWidth, sheetHeight]);

    for (const placement of [
      { pageNumber: side.left, slot: slots.left },
      { pageNumber: side.right, slot: slots.right },
    ]) {
      if (placement.pageNumber === null) {
        continue;
      }

      const sourcePage = sourcePages[placement.pageNumber - 1];

      if (!hasRenderableContents(sourcePage)) {
        continue;
      }

      const embeddedPage = await embedSourcePage(outputPdf, sourcePage, embeddedCache, placement.pageNumber);

      if (embeddedPage === null) {
        continue;
      }

      const drawOptions = computePlacement(embeddedPage, placement.slot);
      page.drawPage(embeddedPage, drawOptions);
    }
  }

  return {
    bytes: await outputPdf.save(),
    plan,
    sheetSize: {
      width: sheetWidth,
      height: sheetHeight,
    },
  };
}



