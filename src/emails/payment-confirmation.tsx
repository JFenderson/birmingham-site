import { Html, Head, Body, Container, Heading, Text } from "@react-email/components";

export function PaymentConfirmationEmail({
  recipientName,
  amountCents,
  type,
}: {
  recipientName: string;
  amountCents: number;
  type: "dues" | "event_fee" | "donation";
}) {
  const amount = (amountCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  const typeLabel: Record<string, string> = {
    dues: "dues payment",
    event_fee: "event fee payment",
    donation: "donation",
  };

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "8px" }}>
          <Heading style={{ color: "#1e3a8a" }}>Payment Received</Heading>
          <Text>
            Hi {recipientName}, we&apos;ve received your {amount}{" "}
            {typeLabel[type] ?? "payment"}. Thank you.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
