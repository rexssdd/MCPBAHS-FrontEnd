// src/components/sections/CalendarSection.jsx
import { useState, useEffect } from "react";
import useInView from "../../hooks/useInView";
import { fetchCalendarEvents } from "../../Api/homeApi";
import "../../Css/HomePage/CalendarSection.css";

/* ── Default / fallback event data ───────────────────────── */
const DEFAULT_EVENTS = [
  { id: 1,  date: "2025-03-10", month: "Mar", day: 10, tag: "Enrollment", tagColor: "#006312", tagBg: "#e8f5eb", title: "Enrollment for SY 2025–2026 Now Open",    desc: "Online and walk-in enrollment for Grade 7 and Grade 11 is now open. Visit the Registrar's Office, Room 101, Monday–Friday, 8 AM–4 PM." },
  { id: 2,  date: "2025-03-05", month: "Mar", day: 5,  tag: "Community",  tagColor: "#7b4f00", tagBg: "#fef3d0", title: "Brigada Eskwela 2025 Schedule Released",   desc: "Volunteer clean-up and repair days are set for May 19–23, 2025. All parents, alumni, and community members are welcome to join." },
  { id: 3,  date: "2025-03-01", month: "Mar", day: 1,  tag: "Academic",   tagColor: "#1a3a8f", tagBg: "#e8eeff", title: "4th Quarter Exam Schedule Posted",          desc: "Fourth-quarter examinations will run from March 26–28. Please review the subject schedule posted on the bulletin boards." },
  { id: 4,  date: "2025-02-25", month: "Feb", day: 25, tag: "Advisory",   tagColor: "#7a1515", tagBg: "#ffeaea", title: "School Closed – Holy Week",                 desc: "Classes are suspended from April 14–18, 2025 in observance of Holy Week. Regular classes resume on April 22." },
  { id: 5,  date: "2025-04-14", month: "Apr", day: 14, tag: "Holiday",    tagColor: "#7a1515", tagBg: "#ffeaea", title: "Holy Week Suspension Begins",               desc: "School closed April 14–18. Classes resume April 22, 2025." },
  { id: 6,  date: "2025-04-22", month: "Apr", day: 22, tag: "Academic",   tagColor: "#1a3a8f", tagBg: "#e8eeff", title: "Classes Resume After Holy Week",            desc: "Regular class schedule resumes. All students must wear complete school uniform." },
  { id: 7,  date: "2025-05-19", month: "May", day: 19, tag: "Community",  tagColor: "#7b4f00", tagBg: "#fef3d0", title: "Brigada Eskwela 2025 Starts",               desc: "Volunteer work begins. All parents, alumni, and community members may report to school at 7 AM." },
  { id: 8,  date: "2025-05-23", month: "May", day: 23, tag: "Community",  tagColor: "#7b4f00", tagBg: "#fef3d0", title: "Brigada Eskwela 2025 Ends",                 desc: "Last day of community clean-up and repair activities. Thank you to all volunteers." },
  { id: 9,  date: "2025-06-02", month: "Jun", day: 2,  tag: "Enrollment", tagColor: "#006312", tagBg: "#e8f5eb", title: "Enrollment Deadline – Grade 7 & SHS",       desc: "Final day for submission of enrollment requirements at the Registrar's Office." },
  { id: 10, date: "2025-06-09", month: "Jun", day: 9,  tag: "Academic",   tagColor: "#1a3a8f", tagBg: "#e8eeff", title: "First Day of Classes SY 2025–2026",         desc: "Welcome back! All enrolled students must report to their respective classrooms by 7:30 AM." },
  { id: 11, date: "2025-03-26", month: "Mar", day: 26, tag: "Academic",   tagColor: "#1a3a8f", tagBg: "#e8eeff", title: "4th Quarter Exams Begin",                   desc: "Examinations run March 26–28. Students must bring exam permits." },
  { id: 12, date: "2025-03-28", month: "Mar", day: 28, tag: "Academic",   tagColor: "#1a3a8f", tagBg: "#e8eeff", title: "4th Quarter Exams End",                     desc: "Last day of quarterly examinations. Results will be released the following week." },
];

/* ── Tag color palette (used by mapApiEvent for lookup) ─── */
const TAG_PALETTE = {
  enrollment: { tagColor: "#006312", tagBg: "#e8f5eb" },
  academic:   { tagColor: "#1a3a8f", tagBg: "#e8eeff" },
  community:  { tagColor: "#7b4f00", tagBg: "#fef3d0" },
  holiday:    { tagColor: "#7a1515", tagBg: "#ffeaea" },
  advisory:   { tagColor: "#7a1515", tagBg: "#ffeaea" },
  exam:       { tagColor: "#1a3a8f", tagBg: "#e8eeff" },
};

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ── Normalize API item → internal shape ──────────────────── */
// Adjust field names to match your actual API response.
function mapApiEvent(item) {
  // Accept "YYYY-MM-DD" or ISO string from API
  const rawDate = item.date ?? item.event_date ?? item.start_date ?? "";
  const dateStr = rawDate.slice(0, 10); // normalize to "YYYY-MM-DD"
  const dateObj = new Date(dateStr + "T00:00:00"); // avoid timezone shift

  const tag       = item.tag ?? item.category ?? item.type ?? "Advisory";
  const palette   = TAG_PALETTE[tag.toLowerCase()] ?? TAG_PALETTE.advisory;

  return {
    id:       item.id,
    date:     dateStr,
    month:    MONTH_ABBR[dateObj.getMonth()] ?? "",
    day:      dateObj.getDate(),
    tag,
    tagColor: item.tagColor ?? item.color      ?? palette.tagColor,
    tagBg:    item.tagBg    ?? item.background ?? palette.tagBg,
    title:    item.title    ?? item.name       ?? "Untitled Event",
    desc:     item.desc     ?? item.description ?? item.body ?? "",
  };
}

/* ── Unique tag types for legend ─────────────────────────── */
const LEGEND_TAGS = [
  { tag: "Enrollment", color: "#006312", bg: "#e8f5eb" },
  { tag: "Academic",   color: "#1a3a8f", bg: "#e8eeff" },
  { tag: "Community",  color: "#7b4f00", bg: "#fef3d0" },
  { tag: "Holiday",    color: "#7a1515", bg: "#ffeaea" },
  { tag: "Advisory",   color: "#7a1515", bg: "#ffeaea" },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* ── Helpers ──────────────────────────────────────────────── */
function getDaysInMonth(year, month)  { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }

function buildEventMap(events) {
  return events.reduce((map, ev) => {
    if (!map[ev.date]) map[ev.date] = [];
    map[ev.date].push(ev);
    return map;
  }, {});
}

/* ── Chevron icon ─────────────────────────────────────────── */
const Chevron = ({ dir }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    {dir === "left"
      ? <polyline points="15 18 9 12 15 6" />
      : <polyline points="9 18 15 12 9 6" />}
  </svg>
);

/* ── Skeleton sidebar card ────────────────────────────────── */
const SkeletonEventCard = () => (
  <div className="cal-skeleton-card" aria-hidden="true">
    <div className="cal-skeleton cal-skeleton--date" />
    <div className="cal-skeleton-card__body">
      <div className="cal-skeleton cal-skeleton--tag" />
      <div className="cal-skeleton cal-skeleton--title" />
      <div className="cal-skeleton cal-skeleton--line" />
      <div className="cal-skeleton cal-skeleton--line cal-skeleton--short" />
    </div>
  </div>
);

/* ── API endpoint ─────────────────────────────────────────── */
/* Fetching is delegated to Api/homeApi.js (fetchCalendarEvents),
   which resolves the correct backend origin from VITE_BACKEND_URL /
   VITE_API_BASE_URL — a bare relative path like "/api/calendar-events"
   doesn't work once the frontend (Vercel) and backend (Railway) are
   on different domains. */

/* ─────────────────────────────────────────────────────────── */
export default function CalendarSection() {
  const today = new Date();
  const [ref, inView]             = useInView();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected,  setSelected]  = useState(null); // "YYYY-MM-DD"

  const [events,   setEvents]   = useState(DEFAULT_EVENTS);
  const [eventMap, setEventMap] = useState(() => buildEventMap(DEFAULT_EVENTS));
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  /* ── Fetch from API ──────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        const raw = await fetchCalendarEvents();
        if (cancelled) return;

        if (raw.length > 0) {
          const mapped = raw.map(mapApiEvent);
          setEvents(mapped);
          setEventMap(buildEventMap(mapped));
        }
        // empty array → defaults stay in place
      } catch (err) {
        if (!cancelled) {
          console.error("[CalendarSection] fetch failed:", err);
          setError("Could not load latest events.");
          // defaults remain — no setEvents call
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadEvents();
    return () => { cancelled = true; };
  }, []);

  /* ── Derived values ──────────────────────────────────────── */
  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWk = getFirstDayOfMonth(viewYear, viewMonth);
  const totalCells   = Math.ceil((firstDayOfWk + daysInMonth) / 7) * 7;

  const monthPrefix  = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthEvents  = events
    .filter((ev) => ev.date.startsWith(monthPrefix))
    .sort((a, b) => a.date.localeCompare(b.date));

  const selectedEvents = selected ? (eventMap[selected] || []) : [];
  const sidebarEvents  = selected ? selectedEvents : monthEvents;
  const sidebarLabel   = selected
    ? `${MONTHS[viewMonth]} ${parseInt(selected.split("-")[2])}`
    : `${MONTHS[viewMonth]} ${viewYear}`;

  /* ── Navigation ──────────────────────────────────────────── */
  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
    setSelected(null);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
    setSelected(null);
  }
  function handleDayClick(dateStr, hasEvents) {
    if (!hasEvents) return;
    setSelected((prev) => (prev === dateStr ? null : dateStr));
  }

  return (
    <section
      id="school-calendar"
      className="cal-section"
      aria-labelledby="cal-heading"
    >
      <div ref={ref} className="cal-section__inner">

        {/* ── Section header ── */}
        <header className={`cal-section__header cal-fade${inView ? " visible" : ""}`}>
          <div className="cal-section__eyebrow" aria-hidden="true">School Calendar</div>
          <h2 id="cal-heading" className="cal-section__heading">
            Activities &amp; <em>Events</em>
          </h2>
          <p className="cal-section__sub">
            Stay up to date with all school activities, exam schedules, community events,
            and important dates for S.Y. 2025–2026. Click any highlighted date to view its events.
          </p>
        </header>

        {/* ── Non-blocking error banner ── */}
        {error && (
          <p className="cal-section__error" role="alert">
            {error} Showing cached events.
          </p>
        )}

        {/* ── Calendar layout ── */}
        <div
          className={`cal-layout cal-fade${inView ? " visible" : ""}`}
          style={{ transitionDelay: "0.12s" }}
        >

          {/* ── Left: Month grid ── */}
          <div className="cal-grid-wrap" role="application" aria-label="School calendar">

            {/* Navigation bar */}
            <div className="cal-nav">
              <button className="cal-nav__btn" onClick={prevMonth} aria-label="Go to previous month">
                <Chevron dir="left" />
              </button>
              <span className="cal-nav__title" aria-live="polite" aria-atomic="true">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button className="cal-nav__btn" onClick={nextMonth} aria-label="Go to next month">
                <Chevron dir="right" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="cal-weekdays" aria-hidden="true">
              {DAYS.map((d) => <div key={d} className="cal-weekday">{d}</div>)}
            </div>

            {/* Day cells */}
            <div className="cal-days" role="grid" aria-label={`${MONTHS[viewMonth]} ${viewYear}`}>
              {Array.from({ length: totalCells }).map((_, i) => {
                const dayNum   = i - firstDayOfWk + 1;
                const isValid  = dayNum >= 1 && dayNum <= daysInMonth;
                const dateStr  = isValid
                  ? `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
                  : null;
                const dayEvents  = dateStr ? (eventMap[dateStr] || []) : [];
                const isToday    = isValid
                  && today.getFullYear() === viewYear
                  && today.getMonth()    === viewMonth
                  && today.getDate()     === dayNum;
                const isSelected = dateStr && selected === dateStr;

                const classes = [
                  "cal-day",
                  !isValid         ? "cal-day--empty"     : "",
                  isToday          ? "cal-day--today"     : "",
                  dayEvents.length ? "cal-day--has-event" : "",
                  isSelected       ? "cal-day--selected"  : "",
                  loading          ? "cal-day--loading"   : "",
                ].filter(Boolean).join(" ");

                return (
                  <div
                    key={i}
                    className={classes}
                    role={isValid ? "gridcell" : undefined}
                    aria-label={isValid
                      ? `${MONTHS[viewMonth]} ${dayNum}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : ""}`
                      : undefined}
                    aria-selected={isSelected || undefined}
                    aria-busy={loading || undefined}
                    tabIndex={isValid && dayEvents.length ? 0 : undefined}
                    onClick={() => dateStr && handleDayClick(dateStr, dayEvents.length > 0)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && dayEvents.length) {
                        e.preventDefault();
                        handleDayClick(dateStr, true);
                      }
                    }}
                  >
                    <div className="cal-day__num">{isValid ? dayNum : ""}</div>
                    {dayEvents.length > 0 && (
                      <div className="cal-dot-row" aria-hidden="true">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <span key={ev.id} className="cal-dot" style={{ background: ev.tagColor }} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right: Sidebar ── */}
          <aside className="cal-sidebar" aria-label="Event details">

            <p className="cal-sidebar__heading" aria-live="polite">{sidebarLabel}</p>

            {/* Legend */}
            <div className="cal-legend" aria-label="Event type legend">
              {LEGEND_TAGS.map((l) => (
                <div key={l.tag} className="cal-legend__item">
                  <span className="cal-legend__dot" style={{ background: l.color }} aria-hidden="true" />
                  {l.tag}
                </div>
              ))}
            </div>

            {/* Loading state */}
            {loading ? (
              <div className="cal-sidebar__skeletons" aria-label="Loading events" aria-busy="true">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonEventCard key={i} />)}
              </div>
            ) : sidebarEvents.length === 0 ? (
              <div className="cal-empty-state" role="status">
                <span className="cal-empty-state__icon" aria-hidden="true">📅</span>
                <p className="cal-empty-state__text">
                  {selected
                    ? "No events on this day. Click a date with colored dots to view its events."
                    : "No events scheduled this month."}
                </p>
              </div>
            ) : (
              sidebarEvents.map((ev) => (
                <article key={ev.id} className="cal-event-card">
                  <div className="cal-event-card__date" aria-hidden="true">
                    <span className="cal-event-card__month">{ev.month}</span>
                    <span className="cal-event-card__day">{ev.day}</span>
                  </div>
                  <div className="cal-event-card__body">
                    <span
                      className="cal-event-card__tag"
                      style={{ color: ev.tagColor, background: ev.tagBg }}
                    >
                      {ev.tag}
                    </span>
                    <p className="cal-event-card__title">{ev.title}</p>
                    <p className="cal-event-card__desc">{ev.desc}</p>
                  </div>
                </article>
              ))
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}