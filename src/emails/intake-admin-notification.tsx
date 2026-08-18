import { Body, Container, Head, Heading, Html, Text } from "@react-email/components";

export function IntakeAdminNotificationEmail({
  applicantName,
  applicantEmail,
  chapterName,
  formTypeLabel,
}: {
  applicantName: string;
  applicantEmail: string;
  chapterName: string;
  formTypeLabel: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "8px" }}>
          <Heading style={{ color: "#1e3a8a" }}>
            New {formTypeLabel} Submission
          </Heading>
          <Text>
            {applicantName} submitted a {formTypeLabel.toLowerCase()} form for{" "}
            {chapterName || "the chapter"}.
          </Text>
          <Text>Reply to {applicantEmail} to follow up.</Text>
        </Container>
      </Body>
    </Html>
  );
}
