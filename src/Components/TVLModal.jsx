// src/components/sections/TVLModal.jsx
import { useEffect, useRef } from "react";
import "../Css/Modals.css";

export default function TVLModal({ offer, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    modalRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tvm-title"
      className="modal-backdrop"
      onClick={onClose}
    >
      <article
        ref={modalRef}
        tabIndex={-1}
        className="modal-panel tvm-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Close button ── */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="modal-close-btn tvm-close"
        >
          ✕
        </button>

        {/* ── Hero image ── */}
        <figure className="tvm-figure">
          {offer.image ? (
            <img
              src={offer.image}
              alt={offer.title}
              className="tvm-figure__img"
            />
          ) : (
            <div
              className="tvm-figure__img"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 72,
                background: `linear-gradient(135deg, ${offer.accent}22, ${offer.accent}11)`,
              }}
              aria-hidden="true"
            >
              {offer.icon || "🎓"}
            </div>
          )}
          <div className="tvm-figure__scrim" aria-hidden="true" />
          <span
            className="tvm-tag"
            style={{ background: offer.accent }}
          >
            {offer.tag}
          </span>
        </figure>

        {/* ── Content ── */}
        <div className="tvm-content">
          <h2 id="tvm-title" className="tvm-title">
            {offer.title}
          </h2>
          <p className="tvm-desc">{offer.description}</p>

          {/* Meta pills */}
          <ul className="tvm-meta">
            <li className="tvm-meta__pill">⏱ {offer.duration}</li>
            <li className="tvm-meta__pill">🏆 {offer.tesda}</li>
          </ul>

          {/* Details panel */}
          <div className="tvm-details">
            <h3 className="tvm-details__heading">What You'll Learn</h3>
            <ul className="tvm-details__list">
              {offer.details.map((d) => (
                <li key={d} className="tvm-details__item">
                  <span className="tvm-details__check" aria-hidden="true">✓</span>
                  <span className="tvm-details__text">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </article>
    </div>
  );
}