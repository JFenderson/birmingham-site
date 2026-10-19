import { inflateRawSync } from "node:zlib";
import { z } from "zod";
import { sizeSystems, widths } from "./model";

export const importRowSchema = z.object({
  externalRef: z.string().trim().min(1).max(120),
  schoolCode: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9_-]+$/, "Use a short school code without spaces."),
  sizeSystem: z.enum(sizeSystems),
  shoeSize: z.string().trim().regex(/^(?:[1-9]|1[0-6])(?:\.5)?$/, "Use a numeric US shoe size, such as 4 or 4.5."),
  width: z.enum(widths),
  shoeType: z.string().trim().min(1).max(80),
  purchaseNote: z.string().trim().max(300),
}).refine((row) => {
  const size = Number(row.shoeSize);
  return row.sizeSystem === "youth" ? size <= 7
    : row.sizeSystem === "adult" ? size >= 4 && size <= 16
      : row.sizeSystem === "toddler" ? size <= 13
        : size <= 13.5;
}, { message: "Shoe size is outside the selected size system." });
export type ShoeImportRow = z.infer<typeof importRowSchema>;

export function csvRecords(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      if (quoted && csv[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === "," && !quoted) { row.push(field); field = ""; }
    else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && csv[i + 1] === "\n") i++;
      row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (quoted) throw new Error("Unclosed quoted CSV field.");
  row.push(field); if (row.some(Boolean)) rows.push(row);
  return rows;
}

function xmlText(value: string) {
  return value.replace(/&#(x[0-9a-f]+|\d+);|&(amp|lt|gt|quot|apos);/gi, (match, numeric: string | undefined, named: string | undefined) => {
    if (numeric) {
      const code = numeric.startsWith("x") ? parseInt(numeric.slice(1), 16) : parseInt(numeric, 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    }
    return named ? ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" } as Record<string,string>)[named] ?? match : match;
  });
}

// Minimal XLSX reader for the first worksheet. Only values are imported;
// macros, formulas and external links are never evaluated.
export function xlsxRecords(buffer: Buffer): string[][] {
  if (buffer.length > 2_000_000) throw new Error("Spreadsheet is too large (2 MB maximum).");
  const files = new Map<string, Buffer>();
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65_557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw new Error("Invalid XLSX ZIP directory.");
  const entries = buffer.readUInt16LE(end + 10);
  if (entries > 200) throw new Error("Spreadsheet has too many ZIP entries.");
  let position = buffer.readUInt32LE(end + 16), totalUncompressed = 0;
  for (let i = 0; i < entries; i++) {
    if (position + 46 > buffer.length || buffer.readUInt32LE(position) !== 0x02014b50) throw new Error("Invalid XLSX ZIP entry.");
    const flags = buffer.readUInt16LE(position + 8);
    const method = buffer.readUInt16LE(position + 10);
    const compressed = buffer.readUInt32LE(position + 20);
    const uncompressed = buffer.readUInt32LE(position + 24);
    const nameLength = buffer.readUInt16LE(position + 28);
    const extraLength = buffer.readUInt16LE(position + 30);
    const commentLength = buffer.readUInt16LE(position + 32);
    const localOffset = buffer.readUInt32LE(position + 42);
    if (flags & 1 || uncompressed === 0xffffffff || compressed === 0xffffffff || (totalUncompressed += uncompressed) > 12_000_000) throw new Error("Spreadsheet exceeds safety limits.");
    const name = buffer.subarray(position + 46, position + 46 + nameLength).toString("utf8");
    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error("Invalid XLSX ZIP data.");
    const start = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
    if (start + compressed > buffer.length) throw new Error("Invalid XLSX ZIP bounds.");
    if (name === "xl/sharedStrings.xml" || name === "xl/worksheets/sheet1.xml") {
      const bytes = buffer.subarray(start, start + compressed);
      const contents = method === 0 ? bytes : method === 8 ? inflateRawSync(bytes, { maxOutputLength: 12_000_000 }) : null;
      if (!contents) throw new Error("Unsupported spreadsheet compression.");
      files.set(name, contents);
    }
    position += 46 + nameLength + extraLength + commentLength;
  }
  const sheet = files.get("xl/worksheets/sheet1.xml")?.toString("utf8");
  if (!sheet) throw new Error("First worksheet was not found in the XLSX file.");
  const shared = [...(files.get("xl/sharedStrings.xml")?.toString("utf8") ?? "").matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)]
    .map((match) => xmlText([...(match[1] ?? "").matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((part) => part[1] ?? "").join("")));
  const rows: string[][] = [];
  for (const rowMatch of sheet.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)) {
    const row: string[] = [];
    for (const cell of (rowMatch[1] ?? "").matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const address = /\br="([A-Z]+)\d+"/.exec(cell[1] ?? "")?.[1];
      if (!address) continue;
      let index = 0;
      for (const letter of address) index = index * 26 + letter.charCodeAt(0) - 64;
      if (index > 40) throw new Error("Spreadsheet has too many columns.");
      const raw = /<v>([\s\S]*?)<\/v>/.exec(cell[2] ?? "")?.[1] ?? /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/.exec(cell[2] ?? "")?.[1] ?? "";
      const type = /\bt="([^"]+)"/.exec(cell[1] ?? "")?.[1];
      row[index - 1] = type === "s" ? shared[Number(raw)] ?? "" : xmlText(raw);
    }
    if (row.some(Boolean)) rows.push(row);
    if (rows.length > 501) throw new Error("Import at most 500 rows at a time.");
  }
  return rows;
}

export function parseShoeImport(records: string[][]): { rows: ShoeImportRow[]; errors: string[] } {
  if (records.length < 2) return { rows: [], errors: ["The file needs a header and at least one request."] };
  const headers = (records[0] ?? []).map((value) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  const columns = ["externalrequestreference","schoolcode","shoesizesystem","shoesize","shoewidth","shoetype","quantity","optionalapprovedpurchasenotes"];
  const indices = columns.map((name) => headers.indexOf(name));
  if (indices.slice(0, 7).some((index) => index < 0)) return { rows: [], errors: ["Required columns: External Request Reference, School Code, Shoe Size System, Shoe Size, Shoe Width, Shoe Type, Quantity."] };
  const rows: ShoeImportRow[] = [], errors: string[] = [], seen = new Set<string>();
  for (let i = 1; i < records.length; i++) {
    const cells = records[i] ?? [];
    const values = indices.map((index) => index < 0 ? "" : (cells[index] ?? "").trim());
    const quantity = Number(values[6]);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) { errors.push(`Row ${i + 1}: quantity must be 1–20.`); continue; }
    const system = (values[2] ?? "").toLowerCase().replace(/[\s_]+/g, "-");
    const width = (values[4] ?? "").toLowerCase().replace(/[\s_]+/g, "-");
    const size = (values[3] ?? "").replace(/^(toddler|little kid|little-kid|youth|adult)\s*/i, "");
    for (let unit = 1; unit <= quantity; unit++) {
      const row = importRowSchema.safeParse({
        externalRef: `${values[0]}#${unit}`, schoolCode: values[1], sizeSystem: system,
        shoeSize: size, width, shoeType: values[5], purchaseNote: values[7],
      });
      if (!row.success) { errors.push(`Row ${i + 1}: ${row.error.issues[0]?.message ?? "Invalid data"}`); break; }
      if (seen.has(row.data.externalRef)) { errors.push(`Row ${i + 1}: duplicate external reference ${values[0]}.`); break; }
      seen.add(row.data.externalRef); rows.push(row.data);
    }
    if (rows.length > 500) { errors.push("Import at most 500 pairs at a time."); break; }
  }
  return { rows: errors.length ? [] : rows, errors: errors.slice(0, 30) };
}

export async function readShoeImport(file: File) {
  if (file.size > 2_000_000) throw new Error("File exceeds 2 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const records = file.name.toLowerCase().endsWith(".xlsx") ? xlsxRecords(bytes) : csvRecords(bytes.toString("utf8").replace(/^\uFEFF/, ""));
  return parseShoeImport(records);
}

export const donationRowSchema = z.object({
  transactionId: z.string().trim().min(3).max(120),
  amountCents: z.number().int().min(0),
  refundedCents: z.number().int().min(0),
  currency: z.literal("USD"),
  status: z.enum(["succeeded","pending","failed","refunded","partially_refunded","review"]),
  donorReference: z.string().trim().max(160),
  paidAt: z.string().datetime({ offset: true }).or(z.literal("")),
}).refine((value) => value.refundedCents <= value.amountCents)
  .refine((value) => value.status !== "refunded" || value.refundedCents === value.amountCents)
  .refine((value) => value.status !== "succeeded" || value.refundedCents === 0);

export async function readDonationImport(file: File) {
  if (file.size > 2_000_000 || !file.name.toLowerCase().endsWith(".csv")) throw new Error("Choose a CSV file up to 2 MB.");
  const records = csvRecords((await file.text()).replace(/^\uFEFF/, ""));
  const headers = (records.shift() ?? []).map((value) => value.toLowerCase().trim().replace(/[^a-z0-9]/g, ""));
  const names = ["zeffytransactionid","amountusd","refundedusd","currency","status","donorreference","paidat"];
  const indexes = names.map((name) => headers.indexOf(name));
  if (indexes.slice(0, 5).some((index) => index < 0)) throw new Error("CSV columns must include Zeffy Transaction ID, Amount USD, Refunded USD, Currency, and Status.");
  if (records.length < 1 || records.length > 500) throw new Error("Import 1–500 transactions per file.");
  const rows: z.infer<typeof donationRowSchema>[] = [], seen = new Set<string>();
  for (const [i, cells] of records.entries()) {
    const values = indexes.map((index) => index < 0 ? "" : (cells[index] ?? "").trim());
    const amountCents = Math.round(Number(values[1]) * 100);
    const refundedCents = Math.round(Number(values[2] || "0") * 100);
    const parsed = donationRowSchema.safeParse({
      transactionId: values[0], amountCents, refundedCents, currency: (values[3] ?? "").toUpperCase(),
      status: (values[4] ?? "").toLowerCase(), donorReference: values[5], paidAt: values[6],
    });
    if (!parsed.success || !Number.isFinite(amountCents) || !Number.isFinite(refundedCents)) throw new Error(`Donation row ${i + 2} is invalid.`);
    if (seen.has(parsed.data.transactionId)) throw new Error(`Duplicate transaction ID at row ${i + 2}.`);
    seen.add(parsed.data.transactionId); rows.push(parsed.data);
  }
  return rows;
}
