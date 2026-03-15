function assertPositiveInteger(name, value) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

function chunkPages(totalPages, signaturePageCount) {
  const signatures = [];

  for (let startPage = 1; startPage <= totalPages; startPage += signaturePageCount) {
    const endPage = Math.min(startPage + signaturePageCount - 1, totalPages);
    const pages = [];

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    while (pages.length < signaturePageCount) {
      pages.push(null);
    }

    signatures.push({
      startPage,
      endPage,
      pages,
    });
  }

  return signatures;
}

export function buildSignaturePlan(pages, signatureIndex = 1) {
  if (!Array.isArray(pages) || pages.length === 0 || pages.length % 4 !== 0) {
    throw new Error('A signature must contain a non-empty page list whose length is divisible by 4.');
  }

  const sheets = [];
  const sheetCount = pages.length / 4;

  for (let sheetIndex = 0; sheetIndex < sheetCount; sheetIndex += 1) {
    const outerLeftIndex = pages.length - 1 - (sheetIndex * 2);
    const outerRightIndex = sheetIndex * 2;
    const innerLeftIndex = outerRightIndex + 1;
    const innerRightIndex = outerLeftIndex - 1;

    sheets.push({
      signatureIndex,
      sheetNumber: sheetIndex + 1,
      front: {
        left: pages[outerLeftIndex],
        right: pages[outerRightIndex],
      },
      back: {
        left: pages[innerLeftIndex],
        right: pages[innerRightIndex],
      },
    });
  }

  return {
    signatureIndex,
    sheetCount,
    paddedPageCount: pages.length,
    blankPageCount: pages.filter((page) => page === null).length,
    sheets,
  };
}

export function buildBookletPlan(totalPages, options = {}) {
  const signatureSheets = options.signatureSheets ?? 4;
  assertPositiveInteger('totalPages', totalPages);
  assertPositiveInteger('signatureSheets', signatureSheets);

  const signaturePageCount = signatureSheets * 4;
  const signatures = chunkPages(totalPages, signaturePageCount).map((signature, index) => {
    const plan = buildSignaturePlan(signature.pages, index + 1);

    return {
      ...plan,
      startPage: signature.startPage,
      endPage: signature.endPage,
      actualPageCount: signature.endPage - signature.startPage + 1,
      pages: signature.pages,
    };
  });

  const outputPageCount = signatures.reduce((count, signature) => count + (signature.sheets.length * 2), 0);
  const blankPageCount = signatures.reduce((count, signature) => count + signature.blankPageCount, 0);

  return {
    totalPages,
    signatureSheets,
    signaturePageCount,
    signatureCount: signatures.length,
    paddedPageCount: totalPages + blankPageCount,
    blankPageCount,
    outputPageCount,
    signatures,
  };
}

export function flattenSides(plan) {
  return plan.signatures.flatMap((signature) => {
    return signature.sheets.flatMap((sheet) => {
      return [
        {
          signatureIndex: signature.signatureIndex,
          sheetNumber: sheet.sheetNumber,
          side: 'front',
          left: sheet.front.left,
          right: sheet.front.right,
        },
        {
          signatureIndex: signature.signatureIndex,
          sheetNumber: sheet.sheetNumber,
          side: 'back',
          left: sheet.back.left,
          right: sheet.back.right,
        },
      ];
    });
  });
}

