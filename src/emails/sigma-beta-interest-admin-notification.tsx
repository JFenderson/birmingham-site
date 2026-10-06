import { Body, Container, Head, Heading, Text, Html } from "@react-email/components";

export function SigmaBetaInterestAdminNotificationEmail({
  parentName,
  parentEmail,
  parentPhone,
  studentName,
  studentAge,
  gradeLevel,
  studentSchool,
  chapterName,
  referralSource,
  message,
}: {
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  studentName: string;
  studentAge: number;
  gradeLevel: string;
  studentSchool: string;
  chapterName: string;
  referralSource?: string | undefined;
  message?: string | undefined;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "8px" }}>
          <Heading style={{ color: "#1e3a8a" }}>New Sigma Beta Club Interest</Heading>
          <Text>
            {parentName} submitted an interest form for the {chapterName || "chapter"} Sigma Beta Club.
          </Text>
          <Text>Parent/Guardian: {parentName} | Email: {parentEmail} | Phone: {parentPhone}</Text>
          <Text>Student: {studentName} | Age: {studentAge} | Grade: {gradeLevel} | School: {studentSchool}</Text>
          {referralSource ? <Text>Heard about us: {referralSource}</Text> : null}
          {message ? <Text>Questions / additional information: {message}</Text> : null}
          <Text>Reply to {parentEmail} to follow up with the parent or guardian. This is an interest submission, not a membership application.</Text>
        </Container>
      </Body>
    </Html>
  );
}
