// src/components/sections/EnrollmentSection.jsx
import useInView from "../../hooks/useInView";
import "../../Css/HomePage/EnrollmentSection.css";

const STEPS = [
  {
    num: "01",
    title: "Secure Requirements",
    body: "PSA Birth Certificate, Form 138 (Report Card), Certificate of Good Moral Character, 2×2 ID photos.",
  },
  {
    num: "02",
    title: "Fill Out Forms",
    body: "Download and accomplish the Enrollment Form. Forms are also available at the Registrar's Office.",
  },
  {
    num: "03",
    title: "Submit to Registrar",
    body: "Submit all documents to the Registrar's Office, Room 101, Main Building, Monday–Friday, 8 AM–4 PM.",
  },
  {
    num: "04",
    title: "Await Confirmation",
    body: "You will receive a confirmation slip with your section and schedule. Keep it for reference on the first day.",
  },
];

const FORMS = [
  { name: "Enrollment Form (Grade 7)",        size: "124 KB", icon: "📋" },
  { name: "Enrollment Form (Grade 11 SHS)",   size: "136 KB", icon: "📋" },
  { name: "Learner's Request for Records",    size: "98 KB",  icon: "📄" },
  { name: "Good Moral Certificate Request",   size: "88 KB",  icon: "📄" },
  { name: "Parent/Guardian Consent Form",     size: "76 KB",  icon: "📝" },
  { name: "Balik-Eskwela Health Declaration", size: "112 KB", icon: "🏥" },
];

// ── Download icon SVG ─────────────────────────────────────
const DownloadIcon = () => (
  <svg
    className="enroll-form-row__btn-icon"
    width="11" height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// ─────────────────────────────────────────────────────────
export default function EnrollmentSection() {
  const [ref, inView] = useInView();

  return (
    <section
      id="enrollment"
      className="enroll-section"
      aria-labelledby="enroll-heading"
    >
      <div ref={ref} className="enroll-section__inner">

        {/* ── Section header ── */}
        <header className={`enroll-section__header enroll-fade${inView ? " visible" : ""}`}>

          {/* Live enrollment status badge */}
          <div className="enroll-status" role="status" aria-live="polite">
            <span className="enroll-status__dot" aria-hidden="true" />
            Enrollment Open · SY 2025–2026
          </div>

          <div className="enroll-section__eyebrow" aria-hidden="true">
            Enrollment
          </div>

          <h2 id="enroll-heading" className="enroll-section__heading">
            How to <em>enroll</em> at MCPBAHS
          </h2>

          <p className="enroll-section__sub">
            Enrollment for <strong>SY 2025–2026</strong> is now open for{" "}
            <strong>Grade 7</strong> and <strong>Grade 11 (SHS)</strong>.
            Follow the steps below and download the required forms to get started.
          </p>
        </header>

        {/* ── Steps ── */}
        <div aria-label="Enrollment steps">
          <p className="enroll-steps-heading" aria-hidden="true">
            Step-by-step process
          </p>

          <ol
            className="enroll-steps-grid"
            aria-label="Enrollment steps"
          >
            {STEPS.map((s, i) => (
              <li
                key={i}
                className={`enroll-step${inView ? " visible" : ""}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                {/* Number bubble */}
                <div className="enroll-step__num" aria-hidden="true">
                  {s.num}
                </div>
                <h3 className="enroll-step__title">{s.title}</h3>
                <p className="enroll-step__body">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Downloadable Forms ── */}
        <div
          className={`enroll-forms-block enroll-fade${inView ? " visible" : ""}`}
          style={{ transitionDelay: "0.42s" }}
        >
          {/* Forms block header */}
          <div className="enroll-forms-header">
            <div className="enroll-forms-title">
              <span className="enroll-forms-title-icon" aria-hidden="true">📥</span>
              Downloadable Forms
            </div>
            <span className="enroll-forms-count">
              {FORMS.length} documents
            </span>
          </div>

          {/* Forms list */}
          <ul
            className="enroll-forms-list"
            aria-label="Downloadable enrollment forms"
          >
            {FORMS.map((f) => (
              <li key={f.name}>
                <a
                  href="#"
                  className="enroll-form-row"
                  aria-label={`Download ${f.name} (${f.size})`}
                  download
                >
                  <div className="enroll-form-row__left">
                    <span className="enroll-form-row__icon" aria-hidden="true">
                      {f.icon}
                    </span>
                    <span className="enroll-form-row__name">{f.name}</span>
                  </div>

                  <div className="enroll-form-row__right">
                    <span className="enroll-form-row__size" aria-hidden="true">
                      {f.size}
                    </span>
                    <span className="enroll-form-row__btn">
                      <DownloadIcon />
                      Download
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </section>
  );
}