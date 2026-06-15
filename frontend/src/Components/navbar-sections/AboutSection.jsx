// src/components/sections/AboutSection.jsx
import useInView from "../../hooks/useInView";
import "../../Css/HomePage/AboutSection.css";

const MILESTONES = [
  {
    year: "Early Years",
    body: "In the early 1990s, students had to walk about six kilometers to Baguio National School of Arts and Trades (BNSAT) in Baguio Proper, often on poor road conditions.",
  },
  {
    year: "Establishment · 1994–1997",
    body: "1994: Baguio High School of Agriculture was established with four teachers and twenty students. 1997: The school moved to its current site in Tawantawan after the Belcar Family donated a 10,000-square-meter lot to the Department of Education.",
  },
  {
    year: "Expansion · 2003–2007",
    body: "2003: An annex was opened in Barangay Tambobong, which later became Tambobong National High School. 2007: The school became one of the 282 Tech-Voc Secondary Public Schools implementing the Strengthened Technical-Vocational Education Program (STVER).",
  },
  {
    year: "Renaming · 2013",
    body: "On June 24, 2013, the school was renamed Maria Cristina P. Belcar Agricultural High School in honor of the Belcar Family's generosity and contributions to education.",
  },
];

export default function AboutSection() {
  const [ref, inView] = useInView();

  return (
    <section
      id="about"
      className="about-section"
      aria-labelledby="about-heading"
    >
      <div ref={ref} className="about-container">

        {/* ── Section header ── */}
        <header className={`about-header about-section-fade${inView ? " visible" : ""}`}>

          <div className="about-header__tag-row" aria-hidden="true">
            <span className="about-header__tag">
              <span className="about-header__tag-dot" />
              Our Story
            </span>
            <span className="about-header__line" />
          </div>

          <h2 id="about-heading" className="about-heading">
            Rooted in the community,<br />
            <em>growing through the years.</em>
          </h2>

          <p className="about-subheading">
            From a handful of students walking dusty roads to a flourishing agricultural
            school — here is the journey of Maria Cristina P. Belcar Agricultural High School.
          </p>

        </header>

        {/* ── Timeline ── */}
        <ol
          className="about-timeline"
          aria-label="School history milestones"
        >
          {MILESTONES.map((m, i) => (
            <li
              key={i}
              className={`about-milestone${inView ? " visible" : ""}`}
              style={{ transitionDelay: `${i * 0.12}s` }}
            >

              {/* Spine: dot + connecting line */}
              <div className="about-milestone__spine" aria-hidden="true">
                <div className="about-milestone__dot" />
                {i < MILESTONES.length - 1 && (
                  <div className="about-milestone__line" />
                )}
              </div>

              {/* Content */}
              <div className="about-milestone__content">
                <div className="about-milestone__card">
                  <h3 className="about-milestone__year">
                    <span className="about-milestone__year-badge">{m.year}</span>
                  </h3>
                  <p className="about-milestone__body">{m.body}</p>
                </div>
              </div>

            </li>
          ))}
        </ol>

      </div>
    </section>
  );
}