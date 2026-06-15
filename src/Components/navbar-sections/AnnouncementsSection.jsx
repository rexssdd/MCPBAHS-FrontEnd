// src/components/navbar-sections/AnnouncementsSection.jsx
import { useState, useEffect, useCallback } from "react";
import useInView from "../../hooks/useInView";
import { fetchAnnouncements, DEFAULT_ANNOUNCEMENTS } from "../../Api/homeApi";
import "../../Css/HomePage/AnnouncementsSection.css";

// ── Type metadata ──────────────────────────────────────────────────
const TYPE_META = {
  event:   { label: "Event"   },
  notice:  { label: "Notice"  },
  holiday: { label: "Holiday" },
  exam:    { label: "Exam"    },
};

// ── SVG Icons ──────────────────────────────────────────────────────
const ChevronDown = ({ open }) => (
  <svg
    className={`ann-card__toggle-icon${open ? " ann-card__toggle-icon--open" : ""}`}
    width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ArrowRight = () => (
  <svg
    className="ann-section__view-all-arrow"
    width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const XIcon = () => (
  <svg
    width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Skeleton ───────────────────────────────────────────────────────
const SkeletonCard = () => (
  <li className="ann-item visible">
    <article className="ann-card ann-card--skeleton" aria-hidden="true">
      <div className="ann-skeleton ann-skeleton--badge" />
      <div className="ann-skeleton ann-skeleton--title" />
      <div className="ann-skeleton ann-skeleton--line" />
      <div className="ann-skeleton ann-skeleton--line ann-skeleton--short" />
    </article>
  </li>
);

// ── Single card (reused in modal) ──────────────────────────────────
function AnnCard({ a, isOpen, onToggle, inView, index, isModal = false }) {
  const tm = TYPE_META[a.type] ?? { label: a.type };
  return (
    <li
      className={`ann-item${inView ? " visible" : ""}${isModal ? " ann-item--modal" : ""}`}
      style={!isModal ? { transitionDelay: `${index * 0.1}s` } : undefined}
    >
      <article
        className={`ann-card${isOpen ? " ann-card--expanded" : ""}`}
        data-type={a.type}
        onClick={() => onToggle(a.id)}
        aria-expanded={isOpen}
      >
        <header className="ann-card__header">
          <div className="ann-card__badges">
            <span className={`ann-badge ann-badge--${a.type}`}>{tm.label}</span>
            <span className="ann-tag">{a.tag}</span>
          </div>
          <time className="ann-card__date" dateTime={a.date} aria-label={`Published ${a.date}`}>
            {a.date}
          </time>
        </header>
        <h3 className="ann-card__title">{a.title}</h3>
        <p className={`ann-card__excerpt${isOpen ? "" : " ann-card__excerpt--clamped"}`}>
          {a.excerpt}
        </p>
        <button
          type="button"
          className="ann-card__toggle"
          aria-expanded={isOpen}
          aria-label={isOpen ? `Collapse ${a.title}` : `Expand ${a.title}`}
          onClick={(e) => { e.stopPropagation(); onToggle(a.id); }}
        >
          {isOpen ? "Show less" : "Read more"}
          <ChevronDown open={isOpen} />
        </button>
      </article>
    </li>
  );
}

// ── All-announcements modal ────────────────────────────────────────
function AnnouncementsModal({ announcements, onClose }) {
  const [expandedModal, setExpandedModal] = useState(null);
  const [filter, setFilter] = useState("all");

  const toggleModal = (id) => setExpandedModal((prev) => (prev === id ? null : id));

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const types    = ["all", ...Object.keys(TYPE_META)];
  const filtered = filter === "all"
    ? announcements
    : announcements.filter((a) => a.type === filter);

  return (
    <div
      className="ann-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ann-modal-heading"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ann-modal">
        <div className="ann-modal__header">
          <div>
            <p className="ann-modal__eyebrow">School Board</p>
            <h2 id="ann-modal-heading" className="ann-modal__title">All Announcements</h2>
          </div>
          <button
            type="button"
            className="ann-modal__close"
            onClick={onClose}
            aria-label="Close announcements modal"
          >
            <XIcon />
          </button>
        </div>

        <div className="ann-modal__filters" role="tablist" aria-label="Filter by type">
          {types.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={filter === t}
              type="button"
              className={`ann-modal__filter-btn${filter === t ? " ann-modal__filter-btn--active" : ""}${t !== "all" ? ` ann-modal__filter-btn--${t}` : ""}`}
              onClick={() => setFilter(t)}
            >
              {t === "all" ? "All" : TYPE_META[t].label}
            </button>
          ))}
        </div>

        <p className="ann-modal__count" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "announcement" : "announcements"}
        </p>

        <ol className="ann-grid ann-grid--modal" aria-label="All school announcements">
          {filtered.length === 0 ? (
            <li className="ann-modal__empty">No announcements for this category.</li>
          ) : (
            filtered.map((a, i) => (
              <AnnCard
                key={a.id}
                a={a}
                isOpen={expandedModal === a.id}
                onToggle={toggleModal}
                inView={true}
                index={i}
                isModal={true}
              />
            ))
          )}
        </ol>
      </div>
    </div>
  );
}

// ── Main section ───────────────────────────────────────────────────
export default function AnnouncementsSection() {
  const [ref, inView] = useInView();
  const [expanded,      setExpanded]      = useState(null);
  const [announcements, setAnnouncements] = useState(DEFAULT_ANNOUNCEMENTS);
  const [loading,       setLoading]       = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [modalOpen,     setModalOpen]     = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const live = await fetchAnnouncements();

        // fetchAnnouncements() returns DEFAULT_ANNOUNCEMENTS on error,
        // so compare by reference to detect fallback mode.
        const isFallback = live === DEFAULT_ANNOUNCEMENTS;

        if (!cancelled) {
          setAnnouncements(live);
          setUsingFallback(isFallback);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const toggle    = (id) => setExpanded((prev) => (prev === id ? null : id));
  const openModal  = useCallback((e) => { e.preventDefault(); setModalOpen(true); }, []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  // Show only the first 4 on the homepage; the modal shows all
  const preview = announcements.slice(0, 4);

  return (
    <>
      <section id="announcements" className="ann-section" aria-labelledby="ann-heading">
        <div ref={ref} className="ann-section__inner">

          <header className="ann-section__header">
            <div className="ann-section__header-left">
              <div className="ann-section__eyebrow" aria-hidden="true">
                Announcements &amp; News
              </div>
              <h2 id="ann-heading" className="ann-section__heading">
                Stay informed, <em>stay ahead.</em>
              </h2>
              <p className="ann-section__sub">
                The latest advisories, events, and updates from the school
                administration and faculty.
              </p>
            </div>

            <button
              type="button"
              className="ann-section__view-all"
              onClick={openModal}
              aria-haspopup="dialog"
              aria-label="View all announcements"
            >
              View All
              <ArrowRight />
            </button>
          </header>

          {/* Show a subtle notice only if backend was unreachable */}
          {usingFallback && !loading && (
            <p className="ann-section__error" role="status">
              Showing cached announcements — live data unavailable.
            </p>
          )}

          <ol className="ann-grid" aria-label="School announcements">
            {loading
              ? DEFAULT_ANNOUNCEMENTS.map((a) => <SkeletonCard key={a.id} />)
              : preview.map((a, i) => (
                  <AnnCard
                    key={a.id}
                    a={a}
                    isOpen={expanded === a.id}
                    onToggle={toggle}
                    inView={inView}
                    index={i}
                  />
                ))}
          </ol>

          <div className="ann-section__divider" aria-hidden="true" />
        </div>
      </section>

      {modalOpen && (
        <AnnouncementsModal
          announcements={announcements}
          onClose={closeModal}
        />
      )}
    </>
  );
}