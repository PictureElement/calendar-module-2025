import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { fetchEvents } from "../api"
import Heading from "./Heading"
import Event from "./Event"
import Modal from "./Modal"
import calendarIcon from "../assets/calendar.svg"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import { isWithinInterval, isAfter, parseISO, isValid } from "date-fns"

export default function CalendarModule() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const modalRef = useRef(null);

  // Get current date and time
  const now = new Date();

  // Check if event is running or upcoming
  function IsRunningOrUpcomingEvent(start, end, now) {
    let isRunningEvent;
    if (isValid(start) && isValid(end)) {
      isRunningEvent = isWithinInterval(now, {
        start,
        end,
      });
    } else {
      isRunningEvent = false;
    }
    let isUpcomingEvent;
    if (isValid(start)) {
      isUpcomingEvent = isAfter(start, now);
    } else {
      isUpcomingEvent = false;
    }
    return isRunningEvent || isUpcomingEvent;
  }

  // Keep only events that are currently happening or haven't started yet
  const runningOrUpcomingEvents = events.filter((event) => {
    const {
      EventStartDate: eventStartUtcIso = null,
      EventEndDate: eventEndUtcIso = null,
    } = event ?? {}
    const eventStart = (typeof eventStartUtcIso === "string" && eventStartUtcIso) ? parseISO(eventStartUtcIso) : null;
    const eventEnd = (typeof eventEndUtcIso === "string" && eventEndUtcIso) ? parseISO(eventEndUtcIso) : null;
    return IsRunningOrUpcomingEvent(eventStart, eventEnd, now);
  });

  // Sort function for comparing two events by their start date in Unix time
  function compareNumbers(a, b) {
    const {
      EventStartDate: aEventStartUtcIso = null,
    } = a ?? {};
    const {
      EventStartDate: bEventStartUtcIso = null,
    } = b ?? {};

    const aEventStart = (typeof aEventStartUtcIso === "string" && aEventStartUtcIso) ? parseISO(aEventStartUtcIso) : null;
    const bEventStart = (typeof bEventStartUtcIso === "string" && bEventStartUtcIso) ? parseISO(bEventStartUtcIso) : null;
    const aEventStartMs = isValid(aEventStart) ? aEventStart.getTime() : null;
    const bEventStartMs = isValid(bEventStart) ? bEventStart.getTime() : null;

    // Sort is faster with numbers
    return aEventStartMs - bEventStartMs;
  }

  // Sort chronologically so users see the earliest events first
  const eventsByStartDate = runningOrUpcomingEvents.sort(compareNumbers);

  // Handle modal open
  function handleModalOpen(event) {
    setSelectedEvent(event);
  }

  // Handle modal close
  function handleModalClose() {
    setSelectedEvent(null);
  }

  // Fetch events on mount
  useEffect(() => {
    async function startFetching() {
      if (!ignore) setEvents([]);
      const events = await fetchEvents();
      // console.log("Fetched events:", events);
      if (!ignore) {
        setEvents(events);
      }
    }
    let ignore = false;
    startFetching();
    // Reset ignore flag
    return () => {
      ignore = true;
    };
  }, []);

  // Open/Close modal in response to selectedEvent
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    if (modal.open && !selectedEvent) {
      modal.close();
    } else if (!modal.open && selectedEvent) {
      modal.showModal();
    }
  }, [selectedEvent]);

  // Close modal with Escape key
  // Native <dialog> may auto-close on Esc, but it won't update component state.
  // We disable native Esc dismiss (e.g., closedby="none") and handle Esc ourselves
  // so the UI and selectedEvent state stay in sync.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        handleModalClose();
      }
    };
    if (selectedEvent) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedEvent]);

  console.log(eventsByStartDate);

  // Event list or loading skeletons
  const EventList = eventsByStartDate.length > 0
    ? (
      <ul className="event-list">
        {eventsByStartDate.map((event) => (
          <li className="event-list__item" key={event.ID}>
            <Event event={event} onModalOpen={handleModalOpen} now={now} />
          </li>
        ))}
      </ul>
    ) : (
      <ul className="event-list">
        {[...Array(8)].map((_, idx) => (
          <li style={{ lineHeight: 1 }} className="event-list__item" key={idx}> {/* lineHeight: 1 ensures the container height matches the Skeleton's exact height */}
            <Skeleton
              height={45}
              borderRadius={0}
              baseColor={idx % 2 === 0 ? '#f3f2f1' : '#ffffff'}
            />
          </li>
        ))}
      </ul>
    );

  return (
    <section className="calendar-module">
      <Heading levelOffset={0} className="calendar-module__heading">
        <img src={calendarIcon} width="24" height="24" alt="Calendar icon" /> Upcoming Events
      </Heading>
      {EventList}
      {selectedEvent && createPortal(
        <Modal event={selectedEvent} onModalClose={handleModalClose} ref={modalRef} />,
        document.body
      )}
    </section >
  )
}
