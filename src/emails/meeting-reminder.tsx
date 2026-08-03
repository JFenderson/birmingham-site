import { Html, Head, Body, Container, Heading, Text } from "@react-email/components";

export function MeetingReminderEmail({
  recipientName,
  eventTitle,
  startsAt,
  locationName,
}: {
  recipientName: string;
  eventTitle: string;
  startsAt: string; // ISO string, already resolved server-side
  locationName: string | null;
}) {
  const when = new Date(startsAt).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "8px" }}>
          <Heading style={{ color: "#1e3a8a" }}>Reminder: {eventTitle}</Heading>
          <Text>
            Hi {recipientName}, this is a reminder that &quot;{eventTitle}&quot;
            is happening {when}
            {locationName ? ` at ${locationName}` : ""}. See you there!
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
