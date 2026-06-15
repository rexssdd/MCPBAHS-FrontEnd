// src/components/PublicFooter.jsx
import "../Css/PublicFooter.css";   // ← move CSS to same folder, or adjust path
import logo from "../assets/school-logo.png"; // ← example logo import, replace with actual path

const FOOTER_LINKS = [
  { label: "About",           href: "#about" },
  { label: "TVL Offers",      href: "#tvl-offers" },
  { label: "Enrollment",      href: "#enrollment" },
  { label: "Faculty & Staff", href: "#faculty" },
  { label: "School Calendar", href: "#school-calendar" },
  { label: "Contact Us",      href: "#contact" },
];

const SCHOOL_INFO = [
  { label: "DepEd School ID", value: "300101" },
  { label: "Region",          value: "CAR" },
  { label: "Division",        value: "Baguio City" },
  { label: "Year Founded",    value: "1994" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy",           href: "#" },
  { label: "Accessibility Statement",  href: "#" },
  { label: "DepEd Order No. 8",        href: "#" },
];

const SOCIAL = [
  { icon: "f",  label: "Facebook", href: "https://facebook.com" },
  { icon: "✉",  label: "Email",    href: "mailto:mcpbahs@deped.gov.ph" },
  { icon: "📞", label: "Phone",    href: "tel:+6374123456" },
];

export default function PublicFooter() {
  return (
    <footer className="pf-footer">

      {/* Gold-to-green top accent stripe */}
      <div className="pf-footer__accent" aria-hidden="true" />

      {/* ── Main 4-column grid ── */}
      <div className="pf-footer__main">

        {/* ── Branding ── */}
        <div className="pf-brand">
          <div className="pf-brand__logo-row">
            <img src={logo} alt="School Logo" className="pf-brand__logo" />
            <strong className="pf-brand__name">
              Maria Cristina P. Belcar Agricultural High School
            </strong>
          </div>
          <p className="pf-brand__desc">
            A DepEd-accredited public school committed to agricultural education
            and TVL excellence in Baguio City.
          </p>
          <span className="pf-brand__tagline">
            "We plant good seeds in the heart of every learner."
          </span>
        </div>

        {/* ── Quick links ── */}
        <nav aria-label="Footer navigation">
          <h3 className="pf-col-heading">Quick Links</h3>
          <ul className="pf-nav-list">
            {FOOTER_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a href={href}>{label}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── School info ── */}
        <div>
          <h3 className="pf-col-heading">School Info</h3>
          <dl className="pf-info-list">
            {SCHOOL_INFO.map(({ label, value }) => (
              <div className="pf-info-item" key={label}>
                <dt className="pf-info-label">{label}</dt>
                <dd className="pf-info-value">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── Connect / social ── */}
        <nav aria-label="Social media and contact links">
          <h3 className="pf-col-heading">Connect</h3>
          <ul className="pf-social-list">
            {SOCIAL.map(({ icon, label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  className="pf-social-link"
                  aria-label={label}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <span className="pf-social-icon" aria-hidden="true">{icon}</span>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

      </div>

      {/* ── Bottom bar ── */}
      <div className="pf-footer__bottom">
        <small className="pf-copyright">
          © {new Date().getFullYear()} Maria Cristina P. Belcar Agricultural High School
          &nbsp;·&nbsp; All Rights Reserved.
        </small>

        {/* Fixed: fragments with keys were causing React warnings */}
        <div className="pf-legal-links">
          {LEGAL_LINKS.map(({ label, href }, i) => (
            <span key={label} className="pf-legal-item">
              <a href={href} className="pf-legal-link">{label}</a>
              {i < LEGAL_LINKS.length - 1 && (
                <span className="pf-legal-sep" aria-hidden="true">·</span>
              )}
            </span>
          ))}
        </div>
      </div>

    </footer>
  );
}