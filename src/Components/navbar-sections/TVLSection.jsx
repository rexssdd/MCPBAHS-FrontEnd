// src/components/sections/TVLSection.jsx
import { useState, useEffect, useCallback } from "react";
import useInView from "../../hooks/useInView";
import TVLModal from "../TVLModal";
import { fetchTvlOffers } from "../../Api/homeApi";
import "../../Css/HomePage/TVLSection.css";

// ── Default / fallback data ───────────────────────────────
const DEFAULT_TVL_OFFERS = [
  {
    id: 1,
    title: "Small Engine Servicing",
    tag: "TVL – Industrial Arts",
    description: "Students learn to inspect, maintain, and repair small gasoline and diesel engines used in agricultural machinery, generators, and lawn equipment.",
    details: ["Engine disassembly & reassembly", "Carburetor cleaning & tuning", "Ignition system diagnostics", "Preventive maintenance scheduling"],
    duration: "2 Semesters",
    tesda: "NC II Eligible",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=700&q=80",
    accent: "#006312",
  },
  {
    id: 2,
    title: "Agricultural Crop Production",
    tag: "TVL – Agri-Fishery Arts",
    description: "Hands-on training in soil preparation, seed selection, planting, fertilization, pest management, and harvest of field and vegetable crops.",
    details: ["Soil analysis & amendment", "Integrated Pest Management (IPM)", "Crop rotation planning", "Post-harvest handling"],
    duration: "2 Semesters",
    tesda: "NC II Eligible",
    image: "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=700&q=80",
    accent: "#3a7d2c",
  },
  {
    id: 3,
    title: "Food & Beverage Services",
    tag: "TVL – Home Economics",
    description: "Students master table service techniques, beverage preparation, kitchen safety, and customer relations for hospitality and food-service industries.",
    details: ["Table setting & service styles", "Barista & beverage basics", "Food safety & sanitation (HACCP)", "Menu planning & costing"],
    duration: "2 Semesters",
    tesda: "NC II Eligible",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80",
    accent: "#8B5E1A",
  },
  {
    id: 4,
    title: "Computer Systems Servicing",
    tag: "TVL – ICT",
    description: "Covers hardware assembly, OS installation, network cabling, troubleshooting, and basic cybersecurity practices aligned with TESDA NC II.",
    details: ["PC assembly & BIOS setup", "OS installation & drivers", "LAN wiring & IP configuration", "Virus removal & data recovery"],
    duration: "2 Semesters",
    tesda: "NC II Eligible",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=700&q=80",
    accent: "#1a4f7a",
  },
  {
    id: 5,
    title: "Animal Production",
    tag: "TVL – Agri-Fishery Arts",
    description: "Practical training in livestock and poultry management — swine, poultry, and goat raising — including nutrition, health care, and record-keeping.",
    details: ["Breeding & genetics basics", "Animal nutrition & feeds", "Veterinary first aid", "Farm records & enterprise budgeting"],
    duration: "2 Semesters",
    tesda: "NC II Eligible",
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=700&q=80",
    accent: "#6b4226",
  },
  {
    id: 6,
    title: "Dressmaking & Tailoring",
    tag: "TVL – Home Economics",
    description: "Students develop pattern-making, cutting, stitching, and finishing skills to produce garments for everyday wear and formal occasions.",
    details: ["Pattern drafting & grading", "Machine & hand stitching", "Fabric selection & care", "Garment alteration & repair"],
    duration: "2 Semesters",
    tesda: "NC II Eligible",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80",
    accent: "#7a3060",
  },
];

// ── Normalize API item to internal shape ──────────────────
// Adjust field names to match your actual API response.
//
// IMPORTANT: image intentionally does NOT fall back to a
// DEFAULT_TVL_OFFERS stock photo anymore. Once the API returns real
// offers, nothing about them should be mixed with mock data — an
// offer the admin hasn't uploaded a photo for should show its icon
// placeholder, not an unrelated stock image borrowed from the mock set.
function mapApiOffer(item, index = 0) {
  return {
    id:          item.id,
    title:       item.title       ?? "Untitled Program",
    tag:         item.tag         ?? item.track ?? item.category ?? "",
    description: item.description ?? item.desc ?? item.body ?? "",
    details:     Array.isArray(item.details)
                   ? item.details
                   : item.competencies ?? item.skills ?? [],
    duration:    item.duration    ?? "2 Semesters",
    tesda:       item.tesda       ?? item.ncLevel ?? "NC II Eligible",
    image:       item.image_url   ?? item.image ?? item.imageUrl ?? item.photo ?? null,
    icon:        item.icon        ?? "🎓",
    accent:      item.accent      ?? item.color ?? "#1a4f7a",
  };
}

// ── SVG Icons ─────────────────────────────────────────────
const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ArrowRight = () => (
  <svg className="tvl-card__cta-arrow" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// ── Skeleton card ─────────────────────────────────────────
const TVLSkeletonCard = () => (
  <li className="tvl-card-item">
    <article className="tvl-card tvl-card--skeleton" aria-hidden="true">
      <div className="tvl-skeleton tvl-skeleton--image" />
      <div className="tvl-card__body">
        <div className="tvl-skeleton tvl-skeleton--tag" />
        <div className="tvl-skeleton tvl-skeleton--title" />
        <div className="tvl-skeleton tvl-skeleton--line" />
        <div className="tvl-skeleton tvl-skeleton--line tvl-skeleton--short" />
      </div>
    </article>
  </li>
);

// ── API endpoint ──────────────────────────────────────────
// Fetching is delegated to Api/homeApi.js (fetchTvlOffers), which
// resolves the correct backend origin — a bare relative path like
// "/api/tvl-offers" never resolves once frontend and backend live on
// different domains (e.g. Vercel + Railway).

// ─────────────────────────────────────────────────────────
export default function TVLSection() {
  const [index,    setIndex]    = useState(0);
  const [selected, setSelected] = useState(null);
  const [paused,   setPaused]   = useState(false);
  const [ref, inView]           = useInView();

  const [offers,  setOffers]  = useState(DEFAULT_TVL_OFFERS);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Fetch from API ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadOffers() {
      try {
        const raw = await fetchTvlOffers();
        if (cancelled) return;

        if (raw.length > 0) {
          setOffers(raw.map((item, idx) => mapApiOffer(item, idx)));
          setIndex(0); // reset carousel position on fresh data
        }
        // empty array → keep defaults
      } catch (err) {
        if (!cancelled) {
          console.error("[TVLSection] fetch failed:", err);
          setError("Could not load latest programs.");
          // defaults stay in place
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOffers();
    return () => { cancelled = true; };
  }, []);

  const total        = offers.length;
  const visibleCount = 3;

  const goNext = useCallback(() => setIndex((c) => (c + 1) % total), [total]);
  const goPrev = useCallback(() => setIndex((c) => (c - 1 + total) % total), [total]);

  // Auto-advance (pause when loading so skeleton doesn't spin)
  useEffect(() => {
    if (paused || loading) return;
    const id = setInterval(goNext, 4000);
    return () => clearInterval(id);
  }, [paused, loading, goNext]);

  const pauseHandlers = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocus:      () => setPaused(true),
    onBlur:       () => setPaused(false),
  };

  const visibleOffers = Array.from({ length: visibleCount }, (_, i) =>
    offers[(index + i) % total]
  );

  return (
    <section id="tvl-offers" className="tvl-section" aria-labelledby="tvl-heading">
      <div ref={ref} className={`tvl-section__inner tvl-fade${inView ? " visible" : ""}`}>

        {/* ── Section header ── */}
        <div className="tvl-section__header">
          <div className="tvl-section__header-left">
            <div className="tvl-section__eyebrow" aria-hidden="true">TVL Offers</div>
            <h2 id="tvl-heading" className="tvl-section__heading">
              Programs built for the <em>real world.</em>
            </h2>
            <p className="tvl-section__sub">
              Each track is TESDA-aligned and prepares learners with hands-on
              skills for employment and entrepreneurship. Click any card to
              view full program details.
            </p>
          </div>

          <nav className="tvl-section__nav" aria-label="TVL carousel controls">
            <button className="tvl-nav-btn" onClick={goPrev} aria-label="Previous programs">
              <ChevronLeft />
            </button>
            <button className="tvl-nav-btn" onClick={goNext} aria-label="Next programs">
              <ChevronRight />
            </button>
          </nav>
        </div>

        {/* ── Non-blocking error banner ── */}
        {error && (
          <p className="tvl-section__error" role="alert">
            {error} Showing default programs.
          </p>
        )}

        {/* ── Carousel ── */}
        <div className="tvl-carousel" {...pauseHandlers}>

          <ul className="tvl-cards-grid" aria-live="polite" aria-label="TVL program cards">
            {loading
              ? Array.from({ length: visibleCount }).map((_, i) => (
                  <TVLSkeletonCard key={i} />
                ))
              : visibleOffers.map((offer, i) => (
                  <li key={`${offer.id}-${index}-${i}`} className="tvl-card-item">
                    <article
                      className="tvl-card"
                      tabIndex={0}
                      role="button"
                      aria-label={`View details for ${offer.title}`}
                      onClick={() => setSelected(offer)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(offer);
                        }
                      }}
                    >
                      <figure className="tvl-card__figure">
                        {offer.image ? (
                          <img
                            src={offer.image}
                            alt={offer.title}
                            className="tvl-card__image"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="tvl-card__image"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 48,
                              background: `linear-gradient(135deg, ${offer.accent}22, ${offer.accent}11)`,
                            }}
                            aria-hidden="true"
                          >
                            {offer.icon}
                          </div>
                        )}
                        <div className="tvl-card__scrim" aria-hidden="true" />
                        <span className="tvl-card__tag" style={{ background: offer.accent }}>
                          {offer.tag}
                        </span>
                      </figure>

                      <div className="tvl-card__body">
                        <h3 className="tvl-card__title">{offer.title}</h3>
                        <p className="tvl-card__desc">{offer.description}</p>
                        <div className="tvl-card__footer">
                          <span className="tvl-card__cta">
                            View Details <ArrowRight />
                          </span>
                          <span className="tvl-card__badge">{offer.tesda}</span>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
          </ul>

          {/* Dot indicators */}
          <nav className="tvl-section__dots" aria-label="TVL program slides">
            {offers.map((offer, i) => (
              <button
                key={i}
                className={`tvl-dot-btn${i === index ? " tvl-dot-btn--active" : ""}`}
                onClick={() => setIndex(i)}
                aria-label={`Go to ${offer.title}`}
                aria-current={i === index ? "true" : undefined}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <TVLModal offer={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}