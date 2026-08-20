import { Body, Container, Head, Heading, Text, Html } from "@react-email/components";

export function FoundationInformationRequestAdminNotificationEmail({
  submitterName,
  submitterEmail,
  nonprofitName,
  organization,
  phone,
  message,
}: {
  submitterName: string;
  submitterEmail: string;
  nonprofitName: string;
  organization?: string | undefined;
  phone?: string | undefined;
  message: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "8px" }}>
          <Heading style={{ color: "#1e3a8a" }}>New Foundation Information Request</Heading>
          <Text>
            {submitterName} submitted an information request for{" "}
            {nonprofitName || "the foundation"}.
          </Text>
          {organization ? <Text>Organization: {organization}</Text> : null}
          {phone ? <Text>Phone: {phone}</Text> : null}
          <Text>Message: {message}</Text>
          <Text>Reply to {submitterEmail} to follow up.</Text>
        </Container>
      </Body>
    </Html>
  );
}
