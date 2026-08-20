import { Body, Container, Head, Heading, Text, Html } from "@react-email/components";

export function SigmaBetaInterestAdminNotificationEmail({
  submitterName,
  submitterEmail,
  chapterName,
  roleLabel,
  phone,
  message,
}: {
  submitterName: string;
  submitterEmail: string;
  chapterName: string;
  roleLabel: string;
  phone?: string | undefined;
  message?: string | undefined;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "8px" }}>
          <Heading style={{ color: "#1e3a8a" }}>New Sigma Beta Club Interest</Heading>
          <Text>
            {submitterName} ({roleLabel}) submitted an interest form for the{" "}
            {chapterName || "chapter"} Sigma Beta Club.
          </Text>
          {phone ? <Text>Phone: {phone}</Text> : null}
          {message ? <Text>Message: {message}</Text> : null}
          <Text>Reply to {submitterEmail} to follow up.</Text>
        </Container>
      </Body>
    </Html>
  );
}
