// src/components/navbar-sections/FacultySection.jsx
import { useState, useEffect } from "react";
import useInView from "../../hooks/useInView";
import { fetchFaculty, DEFAULT_FACULTY } from "../../Api/homeApi";
import "../../Css/HomePage/FacultySection.css";

/* Color palette — cycled per card index */
const ACCENT_PALETTE = [
  "#006312", "#1a4f7a", "#8B5E1A",
  "#7a3060", "#3a7d2c", "#6b4226",
];

/* Derive two-letter initials from a full name */
function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/* ── Avatar — photo first, initials if photo missing/broken ────── */
function FacultyAvatar({ person, index }) {
  const [imgFailed, setImgFailed] = useState(false);
  const accent   = ACCENT_PALETTE[index % ACCENT_PALETTE.length];
  const initials = getInitials(person.name);
  const showPhoto = person.photo_url && !imgFailed;

  return (
    <div className="fac-avatar" style={{ "--accent": accent }}>
      {showPhoto ? (
        <img
          className="fac-avatar__photo"
          src={person.photo_url}
          alt={`Portrait of ${person.name}`}
          draggable={false}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className="fac-avatar__initials"
          style={{ background: accent }}
          aria-hidden="true"
        >
          {initials}
        </div>
      )}
      <div className="fac-avatar__ring" />
    </div>
  );
}

/* ── Shimmer skeleton while loading ──────────────────────────────── */
function SkeletonCard() {
  return (
    <li className="fac-skeleton" aria-hidden="true">
      <div className="fac-skeleton__avatar" />
      <div className="fac-skeleton__line fac-skeleton__line--name" />
      <div className="fac-skeleton__line fac-skeleton__line--sub"  />
      <div className="fac-skeleton__line fac-skeleton__line--role" />
    </li>
  );
}

/* ── Main section ──────────────────────────────────────────────── */
export default function FacultySection() {
  const [ref, inView] = useInView();

  const [displayList,  setDisplayList]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, isLive } = await fetchFaculty();

      if (!cancelled) {
        setDisplayList(data);
        setUsingFallback(!isLive);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <section id="faculty" className="fac-section">
      <div ref={ref} className="fac-inner">

        {/* ── Header ── */}
        <header className={`fac-header fc-fade ${inView ? "visible" : ""}`}>
          <span className="fac-eyebrow">
            <span className="fac-eyebrow__line" />
            Faculty &amp; Staff
          </span>
          <h2 className="fac-title">Meet Our <em>Educators</em></h2>
          <p className="fac-subtitle">
            Dedicated professionals shaping the next generation of Agrarian learners —
            each bringing expertise, passion, and years of teaching excellence.
          </p>

          {/* Shown only when we're rendering static fallback data */}
          {usingFallback && !loading && (
            <p className="fac-api-notice" role="status">
              ⚠ Showing default faculty data — live records unavailable.
            </p>
          )}
        </header>

        {/* ── Grid ── */}
        <ul className="fac-grid" aria-label="Faculty and Staff">

          {/* Skeletons while fetching */}
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`sk-${i}`} />
          ))}

          {/* Real or fallback cards */}
          {!loading && displayList.map((f, i) => {
            const accent = ACCENT_PALETTE[i % ACCENT_PALETTE.length];
            return (
              <li
                key={f.id ?? i}
                className={`fc-fade ${inView ? "visible" : ""}`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <article className="fac-card" style={{ "--accent": accent }}>
                  <FacultyAvatar person={f} index={i} />
                  <div className="fac-card__body">
                    <h3 className="fac-name">{f.name}</h3>
                    <p className="fac-subject" style={{ color: accent }}>{f.subject}</p>
                    <span className="fac-role">{f.role}</span>
                  </div>
                </article>
              </li>
            );
          })}

          {/* API returned empty list */}
          {!loading && displayList.length === 0 && (
            <li className="fac-empty" role="status">
              No faculty records found.
            </li>
          )}
        </ul>

      </div>
    </section>
  );
}