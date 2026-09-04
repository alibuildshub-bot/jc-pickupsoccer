export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawDate = searchParams.get("date") || "";
  const startTime = searchParams.get("start") || "";
  const endTime = searchParams.get("end") || "";
  const location = searchParams.get("location") || "Field TBD";
  const details = searchParams.get("details") || "JC Footy pickup soccer session.";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return Response.json({ error: "A valid date is required." }, { status: 400 });
  }

  const ics = buildIcs(rawDate, startTime, endTime, location, details);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="jc-footy-${rawDate}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}

function buildIcs(rawDate: string, startTime: string, endTime: string, location: string, details: string) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const startLine = startTime
    ? `DTSTART;TZID=America/Chicago:${formatCalendarDateTime(rawDate, startTime)}`
    : `DTSTART;VALUE=DATE:${formatCalendarDate(rawDate)}`;
  const endLine = startTime
    ? `DTEND;TZID=America/Chicago:${formatCalendarDateTime(rawDate, endTime || startTime, endTime ? 0 : 2)}`
    : `DTEND;VALUE=DATE:${formatCalendarDate(addDaysToDateInput(rawDate, 1))}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JC Footy//Pickup Soccer//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:jc-footy-${rawDate}@jcfooty.com`,
    `DTSTAMP:${timestamp}`,
    startLine,
    endLine,
    "SUMMARY:JC Footy Pickup Soccer",
    `LOCATION:${escapeCalendarText(location)}`,
    `DESCRIPTION:${escapeCalendarText(details)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function addDaysToDateInput(rawDate: string, days: number) {
  const date = new Date(`${rawDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function formatCalendarDate(rawDate: string) {
  return rawDate.replaceAll("-", "");
}

function formatCalendarDateTime(rawDate: string, timeValue: string, addHours = 0) {
  const [year, month, day] = rawDate.split("-");
  const [hour, minute] = timeValue.split(":").map(Number);
  const date = new Date(Number(year), Number(month) - 1, Number(day), hour + addHours, minute || 0, 0);
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    pad(date.getMinutes()),
    "00",
  ].join("");
}

function escapeCalendarText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
