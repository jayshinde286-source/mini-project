import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "/Users/jayshinde/Downloads/Mark sheet Mini Project TE Sem V 2026-27.xlsx";
const outputDir = "/Users/jayshinde/Documents/mini project/tmp/sheets/mark-sheet";
await fs.mkdir(outputDir, { recursive: true });

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheetInfo = await workbook.inspect({
  kind: "workbook,sheet,table",
  include: "id,name,values,formulas",
  maxChars: 30000,
  tableMaxRows: 30,
  tableMaxCols: 20,
  tableMaxCellChars: 200,
});
await fs.writeFile(path.join(outputDir, "overview.ndjson"), sheetInfo.ndjson, "utf8");
console.log(sheetInfo.ndjson);

for (const sheet of workbook.worksheets.items) {
  const safeName = sheet.name.replace(/[^a-zA-Z0-9_-]+/g, "_");
  const used = sheet.getUsedRange();
  if (used) {
    const region = await workbook.inspect({
      kind: "region,formula,computedStyle",
      sheetId: sheet.name,
      range: used.address,
      maxChars: 30000,
      tableMaxRows: 120,
      tableMaxCols: 30,
      tableMaxCellChars: 250,
      options: { maxResults: 300 },
    });
    await fs.writeFile(path.join(outputDir, `${safeName}.ndjson`), region.ndjson, "utf8");
  }
  const preview = await workbook.render({
    sheetName: sheet.name,
    autoCrop: "all",
    scale: 1.25,
    format: "png",
  });
  await fs.writeFile(path.join(outputDir, `${safeName}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const marksSheet = workbook.worksheets.getItem("TE Mini Project Marksheet");
const allValues = marksSheet.getRange("A1:AF309").values;
const allFormulas = marksSheet.getRange("A1:AF309").formulas;
await fs.writeFile(
  path.join(outputDir, "all-values.json"),
  JSON.stringify({ values: allValues, formulas: allFormulas }, null, 2),
  "utf8",
);
