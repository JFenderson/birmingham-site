import { inflateRawSync } from "node:zlib";
import { validateUploadFile } from "@/lib/security/file-signature";
import { DOCX_MIME } from "./application";

const MAX_ESSAY_BYTES = 5_000_000;
const MAX_UNCOMPRESSED_BYTES = 30_000_000;
const MAX_MANIFEST_BYTES = 1_000_000;

type ZipEntry = {
  name: string;
  method: number;
  compressedSize: number;
  size: number;
  localOffset: number;
};

function readDocxEntries(bytes: Buffer): Map<string, ZipEntry> | null {
  // DOCX is a ZIP archive. Read its central directory without extracting its
  // contents, so an uploaded ZIP cannot expand unboundedly on the server.
  let end = -1;
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 22 - 65_535); at--) {
    if (bytes.readUInt32LE(at) === 0x06054b50 && at + 22 + bytes.readUInt16LE(at + 20) === bytes.length) {
      end = at;
      break;
    }
  }
  if (end < 0 || bytes.readUInt16LE(end + 4) !== 0 || bytes.readUInt16LE(end + 6) !== 0) return null;
  const count = bytes.readUInt16LE(end + 10);
  const directorySize = bytes.readUInt32LE(end + 12);
  const directoryOffset = bytes.readUInt32LE(end + 16);
  if (count < 3 || count > 500 || directoryOffset + directorySize !== end) return null;

  const entries = new Map<string, ZipEntry>();
  let cursor = directoryOffset;
  let totalSize = 0;
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > end || bytes.readUInt32LE(cursor) !== 0x02014b50) return null;
    const flags = bytes.readUInt16LE(cursor + 8);
    const method = bytes.readUInt16LE(cursor + 10);
    const compressedSize = bytes.readUInt32LE(cursor + 20);
    const size = bytes.readUInt32LE(cursor + 24);
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    const localOffset = bytes.readUInt32LE(cursor + 42);
    const next = cursor + 46 + nameLength + extraLength + commentLength;
    if ((flags & 1) !== 0 || (method !== 0 && method !== 8) || nameLength === 0 || nameLength > 512 || next > end) return null;
    totalSize += size;
    if (totalSize > MAX_UNCOMPRESSED_BYTES) return null;
    const name = bytes.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    if (entries.has(name) || name.startsWith("/") || name.split("/").includes("..")) return null;
    if (localOffset + 30 > directoryOffset || bytes.readUInt32LE(localOffset) !== 0x04034b50) return null;
    if (bytes.readUInt16LE(localOffset + 6) !== flags || bytes.readUInt16LE(localOffset + 8) !== method) return null;
    const localNameLength = bytes.readUInt16LE(localOffset + 26);
    const localExtraLength = bytes.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    if (dataOffset + compressedSize > directoryOffset) return null;
    if (bytes.toString("utf8", localOffset + 30, localOffset + 30 + localNameLength) !== name) return null;
    entries.set(name, { name, method, compressedSize, size, localOffset });
    cursor = next;
  }
  return cursor === end ? entries : null;
}

function readManifest(bytes: Buffer, entry: ZipEntry) {
  if (entry.size > MAX_MANIFEST_BYTES || entry.compressedSize > MAX_MANIFEST_BYTES) return null;
  const nameLength = bytes.readUInt16LE(entry.localOffset + 26);
  const extraLength = bytes.readUInt16LE(entry.localOffset + 28);
  const start = entry.localOffset + 30 + nameLength + extraLength;
  const compressed = bytes.subarray(start, start + entry.compressedSize);
  const content = entry.method === 8
    ? inflateRawSync(compressed, { maxOutputLength: MAX_MANIFEST_BYTES })
    : compressed;
  return content.length === entry.size ? content.toString("utf8") : null;
}

/** Inspect file bytes and DOCX structure; extensions and browser MIME types are untrusted. */
export async function validateEssayFile(file: File) {
  if (await validateUploadFile(file, ["application/pdf"], MAX_ESSAY_BYTES)) {
    return "application/pdf" as const;
  }
  if (file.size <= 0 || file.size > MAX_ESSAY_BYTES) return null;

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length < 4 || bytes.readUInt32LE(0) !== 0x04034b50) return null;
  try {
    const entries = readDocxEntries(bytes);
    if (!entries || !["[Content_Types].xml", "_rels/.rels", "word/document.xml"].every((name) => entries.has(name))) return null;
    if ([...entries.values()].some((entry) => /vbaProject\.bin|(^|\/)activeX\/|(^|\/)embeddings\//i.test(entry.name))) return null;
    if (!entries.get("word/document.xml")?.size) return null;
    const manifest = readManifest(bytes, entries.get("[Content_Types].xml")!);
    if (!manifest?.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml")) return null;
    if (/macroEnabled|vbaProject/i.test(manifest)) return null;
    return DOCX_MIME;
  } catch {
    return null;
  }
}
