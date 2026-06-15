// src/components/navbar-sections/StatsSection.jsx
import { useState, useEffect } from "react";
import useInView from "../../hooks/useInView";
import { fetchHomeStats, DEFAULT_STATS } from "../../Api/homeApi";
import "../../Css/HomePage/StatsSection.css";

// ── Static stats that don't come from the API ─────────────────────
const STATIC_STATS = [
  { key: null,       value: "6",      label: "TVL Tracks Offered", icon: "🔧" },
  { key: null,       value: "30+",    label: "Years of Service",   icon: "🏫" },
  { key: null,       value: "DepEd",  label: "Accredited School",  icon: "✅" },
  { key: null,       value: "NC II",  label: "TESDA Certified",    icon: "🏆" },
];

// ── Shimmer for loading state ──────────────────────────────────────
const Shimmer = () => (
  <span
    className="stat-shimmer"
    aria-hidden="true"
    style={{
      display: "inline-block",
      width: "56px",
      height: "1.5em",
      borderRadius: "4px",
      background: "linear-gradient(90deg, rgba(255,255,255,.08) 25%, rgba(255,255,255,.18) 50%, rgba(255,255,255,.08) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }}
  />
);

export default function StatsSection() {
  const [ref, inView] = useInView();
  const [stats,   setStats]   = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const live = await fetchHomeStats();
      if (!cancelled) {
        setStats(live);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Build the full stat list: live API values first, then static ones
  const ALL_STATS = [
    { key: "students", value: stats.students, label: "Enrolled Learners", icon: "🎓" },
    { key: "teachers", value: stats.teachers, label: "Teaching Staff",    icon: "👨‍🏫" },
    { key: "sections", value: stats.sections, label: "Sections",          icon: "📚" },
    ...STATIC_STATS,
  ];

  return (
    <section className="stats-section" aria-labelledby="stats-heading">
      <div ref={ref} className="stats-section__inner">

        {/* ── Header ── */}
        <header className="stats-section__header">
          <div className="stats-section__eyebrow" aria-hidden="true">
            <span className="stats-section__eyebrow-line" />
            By the Numbers
            <span className="stats-section__eyebrow-line" />
          </div>
          <h2 id="stats-heading" className="stats-section__title">
            A school built on <em>growth</em> and impact.
          </h2>
        </header>

        {/* ── Stats grid ── */}
        <ul className="stats-section__grid" aria-label="School statistics">
          {ALL_STATS.map((s, i) => (
            <li
              key={s.label}
              className={`stat-card${inView ? " visible" : ""}`}
              style={{ transitionDelay: `${i * 0.09}s` }}
            >
              <div className="stat-card__icon" aria-hidden="true">{s.icon}</div>

              <strong className="stat-card__value" aria-label={`${s.label}: ${loading && s.key ? "loading" : s.value}`}>
                {loading && s.key ? <Shimmer /> : s.value}
              </strong>

              <div className="stat-card__divider" aria-hidden="true" />
              <span className="stat-card__label">{s.label}</span>
            </li>
          ))}
        </ul>

        {/* ── Footer note ── */}
        <p className="stats-section__footer">
          <span className="stats-section__footer-text">
            Data as of <strong>School Year 2024–2025</strong> · Maria Cristina P. Belcar Agricultural High School
          </span>
        </p>

      </div>

      {/* Shimmer keyframe — injected once here so no new CSS file is needed */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </section>
  );
}