import { Html, Head, Body, Container, Heading, Text } from "@react-email/components";

export function IntakeReceivedEmail({
  applicantName,
  chapterName,
}: {
  applicantName: string;
  chapterName: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "8px" }}>
          <Heading style={{ color: "#1e3a8a" }}>Application Received</Heading>
          <Text>
            Hi {applicantName}, thank you for applying to {chapterName}. A
            chapter officer will review your application and follow up soon.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
