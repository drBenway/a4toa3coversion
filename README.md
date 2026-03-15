# a4toa3

A small Node.js CLI that converts an A4 PDF into an A3 landscape booklet PDF.

It reorders pages into booklet signatures so you can duplex-print the result on A3 sheets, fold the sheets in half, and bind them as signatures.

Default behavior uses **4 sheets per signature**, which means **16 A4 pages per signature**.

## Example order

For a 16-page signature, the imposed A3 output is ordered like this:

- Sheet 1 front: `16 | 1`
- Sheet 1 back: `2 | 15`
- Sheet 2 front: `14 | 3`
- Sheet 2 back: `4 | 13`
- Sheet 3 front: `12 | 5`
- Sheet 3 back: `6 | 11`
- Sheet 4 front: `10 | 7`
- Sheet 4 back: `8 | 9`

If the input is not a multiple of the signature size, blank pages are added at the end of the affected signature.

## Requirements

- Node.js 20+

## Install

```bash
npm install
```

## Usage

```bash
node ./src/cli.js --input ./input.pdf --output ./output-booklet.pdf
```

Or after installing dependencies:

```bash
npx a4toa3 --input ./input.pdf --output ./output-booklet.pdf
```

### Options

- `-i, --input <file>`: input PDF
- `-o, --output <file>`: output PDF
- `-s, --signature-sheets <count>`: sheets per signature, default `4`

Example with 3-sheet signatures (12 pages per signature):

```bash
node ./src/cli.js --input ./input.pdf --output ./output-booklet.pdf --signature-sheets 3
```

## Try it quickly

Generate a sample 16-page A4 PDF:

```bash
npm run make-sample -- 16 ./sample-input.pdf
```

Convert it to booklet layout:

```bash
node ./src/cli.js --input ./sample-input.pdf --output ./sample-booklet.pdf
```

## Notes

- The tool assumes the source pages are intended to be printed as single A4 pages.
- Output pages are created in **A3 landscape proportions** by placing two portrait A4 pages side by side.
- For duplex printing, you will usually want your printer set to **short-edge flip**.
- When the document is longer than one signature, the output keeps signatures separate in order: signature 1, then signature 2, and so on.

## Tests

```bash
npm test
```

