import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidIranianNationalId,
  normalizeMobileForImport,
  normalizeNationalIdForImport,
  validateUserImportRows,
} from "../src/utils/userSpreadsheet.js";

test("restores the leading zeroes removed by Excel", () => {
  assert.equal(normalizeNationalIdForImport("123456789"), "0123456789");
  assert.equal(normalizeMobileForImport("9123456789"), "09123456789");
  assert.equal(isValidIranianNationalId("0123456789"), true);
});

test("normalizes Persian and Arabic digits", () => {
  assert.equal(normalizeNationalIdForImport("۰۱۲۳۴۵۶۷۸۹"), "0123456789");
  assert.equal(normalizeMobileForImport("٠٩١٢٣٤٥٦٧٨٩"), "09123456789");
});

test("does not truncate longer-than-valid identifiers", () => {
  assert.equal(normalizeNationalIdForImport("00123456789"), "00123456789");
  assert.equal(normalizeMobileForImport("009123456789"), "009123456789");
});

test("rejects bad checksum and invalid mobile formats", () => {
  const [row] = validateUserImportRows([{ national_id: "0123456780", mobile: "12345" }]);
  assert.ok(row.errors.some((error) => error.includes("کد ملی")));
  assert.ok(row.errors.some((error) => error.includes("موبایل")));
});

test("requires only national ID and mobile", () => {
  const [row] = validateUserImportRows([{ national_id: "0123456789", mobile: "09123456789" }]);
  assert.deepEqual(row.errors, []);
});

test("marks both rows when a valid national id appears more than once", () => {
  const rows = validateUserImportRows([
    { national_id: "0123456789", mobile: "09123456789" },
    { national_id: "0123456789", mobile: "09123456780" },
  ]);
  assert.ok(rows.every((row) => row.errors.some((error) => error.includes("تکراری"))));
});


function storedZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const [name, content] of Object.entries(entries)) {
    const nameBytes = Buffer.from(name);
    const dataBytes = Buffer.from(content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(dataBytes.length, 18);
    local.writeUInt32LE(dataBytes.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    localParts.push(local, nameBytes, dataBytes);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(dataBytes.length, 20);
    central.writeUInt32LE(dataBytes.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBytes);
    offset += local.length + nameBytes.length + dataBytes.length;
  }
  const centralSize = centralParts.reduce((size, part) => size + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(entries).length, 8);
  end.writeUInt16LE(Object.keys(entries).length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  const zip = Buffer.concat([...localParts, ...centralParts, end]);
  return zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength);
}

test("reads XLSX data from the first non-empty worksheet", async () => {
  const workbook = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    '<sheets><sheet name="Blank" sheetId="1" r:id="rId1"/><sheet name="Users" sheetId="2" r:id="rId2"/></sheets>',
    '</workbook>',
  ].join("");
  const relationships = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/>',
    '<Relationship Id="rId2" Target="worksheets/sheet2.xml"/></Relationships>',
  ].join("");
  const blankSheet = '<worksheet><sheetData></sheetData></worksheet>';
  const usersSheet = [
    '<worksheet><sheetData>',
    '<row r="1"><c r="A1" t="inlineStr"><is><t>کد ملی</t></is></c><c r="B1" t="inlineStr"><is><t>موبایل</t></is></c></row>',
    '<row r="2"><c r="A2" t="inlineStr"><is><t>0123456789</t></is></c><c r="B2" t="inlineStr"><is><t>09123456789</t></is></c></row>',
    '</sheetData></worksheet>',
  ].join("");
  const buffer = storedZip({
    "xl/workbook.xml": workbook,
    "xl/_rels/workbook.xml.rels": relationships,
    "xl/worksheets/sheet1.xml": blankSheet,
    "xl/worksheets/sheet2.xml": usersSheet,
  });
  const file = {
    name: "users.xlsx",
    size: buffer.byteLength,
    arrayBuffer: async () => buffer,
  };

  const { readUserSpreadsheet } = await import("../src/utils/userSpreadsheet.js");
  const rows = await readUserSpreadsheet(file);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].national_id, "0123456789");
  assert.equal(rows[0].mobile, "09123456789");
  assert.deepEqual(rows[0].errors, []);
});
