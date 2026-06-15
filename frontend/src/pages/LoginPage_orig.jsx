/**
 * LoginPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * School management portal login screen.
 *
 * Responsibilities (this file only):
 *   • Render the two-panel login UI
 *   • Manage local form + UI state
 *   • Delegate all API / auth / logging concerns to loginApi.js
 *
 * API logic → ./loginApi.js
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

import logo   from "../assets/school-logo.png";
import heroBg from "../assets/hero.png";
import "../Css/LoginPage/LoginPage.css";

import {
  fetchSchoolData,
  authenticate,
  authenticateFallback,
  logSession,
  getFallbackUsers,
} from "../Api/loginApi";
import { validateTextField } from "../utils/inputValidation";
// ─── Route map ───────────────────────────────────────────────────

const ROLE_ROUTES = {
  admin:     "/admin/dashboard",
  principal: "/principal/announcements",
  registrar: "/registrar/dashboard",
  teacher:   "/teacher/dashboard",
};

const USE_API =
  Boolean(import.meta.env.VITE_API_BASE_URL) &&
  import.meta.env.VITE_USE_API_AUTH !== "false";
const ALLOW_AUTH_FALLBACK = import.meta.env.VITE_ALLOW_AUTH_FALLBACK !== "false";

const OFFLINE_TEST_ACCOUNT = {
  username: "principal",
  password: "1234",
  role: "principal",
};

// ─── Default school data (shown instantly while API loads) ───────

/** @type {import('./loginApi').SchoolData} */
const DEFAULT_SCHOOL_DATA = {
  stats:         { students: "4,386", teachers: "24", sections: "48" },
  announcements: { count: 3, latest: "3 new today" },
  schedule:      { label: "Updated weekly" },
  reports:       { label: "Q3 submitted" },
};

// ─── Icons ───────────────────────────────────────────────────────

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

// ─── Shimmer skeleton ────────────────────────────────────────────

const Shimmer = ({ width = "60px", height = "1em" }) => (
  <span className="deco-shimmer" style={{ width, height }} aria-hidden="true" />
);

const DecorativePanel = ({ schoolData, dataLoading }) => {
  const { stats, announcements, enrollment, schedule, reports } = schoolData;
  return (
    <div className="deco-panel">

      <div className="deco-center">
        <p className="deco-eyebrow">TVL · Senior High School</p>

        <h2 className="deco-heading">
          Manage your school<br/><span className="deco-accent">smarter.</span>
        </h2>
        <p className="deco-body">
          Enrollment, scheduling, faculty records,<br/>and DepEd reports — all in one place.
        </p>

        <div className="deco-stats">
          {[
            [stats.students, "Students"],
            [stats.teachers, "Teachers"],
            [stats.sections, "Sections"],
          ].map(([v, l]) => (
            <div key={l} className="deco-stat">
              {dataLoading
                ? <Shimmer width="44px" height="22px" />
                : <span className="deco-stat-val">{v}</span>}
              <span className="deco-stat-lbl">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // ── Form state ─────────────────────────────────────────────────
  const [username,     setUsername]     = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [fieldErrors,  setFieldErrors]  = useState({});
  const [isLoading,    setIsLoading]    = useState(false);
  const [apiStatus,    setApiStatus]    = useState(null); // "api" | "fallback"

  // ── School data state ──────────────────────────────────────────
  const [schoolData,  setSchoolData]  = useState(DEFAULT_SCHOOL_DATA);
  const [dataLoading, setDataLoading] = useState(true);

  // ── Fetch live school data on mount ───────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const live = await fetchSchoolData();
        if (!cancelled) setSchoolData(live);
      } catch {
        // API unavailable — defaults remain, no error shown to user.
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Login handler ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setApiStatus(null);

    const nextErrors = {
      username: validateTextField(username, "Username", { min: 3, max: 40 }),
      password: validateTextField(password, "Password", { min: 4, max: 128 }),
    };
    Object.keys(nextErrors).forEach(key => {
      if (!nextErrors[key]) delete nextErrors[key];
    });

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("Please fix the highlighted fields.");
      return;
    }

    setIsLoading(true);
    const trimmedUser = username.trim();

   
try {
  let role = null;
  let result;
  let authSource = "fallback";

  // ── AUTH SWITCH ─────────────────────────────
  if (USE_API) {
    try {
      result = await authenticate(trimmedUser, password);
      authSource = "api";
      if (!result?.success && ALLOW_AUTH_FALLBACK) {
        const fallbackResult = authenticateFallback(trimmedUser, password);
        if (fallbackResult.success) {
          result = fallbackResult;
          authSource = "fallback";
        }
      }
    } catch (apiError) {
      if (!ALLOW_AUTH_FALLBACK) throw apiError;
      console.warn(
        "[LoginPage] API auth unavailable; using fallback login.",
        apiError,
        "Offline default test login:",
        OFFLINE_TEST_ACCOUNT,
      );
      result = authenticateFallback(trimmedUser, password);
      authSource = "fallback";
    }
  } else {
    result = authenticateFallback(trimmedUser, password);
    authSource = "fallback";
  }
  setApiStatus(authSource);

  // ── VALIDATION ─────────────────────────────
  if (!result || !result.success) {
    logSession({
      username: trimmedUser,
      role: null,
      success: false,
      reason: result?.reason || "Invalid credentials",
      source: authSource,
    });

    setError("Invalid username or password. Please try again.");
    return;
  }

  role = String(result.role ?? "").trim().toLowerCase();

  // ── ROLE CHECK (IMPORTANT SAFETY) ──────────
  const allowedRoles = ["admin", "principal", "registrar", "teacher"];

  if (!allowedRoles.includes(role)) {
    setError("Unauthorized role detected.");
    return;
  }

  // ── LOG SUCCESS ────────────────────────────
  logSession({
    username: trimmedUser,
    role,
    success: true,
    source: authSource,
  });

  // ── SAVE SESSION ───────────────────────────
  const defaultUser = result.user ?? {
    name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
    email: `${trimmedUser}@deped.gov.ph`,
  };

  login({
    username: trimmedUser,
    role,
    token: result.token ?? null,
    user: defaultUser,
    isAuthenticated: true,
    loginTime: new Date().toISOString(),
    authSource,
  });

  // ── REDIRECT BY ROLE ───────────────────────
  navigate(ROLE_ROUTES[role] ?? "/");

} catch (unexpected) {
  setError("Something went wrong. Please try again.");
  console.error(unexpected);
} finally {
  setIsLoading(false);
}
  };

  //Render

  return (
    <div className="login-root">

      {/* ── Left hero panel ── */}
      <section
        className="login-hero"
        aria-label="School information panel"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="hero-overlay" aria-hidden="true" />

        <div className="hero-brand">
          <img src={logo} alt="School Seal" className="hero-logo" />
          <div>
            <div className="hero-school-name">M.C.P.B.A.H.S</div>
            <div className="hero-school-sub">Maria Cristina Proper Belgar Agricultural High School</div>
          </div>
        </div>

        <div className="hero-body" aria-hidden="true">
          <DecorativePanel schoolData={schoolData} dataLoading={dataLoading} />
        </div>

        <footer className="hero-footer">
          {["Privacy Policy", "Terms of Use", "DepEd Portal", "Support"].map(l => (
            <a key={l} href="#" className="hero-footer-link">{l}</a>
          ))}
        </footer>
      </section>

      {/* ── Right form panel ── */}
      <main className="login-form-panel">
        <button onClick={() => navigate("/")} className="login-back-btn" aria-label="Go back">
          <IconArrowLeft /> Back
        </button>

        <div className="login-form-inner">
          <div className="login-form-header">
            <div className="login-form-logo-wrap">
              <img src={logo} alt="School Seal" className="login-form-logo" />
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-sub">Sign in to the School Management Portal</p>
          </div>

          <div className="login-form-divider" />

          <form onSubmit={handleSubmit} noValidate className="login-form">
            <div className="login-field">
              <label htmlFor="username" className="login-label">Username</label>
              <input
                id="username" type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => {
                  setUsername(e.target.value.replace(/[<>]/g, "").slice(0, 40));
                  setFieldErrors(prev => ({ ...prev, username: undefined }));
                }}
                autoComplete="username" autoFocus required
                className="login-input"
                aria-invalid={fieldErrors.username ? "true" : undefined}
              />
              {fieldErrors.username && <span className="login-field-error">{fieldErrors.username}</span>}
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="password" className="login-label">Password</label>
                {/*<a href="#" className="login-forgot">Forgot password?</a>*/}
              </div>
              <div className="login-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value.slice(0, 128));
                    setFieldErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  autoComplete="current-password" required
                  className="login-input login-input--pw"
                  aria-invalid={fieldErrors.password ? "true" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="login-pw-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {fieldErrors.password && <span className="login-field-error">{fieldErrors.password}</span>}
            </div>

            {error && (
              <div className="login-error" role="alert">
                <span className="login-error-icon">⚠</span>{error}
              </div>
            )}

            {apiStatus && !error && (
              <>
                <div className={`login-api-badge login-api-badge--${apiStatus}`} aria-live="polite">
                  {apiStatus === "api"
                    ? <><span>🔒</span> Secured via API authentication</>
                    : <><span>🔧</span> Running in offline/test mode</>}
                </div>
                {apiStatus === "fallback" && (
                  <div className="login-offline-note" aria-live="polite">
                    Offline login fallback active. Use <strong>{OFFLINE_TEST_ACCOUNT.username}</strong> / <strong>{OFFLINE_TEST_ACCOUNT.password}</strong> to test principal access.
                  </div>
                )}
              </>
            )}

            <button type="submit" disabled={isLoading} className="login-submit">
              {isLoading
                ? <><span className="login-spinner" /> Logging in…</>
                : "Log In"}
            </button>
          </form>

          {/* Test credentials — remove in production */}
          <details className="login-test-hint">
            <summary>Test credentials</summary>
            <table className="login-test-table">
              <thead>
                <tr><th>Username</th><th>Password</th><th>Role</th></tr>
              </thead>
              <tbody>
                {getFallbackUsers().map(({ username: u, password: pw, role }) => (
                  <tr key={u}>
                    <td><code>{u}</code></td>
                    <td><code>{pw}</code></td>
                    <td>{role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>

          <div className="login-help">
            <div className="login-help-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a5c1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="login-help-text">
              For login assistance, contact your <strong>IT Administrator</strong> or the school's registrar office.
            </p>
          </div>

          <div className="login-gov-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Official DepEd School Portal · Secured Connection
          </div>
        </div>
      </main>
    </div>
  );
}
