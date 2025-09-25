import { forwardRef, useState } from "react"
import bsmBanner from "../assets/bsm-banner.png"
import { format, isValid, parseISO, add, getYear, getMonth, getDate } from "date-fns"
import CloseIcon from "../assets/x.svg?react"
import SimpleBar from "simplebar-react"
import * as ics from "ics"
import { saveAs } from "file-saver"
import Skeleton from "react-loading-skeleton"
import "simplebar-react/dist/simplebar.min.css"
import slugify from "@sindresorhus/slugify"
import { normalizeHeadingsAndSanitize } from "../lib/utils"

const Modal = forwardRef(function Modal({ event, onModalClose }, ref) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const {
    FullDayEvent: fullDayEvent = "FALSE",
    EventStartDate: eventStartUtcIso = null,
    EventEndDate: eventEndUtcIso = null,
    BannerUrl: bannerUrl = "",
    Title: title = "Untitled event",
    Category: category = "Uncategorized",
    Description: description = "",
    Author: author = "Unknown",
    Editor: editor = "Unknown",
    AddressLine1: addressLine1 = "",
    AddressLine2: addressLine2 = "",
    City: city = "",
    PostCode: postCode = "",
    Country: country = "",
    Created: createdUtcIso = null,
    Modified: modifiedUtcIso = null
  } = event ?? {}

  const eventStart = (typeof eventStartUtcIso === "string" && eventStartUtcIso) ? parseISO(eventStartUtcIso) : null;
  const eventEnd = (typeof eventEndUtcIso === "string" && eventEndUtcIso) ? parseISO(eventEndUtcIso) : null;
  const eventCreated = (typeof createdUtcIso === "string" && createdUtcIso) ? parseISO(createdUtcIso) : null;
  const eventModified = (typeof modifiedUtcIso === "string" && modifiedUtcIso) ? parseISO(modifiedUtcIso) : null;
  const eventStartMs = isValid(eventStart) ? eventStart.getTime() : null;
  const eventEndMs = isValid(eventEnd) ? eventEnd.getTime() : null;

  // Human-friendly local formats
  const startLocalFormatted = isValid(eventStart)
    ? (fullDayEvent === "TRUE" // Use date for full‑day events, and date + 24‑hour time for timed events.
      ? format(eventStart, "eee, dd MMM yyyy") // format() uses the environment's local timezone.
      : format(eventStart, "eee, dd MMM yyyy, HH:mm"))
    : <span className="text-muted">Invalid start date</span>;
  const endLocalFormatted = isValid(eventEnd)
    ? (fullDayEvent === "TRUE" // Use "Full Day Event" for full‑day events, and date + 24‑hour time for timed events.
      ? "Full Day Event"
      : format(eventEnd, "eee, dd MMM yyyy, HH:mm"))
    : <span className="text-muted">Invalid end date</span>;

  const createdLocalFormatted = isValid(eventCreated) ? format(eventCreated, "dd/MM/yyyy 'at' HH:mm") : <span className="text-muted">Invalid created date</span>;
  const modifiedLocalFormatted = isValid(eventModified) ? format(eventModified, "dd/MM/yyyy 'at' HH:mm") : <span className="text-muted">Invalid modified date</span>;

  // Sanitize description HTML and check if there's any text content
  // const cleanDescription = DOMPurify.sanitize(description); // Sanitized description
  const cleanDescription = normalizeHeadingsAndSanitize(description); // Sanitized description
  const descriptionText = cleanDescription.replace(/<[^>]*>/g, "").trim(); // Remove all html tags, leading/trailing whitespaces and line breaks
  const hasDescriptionText = descriptionText.length > 0;

  function handleCloseModal() {
    if (onModalClose) {
      setImageLoaded(false);
      onModalClose();
    }
  }

  const canCreateICS = isValid(eventStart); // A start datetime is required for an .ics file
  const locationParts = [addressLine1, city, postCode, country].map(part => (typeof part === "string" ? part.trim() : part)).filter(Boolean);

  // Generate an iCal-compliant event, construct a blob from it, and trigger a download
  function handleAddToCalendar() {
    if (!canCreateICS) return;

    let icsOptions;

    if (fullDayEvent === "TRUE") {
      const s = eventStart;
      const sYear = s.getUTCFullYear();
      const sMonthIndex = s.getUTCMonth() // 0-based month
      const sDate = s.getUTCDate();

      // The date of the end property should be the day after your all-day event. 
      const e = new Date(Date.UTC(sYear, sMonthIndex, sDate + 1));
      const eYear = e.getUTCFullYear();
      const eMonthIndex = e.getUTCMonth(); // 0-based month
      const eDate = e.getUTCDate();

      icsOptions = { // Options for full day events
        start: [sYear, sMonthIndex + 1, sDate], // 1-based month for ICS
        end: [eYear, eMonthIndex + 1, eDate], // 1-based month for ICS
        title,
        categories: [category]
      }
    } else {
      // Base options
      icsOptions = { // Options for timed events
        start: eventStartMs, // Required property
        startInputType: "utc",
        startOutputType: "utc",
        title,
        categories: [category]
      }
      // Add optional properties if valid
      if (isValid(eventEnd)) icsOptions.end = eventEndMs;
    }

    // Add optional properties if valid
    if (locationParts.length > 0) {
      icsOptions.location = locationParts.join(", ");
    }

    ics.createEvent(icsOptions, (error, value) => {
      if (error) {
        console.log(error)
        return
      }
      const blob = new Blob([value], { type: 'text/calendar' });
      saveAs(blob, `${slugify(title)}.ics`); // Save .ics
      console.log(value);
    })
  }

  function handleImageLoad() {
    setImageLoaded(true);
  }

  return (
    <dialog
      className="modal"
      ref={ref}
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {event && (
        <section className="modal__content">
          <header className="modal__header">
            <div style={{ lineHeight: 1 }}> {/* lineHeight: 1 ensures the container height matches the Skeleton's exact height */}
              {!imageLoaded && <Skeleton className="modal__image-skeleton" />}
              <img
                onLoad={handleImageLoad} // Always render the img, but hide it until onLoad
                className={`modal__image ${imageLoaded ? 'modal__image_loaded' : ''}`}
                src={bannerUrl || bsmBanner}
                alt=""
              />
            </div>
            <div className="modal__intro">
              <span aria-hidden="true" className="modal__date">
                <span>{isValid(eventStart) ? format(eventStart, 'MMM') : <span className="text-muted">Invalid start date</span>}</span>
                <br />
                <span className="modal__calendar-day">{isValid(eventStart) ? format(eventStart, 'dd') : <span className="text-muted">Invalid start date</span>}</span>
              </span>
              <h1 id="modal-title" className="modal__title">{title}</h1>
              <span className="modal__category">{category}</span>
            </div>
            <button className="modal__close" aria-label="Close Modal" onClick={handleCloseModal}>
              <CloseIcon className="modal__close-icon" />
            </button>
          </header>
          <div className="modal__main">
            <SimpleBar autoHide={false} tabIndex={-1} className="modal__scroll">
              <div className="modal__description">
                <h2 className="modal__heading">DESCRIPTION</h2>
                {hasDescriptionText ? (
                  <div className="text-sm max-w-none prose" dangerouslySetInnerHTML={{ __html: cleanDescription }}></div>
                ) : (
                  <p className="text-muted">No description available.</p>
                )}
              </div>
            </SimpleBar>
            <aside className="modal__details">
              <div className="modal__detail">
                <h2 className="modal__heading">{fullDayEvent === 'TRUE' ? "DATE" : "DATE AND TIME"}</h2>
                <div className="modal__datetime">
                  <time dateTime={isValid(eventStart) ? eventStartUtcIso : undefined}>{startLocalFormatted}</time>
                  {fullDayEvent === 'TRUE' ? (
                    <>
                      {" "}-{" "}
                      <span>{endLocalFormatted}</span>
                    </>
                  ) : (
                    <>
                      —
                      <time dateTime={isValid(eventEnd) ? eventEndUtcIso : undefined}>{endLocalFormatted}</time> <span className="text-muted">(your local time)</span>
                    </>
                  )}
                </div>
                {canCreateICS && <button className="modal__action" onClick={handleAddToCalendar}>Add to Calendar</button>}
              </div>
              <div className="modal__detail">
                <h2 className="modal__heading">LOCATION</h2>
                {locationParts.length > 0 ? (
                  <>
                    <address style={{ whiteSpace: 'pre-line' }} className="modal__address">
                      {locationParts.join("\n")}
                    </address>
                    <button className="modal__action">View Map</button>
                  </>
                ) : (
                  <span className="text-muted">Location unavailable</span>
                )}
              </div>
            </aside>
          </div>
          <footer className="modal__footer">
            <p>Created by {author} on {createdLocalFormatted}</p>
            <p>Modified by {editor} on {modifiedLocalFormatted}</p>
          </footer>
        </section>
      )}
    </dialog >
  )
});

export default Modal;
