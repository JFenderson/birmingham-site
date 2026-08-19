import { Html, Head, Body, Container, Heading, Text } from "@react-email/components";

export function SigmaBetaInterestReceivedEmail({
  submitterName,
  chapterName,
}: {
  submitterName: string;
  chapterName: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "8px" }}>
          <Heading style={{ color: "#1e3a8a" }}>Thanks for Your Interest</Heading>
          <Text>
            Hi {submitterName}, thank you for reaching out to the {chapterName || "chapter"} Sigma
            Beta Club.
          </Text>
          <Text>
            A club advisor will review your message and follow up soon.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
