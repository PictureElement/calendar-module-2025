import { parseISO, isValid, formatDistanceToNow, format, differenceInCalendarDays, isWithinInterval } from "date-fns"

export default function Event({ event, onModalOpen, now }) {

  const {
    Title: title = "Untitled event",
    EventStartDate: eventStartUtcIso = null,
    EventEndDate: eventEndUtcIso = null
  } = event ?? {}

  const eventStart = (typeof eventStartUtcIso === "string" && eventStartUtcIso) ? parseISO(eventStartUtcIso) : null;
  const eventEnd = (typeof eventEndUtcIso === "string" && eventEndUtcIso) ? parseISO(eventEndUtcIso) : null;

  // Check if event is running
  const isRunning =
    isValid(eventStart) && isValid(eventEnd)
      ? isWithinInterval(now, { start: eventStart, end: eventEnd })
      : false;

  // Check if event is less than 7 days away
  const daysDifference =
    isValid(eventStart)
      ? differenceInCalendarDays(eventStart, now)
      : -1;
  const isWithinWeek = daysDifference >= 0 && daysDifference < 7;

  const formatEventDate = () => {
    if (isRunning) {
      return "Now";
    }
    if (isWithinWeek && isValid(eventStart)) {
      // Show friendly format
      return formatDistanceToNow(eventStart, {
        addSuffix: true,
        includeSeconds: false
      });
    }
    // Show calendar date in the viewer's local time zone
    return isValid(eventStart)
      ? format(eventStart, 'dd/MM/yyyy')
      : <span className="text-muted">Invalid start date</span>;
  };

  function handleClick() {
    if (onModalOpen) onModalOpen(event);
  }

  return (
    <button className="event" onClick={handleClick}>
      {title} — <time dateTime={isValid(eventStart) ? eventStartUtcIso : undefined}>{formatEventDate()}</time>
    </button>
  )
}
