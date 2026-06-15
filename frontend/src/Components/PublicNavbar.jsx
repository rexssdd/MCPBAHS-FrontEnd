// src/components/PublicNavbar.jsx
import { useState, useEffect } from "react";
import logo from "../assets/school-logo.png";

const NAV_LINKS = [
  { label: "About",         href: "#about" },
  { label: "TVL Offers",    href: "#tvl-offers" },
  { label: "Announcements", href: "#announcements" },
  { label: "Enrollment",    href: "#enrollment" },
  { label: "Faculty",       href: "#faculty" },
  { label: "Calendar",      href: "#school-calendar" },
  { label: "Contact",       href: "#contact" },
];

const NAVBAR_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

  .pn-header {
    --pn-bg:          #006312;
    --pn-bg-mobile:   #004d0e;
    --pn-gold:        #FFF87F;
    --pn-text-bright: #d6f5dc;
    --pn-text-muted:  rgba(214, 245, 220, 0.7);
    --pn-border:      rgba(255, 248, 127, 0.18);
    --pn-font-display: 'Playfair Display', Georgia, serif;
    --pn-font-body:    'DM Sans', system-ui, sans-serif;
    --pn-height: 68px;
    --pn-radius: 8px;
    --pn-transition: 0.22s ease;
    position: sticky;
    top: 0;
    z-index: 100;
    font-family: var(--pn-font-body);
  }

  .pn-nav {
    background: var(--pn-bg);
    height: var(--pn-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    gap: 1.5rem;
    transition: box-shadow var(--pn-transition);
  }

  .pn-nav--scrolled { box-shadow: 0 4px 24px rgba(0,0,0,0.35); }
  .pn-nav--default  { box-shadow: 0 2px 10px rgba(0,0,0,0.18); }

  /* Brand */
  .pn-brand {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    text-decoration: none;
    flex-shrink: 0;
  }
  .pn-brand__seal {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: var(--pn-gold);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 0 0 2px rgba(255,248,127,0.3);
    transition: transform var(--pn-transition), box-shadow var(--pn-transition);
  }
  .pn-brand:hover .pn-brand__seal {
    transform: scale(1.06);
    box-shadow: 0 0 0 4px rgba(255,248,127,0.25);
  }
  .pn-brand__seal img {
    width: 50px;
    height: 50px;
    object-fit: cover;
  }
  .pn-brand__name {
    display: block;
    font-family: var(--pn-font-body);
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--pn-gold);
    line-height: 1.25;
    letter-spacing: 0.01em;
  }
  .pn-brand__tagline {
    display: block;
    font-family: var(--pn-font-display);
    font-size: 0.67rem;
    font-style: italic;
    color: var(--pn-text-muted);
    margin-top: 1px;
  }

  /* Desktop links */
  .pn-links {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  @media (max-width: 768px) {
    .pn-links { display: none; }
  }

  .pn-link {
    position: relative;
    display: inline-block;
    font-family: var(--pn-font-body);
    font-size: 0.83rem;
    font-weight: 500;
    color: rgba(255,255,255,0.88);
    text-decoration: none;
    padding: 0.3rem 0.55rem;
    border-radius: var(--pn-radius);
    letter-spacing: 0.01em;
    white-space: nowrap;
    transition: color var(--pn-transition), background var(--pn-transition);
  }
  .pn-link::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0.55rem;
    right: 0.55rem;
    height: 2px;
    border-radius: 2px;
    background: var(--pn-gold);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
  }
  .pn-link:hover {
    color: var(--pn-gold);
    background: rgba(255,248,127,0.06);
  }
  .pn-link--active { color: var(--pn-gold); }
  .pn-link--active::after,
  .pn-link:hover::after { transform: scaleX(1); }

  /* Login button */
  .pn-login-btn {
    display: inline-flex;
    align-items: center;
    font-family: var(--pn-font-body);
    font-size: 0.83rem;
    font-weight: 700;
    color: white;
    text-decoration: none;
    padding: 0.42rem 1.1rem;
    border-radius: var(--pn-radius);
    border: 2px solid rgba(255,255,255,0.35);
    white-space: nowrap;
    transition: color var(--pn-transition), background var(--pn-transition),
                border-color var(--pn-transition), transform var(--pn-transition);
    margin-left: 0.5rem;
  }
  .pn-login-btn:hover {
    background: var(--pn-gold);
    color: #006312;
    border-color: var(--pn-gold);
    transform: scale(1.04);
  }

  /* Hamburger */
  .pn-hamburger {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: transparent;
    border: 1px solid rgba(255,248,127,0.4);
    border-radius: var(--pn-radius);
    padding: 0.45rem 0.6rem;
    cursor: pointer;
    transition: border-color var(--pn-transition);
  }
  .pn-hamburger:hover { border-color: var(--pn-gold); }
  @media (max-width: 768px) {
    .pn-hamburger { display: flex; }
  }
  .pn-hamburger__bar {
    display: block;
    width: 22px;
    height: 2px;
    background: var(--pn-gold);
    border-radius: 2px;
    transform-origin: center;
    transition: transform 0.22s ease, opacity 0.22s ease;
  }
  .pn-hamburger[aria-expanded="true"] .pn-hamburger__bar:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }
  .pn-hamburger[aria-expanded="true"] .pn-hamburger__bar:nth-child(2) {
    opacity: 0;
    transform: scaleX(0);
  }
  .pn-hamburger[aria-expanded="true"] .pn-hamburger__bar:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }

  /* Mobile menu */
  .pn-mobile-menu {
    display: none;
    background: var(--pn-bg-mobile);
    border-bottom: 2px solid rgba(255,248,127,0.15);
    padding: 0.75rem 1.25rem 1.25rem;
    animation: pn-slideDown 0.22s ease;
  }
  .pn-mobile-menu--open { display: block; }
  @media (min-width: 769px) {
    .pn-mobile-menu { display: none !important; }
  }
  @keyframes pn-slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pn-mobile-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .pn-mobile-link {
    display: block;
    font-family: var(--pn-font-body);
    font-size: 0.93rem;
    font-weight: 600;
    color: var(--pn-text-bright);
    text-decoration: none;
    padding: 0.7rem 0.85rem;
    border-radius: var(--pn-radius);
    transition: background var(--pn-transition), color var(--pn-transition);
  }
  .pn-mobile-link:hover {
    background: rgba(255,248,127,0.08);
    color: var(--pn-gold);
  }
  .pn-mobile-list__divider {
    border-top: 1px solid rgba(255,248,127,0.15);
    margin-top: 0.5rem;
    padding-top: 0.5rem;
  }
  .pn-mobile-login {
    display: block;
    background: var(--pn-gold);
    color: #006312;
    font-family: var(--pn-font-body);
    font-size: 0.93rem;
    font-weight: 700;
    text-decoration: none;
    text-align: center;
    padding: 0.75rem;
    border-radius: var(--pn-radius);
    transition: background var(--pn-transition), transform var(--pn-transition);
  }
  .pn-mobile-login:hover {
    background: #ffe930;
    transform: scale(1.01);
  }
`;

function NavLink({ href, label, active }) {
  return (
    <a
      href={href}
      className={`pn-link${active ? " pn-link--active" : ""}`}
      aria-current={active ? "true" : undefined}
    >
      {label}
    </a>
  );
}

export default function PublicNavbar({ activeSection = "", showLinks = true }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="pn-header">
      {/* Inject styles directly so CSS file path can never break this */}
      <style>{NAVBAR_STYLES}</style>

      {/* ── Main navigation bar ── */}
      <nav
        className={`pn-nav ${scrolled ? "pn-nav--scrolled" : "pn-nav--default"}`}
        aria-label="Main navigation"
      >
        {/* Brand / logo */}
        <a href="/" className="pn-brand" aria-label="MCPBAHS homepage">
          <div className="pn-brand__seal">
            <img src={logo} alt="School seal" />
          </div>
          <div className="pn-brand__text">
            <span className="pn-brand__name">
              Maria Cristina P. Belcar Agricultural High School
            </span>
            <span className="pn-brand__tagline">
              We plant good seeds in the heart of every learner.
            </span>
          </div>
        </a>

        {/* Desktop nav links */}
        {showLinks && (
          <ul className="pn-links" role="list">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={label}>
                <NavLink
                  href={href}
                  label={label}
                  active={activeSection === href.slice(1)}
                />
              </li>
            ))}
            <li>
              <a href="/login" className="pn-login-btn">Login</a>
            </li>
          </ul>
        )}

        {/* Form pages — login button only */}
        {!showLinks && (
          <a href="/login" className="pn-login-btn">Login</a>
        )}

        {/* Hamburger (mobile) */}
        {showLinks && (
          <button
            className="pn-hamburger"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="pn-mobile-menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="pn-hamburger__bar" aria-hidden="true" />
            <span className="pn-hamburger__bar" aria-hidden="true" />
            <span className="pn-hamburger__bar" aria-hidden="true" />
          </button>
        )}
      </nav>

      {/* ── Mobile dropdown ── */}
      {showLinks && (
        <div
          id="pn-mobile-menu"
          className={`pn-mobile-menu${mobileOpen ? " pn-mobile-menu--open" : ""}`}
          aria-hidden={!mobileOpen}
        >
          <ul className="pn-mobile-list" role="list">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  className="pn-mobile-link"
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </a>
              </li>
            ))}
            <li className="pn-mobile-list__divider">
              <a href="/login" className="pn-mobile-login">
                Login
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}