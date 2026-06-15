// src/pages/HomePage.jsx
import { useState, useEffect } from "react";
import heroImage from "../assets/hero.png";

import PublicNavbar          from "../Components/PublicNavbar";
import PublicFooter          from "../Components/PublicFooter";
import AboutSection          from "../Components/navbar-sections/AboutSection";
import StatsSection          from "../Components/navbar-sections/StatsSection";
import TVLSection            from "../Components/navbar-sections/TVLSection";
import AnnouncementsSection  from "../Components/navbar-sections/AnnouncementsSection";
import EnrollmentSection     from "../Components/navbar-sections/EnrollmentSection";
import FacultySection        from "../Components/navbar-sections/FacultySection";
import CalendarSection       from "../Components/navbar-sections/CalendarSection";
import ContactSection        from "../Components/navbar-sections/ContactSection";
import EnrollmentTypeModal   from "../Components/EnrollmentTypeModal";
import PrivacyNotice         from "../Components/navbar-sections/PrivacyNotice";
import HomePageErrorBoundary from "../Components/HomePageErrorBoundary";

import "../Css/HomePage/HomePage.css";

const NAV_SECTION_IDS = [
  "about",
  "tvl-offers",
  "announcements",
  "enrollment",
  "faculty",
  "school-calendar",
  "contact",
];

const ArrowRight = () => (
  <svg
    className="hp-enroll-btn__arrow"
    xmlns="http://www.w3.org/2000/svg"
    width="18" height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

function useSectionFade() {
  useEffect(() => {
    const els = document.querySelectorAll(".hp-section-fade, .milestone-item");
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function HomePageComponent() {
  const [activeSection,   setActiveSection]   = useState("");
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      for (const id of [...NAV_SECTION_IDS].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 110) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useSectionFade();

  return (
    <>
      <a href="#main-content" className="hp-skip-link">Skip to main content</a>

      <div className="hp-page">
        <PublicNavbar activeSection={activeSection} showLinks={true} />

        <main id="main-content">

          {/* ── Hero ── */}
          <section className="hp-hero" aria-labelledby="hero-heading">
            <img src={heroImage} alt="" role="presentation" className="hp-hero__bg" />
            <div className="hp-hero__overlay" aria-hidden="true" />
            <div className="hp-hero__stripe"  aria-hidden="true" />

            <div className="hp-hero__content">
              <div className="hp-hero__eyebrow" aria-hidden="true">
                <span className="hp-hero__eyebrow-dot" />
                Now Enrolling · S.Y. 2025–2026
              </div>
              <h1 id="hero-heading" className="hp-hero__heading">
                Be part of a community that grows
                <br />knowledge, skills, and character.
              </h1>
              <p className="hp-hero__sub">
                Today, our school continues to provide accessible, quality education
                and proudly implements the Senior High School Program — equipping
                learners with the skills and values needed for a brighter future.
              </p>
              <button
                type="button"
                className="hp-enroll-btn"
                onClick={() => setShowEnrollModal(true)}
                aria-label="Open enrollment form"
              >
                Enroll Now
                <ArrowRight />
              </button>
            </div>
          </section>

          {/* ── Sections ── */}
          <AboutSection />
          <StatsSection />
          <TVLSection />
          <AnnouncementsSection />
          <EnrollmentSection />
          <FacultySection />
          <CalendarSection />
          <ContactSection />

        </main>

        <PublicFooter />
      </div>

      <PrivacyNotice />
      {showEnrollModal && (
        <EnrollmentTypeModal onClose={() => setShowEnrollModal(false)} />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  EXPORT (wrapped with error boundary)
// ═══════════════════════════════════════════════════════════════
export default function HomePage() {
  return (
    <HomePageErrorBoundary>
      <HomePageComponent />
    </HomePageErrorBoundary>
  );
}

