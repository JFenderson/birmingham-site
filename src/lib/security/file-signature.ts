const FILE_SIGNATURES = {
  "image/jpeg": (bytes: Uint8Array) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes: Uint8Array) => bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value),
  "image/webp": (bytes: Uint8Array) => bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP",
  "application/pdf": (bytes: Uint8Array) => bytes.length >= 5 && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-",
} as const;

export type AllowedFileType = keyof typeof FILE_SIGNATURES;

export async function validateUploadFile(
  file: File,
  allowed: readonly AllowedFileType[],
  maxBytes: number,
): Promise<AllowedFileType | null> {
  if (file.size <= 0 || file.size > maxBytes) return null;
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  for (const type of allowed) {
    if (FILE_SIGNATURES[type](head)) return type;
  }
  return null;
}
