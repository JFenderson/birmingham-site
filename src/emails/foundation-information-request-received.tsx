import { Html, Head, Body, Container, Heading, Text } from "@react-email/components";

export function FoundationInformationRequestReceivedEmail({
  submitterName,
  nonprofitName,
}: {
  submitterName: string;
  nonprofitName: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "8px" }}>
          <Heading style={{ color: "#1e3a8a" }}>Thanks for Reaching Out</Heading>
          <Text>
            Hi {submitterName}, thank you for requesting information from{" "}
            {nonprofitName || "the foundation"}.
          </Text>
          <Text>
            A foundation representative will review your message and follow up soon.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
