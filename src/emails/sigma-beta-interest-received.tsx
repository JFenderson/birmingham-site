import { Html, Head, Body, Container, Heading, Text } from "@react-email/components";

export function SigmaBetaInterestReceivedEmail({
  parentName,
  chapterName,
}: {
  parentName: string;
  chapterName: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "8px" }}>
          <Heading style={{ color: "#1e3a8a" }}>Thanks for Your Interest</Heading>
          <Text>
            Hi {parentName}, thank you for your interest in the {chapterName || "chapter"} Sigma Beta Club. Your information has been received.
          </Text>
          <Text>
            An interest form does not constitute membership or acceptance. A member of our Sigma Beta Club leadership team will contact the parent or guardian about upcoming activities and the next intake cycle.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
