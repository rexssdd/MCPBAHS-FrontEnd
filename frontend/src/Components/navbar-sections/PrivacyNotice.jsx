// src/components/navbar-sections/PrivacyNotice.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import "../../Css/HomePage/PrivacyNotice.css";

/* ══════════════════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════════════════ */

const TABS = [
  { id: "overview",   label: "Overview" },
  { id: "ra10173",    label: "RA 10173 – Full Act" },
  { id: "collection", label: "Data We Collect" },
  { id: "rights",     label: "Your Rights" },
  { id: "security",   label: "Security & Retention" },
  { id: "contact",    label: "Contact & DPO" },
];

// Tabs the user must scroll through before they can accept
const REQUIRED_READ_TABS = new Set(["overview", "rights", "contact"]);


/* ══════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════ */

export default function PrivacyNotice() {
  const [bannerState,   setBannerState]   = useState("visible"); // "visible" | "dismissing" | "gone"
  const [modalOpen,     setModalOpen]     = useState(false);
  const [activeTab,     setActiveTab]     = useState("overview");
  const [accepted,      setAccepted]      = useState(false);
  const [showLockedTip, setShowLockedTip] = useState(false);

  const [tabProgress, setTabProgress] = useState({});        // { tabId: 0–100 }
  const [tabsRead,    setTabsRead]    = useState(new Set()); // fully-scrolled tab ids

  const bodyRef     = useRef(null);
  const sentinelRef = useRef(null);

  const allRequiredRead = [...REQUIRED_READ_TABS].every(t => tabsRead.has(t));

  /* ── Scroll progress tracking ── */
  const handleScroll = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;

    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) {
      setTabProgress(p => ({ ...p, [activeTab]: 100 }));
      setTabsRead(s => new Set([...s, activeTab]));
      return;
    }

    const pct = Math.min(100, Math.round((el.scrollTop / max) * 100));
    setTabProgress(p => ({ ...p, [activeTab]: pct }));
    if (pct >= 95) {
      setTabsRead(s => new Set([...s, activeTab]));
    }
  }, [activeTab]);

  // On tab switch: reset scroll, auto-pass short content
  useEffect(() => {
    if (!modalOpen) return;
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTop = 0;
    setTimeout(() => {
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 20) {
        setTabProgress(p => ({ ...p, [activeTab]: 100 }));
        setTabsRead(s => new Set([...s, activeTab]));
      } else {
        handleScroll();
      }
    }, 80);
  }, [activeTab, modalOpen]);

  // Wire / unwire scroll listener
  useEffect(() => {
    const el = bodyRef.current;
    if (!el || !modalOpen) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll, modalOpen]);

  /* ── Banner ── */
  const handleDismiss = () => {
    setBannerState("dismissing");
    setTimeout(() => setBannerState("gone"), 300);
  };

  /* ── Modal ── */
  const openModal  = (e) => { e?.preventDefault(); setModalOpen(true); setActiveTab("overview"); };
  const closeModal = ()  => setModalOpen(false);

  const handleAccept = () => {
    if (!allRequiredRead) return;
    setAccepted(true);
    setTimeout(() => { closeModal(); handleDismiss(); }, 750);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };

  /* ── Derived UI state ── */
  const currentPct   = tabProgress[activeTab] ?? 0;
  const isRequired   = REQUIRED_READ_TABS.has(activeTab);
  const thisTabDone  = tabsRead.has(activeTab);
  const requiredDone = [...REQUIRED_READ_TABS].filter(t => tabsRead.has(t)).length;

  if (bannerState === "gone") return null;

  return (
    <>
      {/* ══════════════ MODAL ══════════════ */}
      {modalOpen && (
        <div
          className="pn-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pn-modal-title"
          onClick={handleOverlayClick}
        >
          <div className="pn-modal">

            {/* ── Header ── */}
            <div className="pn-modal-header">
              <div className="pn-modal-header-icon" aria-hidden="true">🔒</div>
              <div className="pn-modal-title-block">
                <h2 id="pn-modal-title">Privacy Policy</h2>
                <p>Effective: January 1, 2024 · Republic Act No. 10173 · Philippines</p>
              </div>
              <button
                className="pn-modal-close"
                onClick={closeModal}
                aria-label="Close privacy policy"
              >
                ✕
              </button>
            </div>

            {/* ── Tab navigation ── */}
            <nav className="pn-tabs" aria-label="Privacy policy sections">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`pn-tab${activeTab === t.id ? " active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                  aria-selected={activeTab === t.id}
                  role="tab"
                >
                  {t.label}
                  {REQUIRED_READ_TABS.has(t.id) && !tabsRead.has(t.id) && (
                    <span className="pn-tab-dot" aria-hidden="true" />
                  )}
                </button>
              ))}
            </nav>

            {/* ── Read progress bar ── */}
            <div className="pn-read-bar-wrap">
              <div className="pn-read-bar-header">
                <span className="pn-read-bar-label">
                  {isRequired ? "Required reading" : "Reading progress"}
                  {` — ${requiredDone}/${REQUIRED_READ_TABS.size} sections complete`}
                </span>
                <span className="pn-read-bar-pct">{currentPct}%</span>
              </div>
              <div className="pn-read-bar-track">
                <div className="pn-read-bar-fill" style={{ width: `${currentPct}%` }} />
              </div>
            </div>

            {/* ── Scroll reminder (required tabs only) ── */}
            {isRequired && !thisTabDone && (
              <div className="pn-scroll-notice">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="6" stroke="rgba(255,190,80,0.7)" strokeWidth="1" />
                  <path d="M6.5 3.5v3.2l2 2" stroke="rgba(255,190,80,0.7)" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                Please scroll through this section before accepting
              </div>
            )}

            {/* ── Scrollable body ── */}
            <div className="pn-modal-body" ref={bodyRef} role="tabpanel">
              <TabContent activeTab={activeTab} />

              {/* Scroll-end sentinel */}
              <div ref={sentinelRef} className={`pn-scroll-end${thisTabDone ? " reached" : ""}`}>
                {thisTabDone
                  ? <><CheckIcon /> Section read — thank you</>
                  : <>↓ Scroll to the bottom to complete this section</>
                }
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="pn-modal-footer">
              <div className="pn-footer-left">
                <span className="pn-footer-note">
                  {allRequiredRead
                    ? `✓ All ${REQUIRED_READ_TABS.size} required sections reviewed`
                    : `Read ${requiredDone} of ${REQUIRED_READ_TABS.size} required sections to accept`}
                </span>
                <span className="pn-footer-law">
                  Republic Act No. 10173 · Data Privacy Act of 2012 · NPC Philippines
                </span>
              </div>

              <div
                className="pn-accept-wrap"
                onMouseEnter={() => !allRequiredRead && setShowLockedTip(true)}
                onMouseLeave={() => setShowLockedTip(false)}
              >
                {!allRequiredRead && showLockedTip && (
                  <div className="pn-locked-tip">
                    Read Overview, Your Rights &amp; Contact first
                  </div>
                )}
                <button
                  className={[
                    "pn-btn-accept",
                    accepted         ? "accepted" : "",
                    !allRequiredRead ? "locked"   : "",
                  ].join(" ").trim()}
                  onClick={handleAccept}
                  disabled={accepted}
                  aria-label="Accept privacy policy"
                >
                  {accepted ? (
                    <><CheckIcon /> Accepted</>
                  ) : !allRequiredRead ? (
                    <><span className="lock-ico">🔒</span> Accept</>
                  ) : (
                    <>Accept &amp; Continue</>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════ BANNER ══════════════ */}
      <div
        role="alert"
        aria-live="polite"
        aria-label="Privacy notice"
        className={`pn-banner${bannerState === "dismissing" ? " pn-banner--dismissing" : ""}`}
      >
        <div className="pn-icon" aria-hidden="true">🔒</div>
        <p className="pn-body">
          This website collects limited personal data in compliance with the{" "}
          <strong>Data Privacy Act of 2012 (RA 10173)</strong>.{" "}
          <a href="#" onClick={openModal}>Review our Privacy Policy</a>.
        </p>
        <div className="pn-actions">
          <button
            className="pn-btn-dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss privacy notice"
          >
            Got it
          </button>
        </div>
      </div>
    </>
  );
}


/* ══════════════════════════════════════════════════════════
   Animated checkmark icon
   ══════════════════════════════════════════════════════════ */

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
      <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" />
      <path
        className="pn-check-path"
        d="M4 7l2.2 2.2L10 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


/* ══════════════════════════════════════════════════════════
   Tab content router
   ══════════════════════════════════════════════════════════ */

function TabContent({ activeTab }) {
  switch (activeTab) {
    case "overview":   return <OverviewTab />;
    case "ra10173":    return <Ra10173Tab />;
    case "collection": return <CollectionTab />;
    case "rights":     return <RightsTab />;
    case "security":   return <SecurityTab />;
    case "contact":    return <ContactTab />;
    default:           return null;
  }
}


/* ══════════════════════════════════════════════════════════
   Tab panels
   ══════════════════════════════════════════════════════════ */

function OverviewTab() {
  return (
    <div className="pn-section">
      <h3><span className="ico">📋</span> About this Privacy Policy</h3>
      <p>
        We are fully committed to protecting your personal information in accordance with the{" "}
        <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>, its Implementing
        Rules and Regulations (IRR), and the issuances of the National Privacy Commission (NPC)
        of the Philippines.
      </p>
      <div className="pn-highlight">
        This policy describes what personal data we collect, the lawful bases on which we process
        it, how we protect it, how long we keep it, and the rights you have as a data subject
        under Philippine law.
      </div>

      <h3><span className="ico">🏢</span> Data Controller</h3>
      <p>
        <strong>[Your Company Name]</strong> (hereinafter "the Company," "we," "us," or "our")
        acts as the <strong>Personal Information Controller (PIC)</strong> as defined under
        Section 3(h) of RA 10173. The Company determines the purposes and means of processing
        personal data collected through this website and related services.
      </p>

      <h3><span className="ico">🌐</span> Scope</h3>
      <p>
        This policy applies to all personal data processed by the Company in connection with our
        website, mobile applications, products, and services, whether collected online or offline,
        from customers, users, employees, contractors, and other stakeholders located in the
        Philippines or whose data is processed within Philippine jurisdiction.
      </p>

      <h3><span className="ico">🔄</span> Policy Updates</h3>
      <p>
        We may update this Privacy Policy periodically to reflect changes in our practices,
        applicable law, or regulatory guidance. When we make material changes, we will revise the
        "Effective date" above and notify you by prominent notice on our website or, where
        appropriate, by email. Continued use of our services after the effective date of any
        update constitutes your acceptance of the revised policy.
      </p>

      <h3><span className="ico">✅</span> Your Acknowledgment</h3>
      <p>
        By accepting this policy, you acknowledge that you have read, understood, and agree to the
        collection and processing of your personal data as described herein, in full compliance
        with RA 10173 and the NPC's implementing rules and regulations.
      </p>
      <div className="pn-highlight">
        This document was prepared in good faith to ensure your rights as a data subject are
        upheld. We encourage you to read all sections carefully — particularly{" "}
        <strong>Your Rights</strong> and <strong>Contact &amp; DPO</strong> — before accepting.
      </div>
    </div>
  );
}

function Ra10173Tab() {
  return (
    <div className="pn-section">
      <div className="pn-act-banner">
        Republic of the Philippines · Congress of the Philippines · Metro Manila
      </div>
      <div className="pn-act-title">
        <strong>Republic Act No. 10173</strong>
        <span>Data Privacy Act of 2012</span>
      </div>
      <p className="pn-act-preamble">
        An Act Protecting Individual Personal Information in Information and Communications
        Systems in the Government and the Private Sector, Creating for this Purpose a National
        Privacy Commission, and for Other Purposes.
      </p>

      <span className="pn-act-chapter">Chapter I — General Provisions</span>
      <span className="pn-act-section">Section 1. Short Title.</span>
      <p>This Act shall be known as the "<strong>Data Privacy Act of 2012</strong>."</p>

      <span className="pn-act-section">Section 2. Declaration of Policy.</span>
      <p>
        It is the policy of the State to protect the fundamental human right of privacy, of
        communication while ensuring free flow of information to promote innovation and growth.
        The State recognizes the vital role of information and communications technology in
        nation-building and its inherent obligation to ensure that personal information in
        information and communications systems in the government and in the private sector are
        secured and protected.
      </p>

      <span className="pn-act-section">Section 3. Definition of Terms.</span>
      <ul>
        <li><strong>(a) Commission</strong> — refers to the National Privacy Commission created by virtue of this Act.</li>
        <li><strong>(b) Consent of the data subject</strong> — refers to any freely given, specific, informed indication of will, whereby the data subject agrees to the collection and processing of personal information about and/or relating to him or her.</li>
        <li><strong>(c) Data subject</strong> — refers to an individual whose personal, sensitive personal, or privileged information is processed.</li>
        <li><strong>(f) Personal information</strong> — refers to any information whether recorded in a material form or not, from which the identity of an individual is apparent or can be reasonably and directly ascertained by the entity holding the information.</li>
        <li><strong>(g) Personal information controller</strong> — refers to a natural or juridical person, or any other body who controls the processing of personal data, or instructs another to process personal data on its behalf.</li>
        <li><strong>(h) Personal information processor</strong> — refers to any natural or juridical person or any other body to whom a personal information controller may outsource or instruct the processing of personal data pertaining to a data subject.</li>
        <li><strong>(i) Processing</strong> — refers to any operation or any set of operations performed upon personal data including, but not limited to, the collection, recording, organization, storage, updating or modification, retrieval, consultation, use, consolidation, blocking, erasure or destruction of data.</li>
        <li><strong>(k) Sensitive personal information</strong> — refers to personal information about an individual's race, ethnic origin, marital status, age, color, and religious, philosophical or political affiliations; health, education, genetic or sexual life; government-issued identifiers; or classified under executive order or act of Congress.</li>
      </ul>

      <span className="pn-act-chapter">Chapter II — The National Privacy Commission</span>
      <span className="pn-act-section">Section 4. Scope.</span>
      <p>
        This Act applies to the processing of all types of personal information and to any natural
        and juridical person involved in personal information processing including those personal
        information controllers and processors who, although not found or established in the
        Philippines, use equipment that are located in the Philippines, or those who maintain an
        office, branch or agency in the Philippines.
      </p>

      <span className="pn-act-section">Section 7. Functions of the National Privacy Commission.</span>
      <ul>
        <li>(a) Ensure compliance of personal information controllers with the provisions of this Act;</li>
        <li>(b) Receive complaints, institute investigations, facilitate mediation proceedings, adjudicate, award indemnity on matters affecting any personal information;</li>
        <li>(c) Issue cease and desist orders, impose a temporary or permanent ban on the processing of personal information;</li>
        <li>(h) Recommend to the Department of Justice (DOJ) the prosecution and imposition of penalties specified in Sections 25 to 29 of this Act;</li>
        <li>(k) Render opinions on matters affecting data privacy, including any question on the application or interpretation of this Act.</li>
      </ul>

      <span className="pn-act-chapter">Chapter III — Processing of Personal Information</span>
      <span className="pn-act-section">Section 11. General Data Privacy Principles.</span>
      <ul>
        <li><strong>(a) Transparency</strong> — The data subject must be aware of the nature, purpose, and extent of the processing of his or her personal data.</li>
        <li><strong>(b) Legitimate purpose</strong> — The processing of information shall be compatible with a declared and specified purpose which must not be contrary to law, morals, or public policy.</li>
        <li><strong>(c) Proportionality</strong> — The processing of information shall be adequate, relevant and limited to what is necessary in relation to the purposes for which they are processed.</li>
      </ul>

      <span className="pn-act-section">Section 12. Criteria for Lawful Processing.</span>
      <ul>
        <li>(a) The data subject has given his or her consent;</li>
        <li>(b) Processing is necessary for fulfillment of a contract with the data subject;</li>
        <li>(c) Processing is necessary for compliance with a legal obligation;</li>
        <li>(d) Processing is necessary to protect vitally important interests of the data subject, including life and health;</li>
        <li>(f) Processing is necessary for the purposes of the legitimate interests pursued by the personal information controller.</li>
      </ul>

      <span className="pn-act-chapter">Chapter IV — Rights of the Data Subject</span>
      <span className="pn-act-section">Section 16. Rights of the Data Subject.</span>
      <ul>
        <li><strong>(a) Right to be informed</strong> — whether personal data pertaining to him or her shall be, are being or have been processed.</li>
        <li><strong>(b) Right to access</strong> — upon demand, be furnished the contents, sources, recipients, manner, and reasons for processing of personal data.</li>
        <li><strong>(c) Right to object</strong> — object to the processing of his or her personal data, including processing for direct marketing.</li>
        <li><strong>(d) Right to erasure or blocking</strong> — suspend, withdraw or order the blocking, removal or destruction of personal data.</li>
        <li><strong>(e) Right to damages</strong> — be indemnified for any damages sustained due to inaccurate or unlawfully obtained personal data.</li>
        <li><strong>(f) Right to file a complaint</strong> — file a complaint before the Commission.</li>
        <li><strong>(g) Right to data portability</strong> — obtain a copy of data undergoing processing in an electronic or structured format.</li>
      </ul>

      <span className="pn-act-chapter">Chapter V — Security of Personal Information</span>
      <span className="pn-act-section">Section 20. Security of Personal Information.</span>
      <p>
        The personal information controller must implement reasonable and appropriate
        organizational, physical and technical measures intended for the protection of personal
        information against any accidental or unlawful destruction, alteration and disclosure,
        as well as against any other unlawful processing.
      </p>

      <span className="pn-act-chapter">Chapter VI — Penalties</span>
      <span className="pn-act-section">Section 25. Unauthorized Processing.</span>
      <p>
        (a) Unauthorized processing of personal information — imprisonment of 1 to 3 years and
        fine of ₱500,000 to ₱2,000,000. (b) Unauthorized processing of sensitive personal
        information — imprisonment of 3 to 6 years and fine of ₱500,000 to ₱4,000,000.
      </p>

      <span className="pn-act-section">Section 29. Unauthorized Access or Intentional Breach.</span>
      <p>
        Imprisonment of 1 to 3 years and fine of ₱500,000 to ₱2,000,000 for persons who
        knowingly and unlawfully break into any system where personal and sensitive personal
        information is stored.
      </p>

      <div className="pn-act-footer">
        Approved: August 15, 2012 · Official Gazette Vol. 108, No. 35
      </div>
    </div>
  );
}

function CollectionTab() {
  return (
    <div className="pn-section">
      <h3><span className="ico">📥</span> Categories of Personal Data Collected</h3>
      <p>We may collect and process the following categories of personal data:</p>
      <ul>
        <li><strong>Identity data</strong> — full name, date of birth, gender, nationality, and government-issued identification numbers (SSS, TIN, PhilHealth, UMID, Passport).</li>
        <li><strong>Contact data</strong> — email address, telephone number, mobile number, and residential or mailing address.</li>
        <li><strong>Financial data</strong> — bank account details and payment card information (processed and encrypted by our payment processor; not stored by us in plain text).</li>
        <li><strong>Technical data</strong> — IP address, browser type and version, time zone setting, operating system and platform.</li>
        <li><strong>Usage data</strong> — information about how you navigate and use our website, products, and services.</li>
        <li><strong>Marketing &amp; communications data</strong> — your preferences in receiving marketing from us and your communication preferences.</li>
        <li><strong>Sensitive personal information</strong> — only where strictly necessary and lawfully permitted under Section 13 of RA 10173.</li>
      </ul>

      <h3><span className="ico">🎯</span> Purposes and Legal Bases</h3>
      <div className="pn-badge-row">
        <span className="pn-pill">Consent (Sec. 12a)</span>
        <span className="pn-pill">Contract (Sec. 12b)</span>
        <span className="pn-pill">Legal obligation (Sec. 12c)</span>
        <span className="pn-pill">Vital interests (Sec. 12d)</span>
        <span className="pn-pill">Legitimate interests (Sec. 12f)</span>
      </div>
      <ul>
        <li>To register you as a new customer or user and fulfill contracts with you;</li>
        <li>To process and deliver orders or services, manage payments and billing;</li>
        <li>To manage our relationship with you, including notifying you about changes to our terms or policy;</li>
        <li>To administer and protect our business and this website;</li>
        <li>To comply with applicable laws and regulations, including tax and anti-money laundering requirements; and</li>
        <li>To detect and prevent fraud, abuse, and security incidents.</li>
      </ul>

      <h3><span className="ico">🔗</span> Third-Party Sharing</h3>
      <p>We do not sell, rent, or trade personal data. We may share data with:</p>
      <ul>
        <li><strong>Service providers</strong> acting as Personal Information Processors (PIPs) under data processing agreements;</li>
        <li><strong>Professional advisers</strong> including lawyers, auditors, and insurers;</li>
        <li><strong>Regulators and authorities</strong> including the NPC, BIR, and other public bodies as required by law.</li>
      </ul>
    </div>
  );
}

function RightsTab() {
  return (
    <div className="pn-section">
      <h3><span className="ico">⚖️</span> Your Rights as a Data Subject</h3>
      <p>
        Under Section 16 of RA 10173, as a data subject you are entitled to the following rights.
        To exercise any of these rights, contact our DPO using the details in the "Contact &amp; DPO" tab.
      </p>

      <h3><span className="ico">📌</span> Right to be Informed (Sec. 16a)</h3>
      <p>You have the right to be informed whether personal data pertaining to you is being, or has been collected and processed, including the existence of automated decision-making and profiling. We fulfill this right through this privacy policy and any applicable notices provided at the time of data collection.</p>

      <h3><span className="ico">🔍</span> Right to Access (Sec. 16b)</h3>
      <p>Upon demand, you may request: the contents of your personal data; the sources from which it was obtained; the names and addresses of recipients; the manner by which it was processed; the reasons for disclosure (if any); and the date it was last accessed and modified.</p>

      <h3><span className="ico">🚫</span> Right to Object (Sec. 16c)</h3>
      <p>You may object to the processing of your personal data, including processing for direct marketing, automated processing, or profiling. Upon receipt of your objection, we shall cease processing unless we can demonstrate compelling legitimate grounds that override your interests.</p>

      <h3><span className="ico">🗑️</span> Right to Erasure or Blocking (Sec. 16d)</h3>
      <p>You may request the blocking, removal, or destruction of your personal data where it is incomplete, outdated, false, unlawfully obtained, or no longer necessary for its original purpose. We will act on verified erasure requests within a reasonable period.</p>

      <h3><span className="ico">💰</span> Right to Damages (Sec. 16e)</h3>
      <p>You are entitled to be indemnified for damages sustained due to inaccurate, incomplete, outdated, false, unlawfully obtained, or unauthorized use of your personal data, in accordance with applicable law.</p>

      <h3><span className="ico">📝</span> Right to File a Complaint (Sec. 16f)</h3>
      <p>You may file a complaint before the National Privacy Commission (NPC). You may also avail of other remedies under existing laws without prejudice to your right to seek administrative relief before the Commission.</p>

      <h3><span className="ico">📦</span> Right to Data Portability (Sec. 16g)</h3>
      <p>Where your personal data is processed electronically and in a structured, commonly used format, you may request a copy of that data in machine-readable form, allowing further use by you.</p>

      <h3><span className="ico">✏️</span> Right to Rectification</h3>
      <p>You may dispute and have corrected any inaccurate or incomplete personal data we hold about you. We will correct or complete the data within a reasonable timeframe upon verification of the request.</p>

      <div className="pn-highlight">
        We will respond to all valid data subject rights requests within{" "}
        <strong>fifteen (15) working days</strong> of receipt. Complex requests may require up to
        30 days. We may ask you to verify your identity before processing your request.
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="pn-section">
      <h3><span className="ico">🔐</span> Technical Security Measures</h3>
      <p>We implement appropriate technical measures in accordance with Section 20 of RA 10173, including:</p>
      <ul>
        <li>Transport Layer Security (TLS/SSL) encryption for all data in transit;</li>
        <li>AES-256 encryption for sensitive data at rest;</li>
        <li>Role-based access controls (RBAC) and the principle of least privilege;</li>
        <li>Multi-factor authentication (MFA) for systems accessing personal data;</li>
        <li>Regular penetration testing and vulnerability assessments; and</li>
        <li>Intrusion detection and prevention systems (IDS/IPS).</li>
      </ul>

      <h3><span className="ico">🏢</span> Organizational Security Measures</h3>
      <ul>
        <li>A designated Data Protection Officer (DPO) registered with the NPC;</li>
        <li>A Privacy Management Program and internal data privacy policies;</li>
        <li>Regular privacy and security awareness training for all personnel;</li>
        <li>Data processing agreements with all third-party processors; and</li>
        <li>Incident response and data breach notification procedures.</li>
      </ul>

      <h3><span className="ico">🔓</span> Data Breach Notification</h3>
      <p>
        In the event of a personal data breach, we shall notify the NPC within{" "}
        <strong>seventy-two (72) hours</strong> of becoming aware of the breach where it is
        likely to result in a risk to the rights and freedoms of data subjects, pursuant to
        NPC Circular 16-03.
      </p>

      <h3><span className="ico">🕒</span> Data Retention</h3>
      <ul>
        <li><strong>Customer account data</strong> — duration of relationship plus 5 years after account closure;</li>
        <li><strong>Transaction and financial records</strong> — 10 years, as required by the BIR and BSP;</li>
        <li><strong>Employment records</strong> — 5 years after end of employment;</li>
        <li><strong>Marketing communications data</strong> — until consent is withdrawn; and</li>
        <li><strong>Website log and analytics data</strong> — up to 24 months in pseudonymized form.</li>
      </ul>

      <h3><span className="ico">🍪</span> Cookies</h3>
      <p>
        Our website uses cookies and similar tracking technologies to distinguish you from other
        users and enhance your browsing experience. You may control cookies through your browser
        settings. A full cookies policy is available upon request to the DPO.
      </p>
    </div>
  );
}

function ContactTab() {
  return (
    <div className="pn-section">
      <h3><span className="ico">👤</span> Data Protection Officer (DPO)</h3>
      <p>
        Pursuant to Section 21 of RA 10173, we have designated a Data Protection Officer (DPO)
        who is responsible for ensuring our compliance with the Act and serves as the primary
        point of contact for all data privacy concerns.
      </p>
      <div className="pn-contact-card">
        <div className="pn-contact-row">
          <span className="pn-contact-label">Name</span>
          <span className="pn-contact-val">[To be designated]</span>
        </div>
        <div className="pn-contact-row">
          <span className="pn-contact-label">Designation</span>
          <span className="pn-contact-val">Data Protection Officer</span>
        </div>
        <div className="pn-contact-row">
          <span className="pn-contact-label">Email</span>
          <span className="pn-contact-val pn-contact-link">dpo@school.deped.gov.ph</span>
        </div>
        <div className="pn-contact-row">
          <span className="pn-contact-label">Phone</span>
          <span className="pn-contact-val">+63 2 8XXX XXXX</span>
        </div>
        <div className="pn-contact-row">
          <span className="pn-contact-label">Address</span>
          <span className="pn-contact-val">[Company Address], Philippines</span>
        </div>
        <div className="pn-contact-row">
          <span className="pn-contact-label">Hours</span>
          <span className="pn-contact-val">Monday – Friday, 8:00 AM – 5:00 PM PHT</span>
        </div>
      </div>

      <h3><span className="ico">📬</span> How to Submit a Request</h3>
      <p>
        To exercise your rights under RA 10173, or to submit a question, concern, or complaint
        regarding our data privacy practices, you may:
      </p>
      <ul>
        <li>Send a written request by email to the DPO address above;</li>
        <li>Submit a written request by registered mail to the DPO at our company address; or</li>
        <li>Fill out our Data Subject Rights Request form, available at our main office.</li>
      </ul>
      <p>
        Please include in your request: your full name, contact details, a copy of a valid
        government-issued ID, a clear description of the right you wish to exercise, and any
        supporting information.
      </p>

      <h3><span className="ico">🏛️</span> National Privacy Commission (NPC)</h3>
      <p>
        If you believe your data privacy rights have been violated, or if you are unsatisfied
        with our response, you may file a complaint with the NPC:
      </p>
      <div className="pn-highlight">
        <strong style={{ color: "rgba(220,245,224,1)" }}>National Privacy Commission</strong><br />
        5th Floor, Delegation Building, PICC Complex<br />
        Roxas Boulevard, Pasay City 1307, Philippines<br />
        📞 +63 2 8234-2228<br />
        📧 <span style={{ color: "#5ecb7a" }}>info@privacy.gov.ph</span><br />
        🌐 <span style={{ color: "#5ecb7a" }}>www.privacy.gov.ph</span>
      </div>
    </div>
  );
}