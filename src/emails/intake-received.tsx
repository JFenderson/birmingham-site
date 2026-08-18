import { Html, Head, Body, Container, Heading, Text } from "@react-email/components";

export function IntakeReceivedEmail({
  applicantName,
  chapterName,
  formTypeLabel,
}: {
  applicantName: string;
  chapterName: string;
  formTypeLabel: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "8px" }}>
          <Heading style={{ color: "#1e3a8a" }}>Submission Received</Heading>
          <Text>
            Hi {applicantName}, your {formTypeLabel.toLowerCase()} submission
            was received by {chapterName || "the chapter"}.
          </Text>
          <Text>
            A chapter officer will review it and follow up soon.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
