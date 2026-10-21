import assert from "node:assert/strict";
import test from "node:test";
import {
  DOCX_MIME,
  getScholarshipContentType,
  isScholarshipOpen,
  scholarshipApplicationSchema,
} from "../src/lib/scholarship/application";
import { validateEssayFile } from "../src/lib/scholarship/validate-essay-file";

function sampleApplication() {
  return {
    legalName: "Jordan Example", email: "jordan@example.com", address: "1 Main Street, Birmingham, AL",
    school: "Local High School", phone: "2055550100", dateOfBirth: "2009-03-01", age: 17,
    citizenship: "U.S. citizen", race: "Prefer not to answer", ethnicity: "Prefer not to answer",
    gpa: 3.4, major: "Engineering", intendedSchool: "Example University", eligibility: "yes", agreement: "yes", website: "",
  };
}

function sampleDocx(extraEntry?: string) {
  const files = [
    ["[Content_Types].xml", '<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
    ["_rels/.rels", "<Relationships/>"],
    ["word/document.xml", "<document/>"],
    ...(extraEntry ? [[extraEntry, "unsafe"]] : []),
  ];
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of files) {
    const filename = Buffer.from(name!);
    const data = Buffer.from(text!);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(filename.length, 26);
    localParts.push(local, filename, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(filename.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, filename);
    offset += local.length + filename.length + data.length;
  }
  const directory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  const zip = Buffer.concat([...localParts, directory, end]);
  return new File([new Uint8Array(zip)], "essay.docx", { type: DOCX_MIME });
}

test("scholarship closes immediately after January 27, 2027 Central time", () => {
  assert.equal(isScholarshipOpen(new Date("2027-01-28T05:59:59Z")), true);
  assert.equal(isScholarshipOpen(new Date("2027-01-28T06:00:00Z")), false);
});

test("application requires the agreement, a qualifying GPA, and listed demographic choices", () => {
  assert.equal(scholarshipApplicationSchema.safeParse(sampleApplication()).success, true);
  assert.equal(scholarshipApplicationSchema.safeParse({ ...sampleApplication(), gpa: 2.74 }).success, false);
  assert.equal(scholarshipApplicationSchema.safeParse({ ...sampleApplication(), race: "unlisted" }).success, false);
  assert.equal(scholarshipApplicationSchema.safeParse({ ...sampleApplication(), eligibility: "no" }).success, false);
  assert.equal(scholarshipApplicationSchema.safeParse({ ...sampleApplication(), agreement: "no" }).success, false);
});

test("essay accepts only PDF or Word .docx filenames", () => {
  assert.equal(getScholarshipContentType("essay", "essay.pdf")?.contentType, "application/pdf");
  assert.equal(getScholarshipContentType("essay", "essay.docx")?.contentType, DOCX_MIME);
  assert.equal(getScholarshipContentType("essay", "essay.doc"), null);
  assert.equal(getScholarshipContentType("essay", "essay.pdf.exe"), null);
});

test("essay validator checks PDF and Word bytes and rejects macro content", async () => {
  const pdf = new File(["%PDF-1.7\nexample"], "essay.pdf", { type: "application/pdf" });
  assert.equal(await validateEssayFile(pdf), "application/pdf");
  assert.equal(await validateEssayFile(sampleDocx()), DOCX_MIME);
  assert.equal(await validateEssayFile(sampleDocx("word/vbaProject.bin")), null);
  assert.equal(await validateEssayFile(new File(["not a document"], "essay.docx", { type: DOCX_MIME })), null);
});
