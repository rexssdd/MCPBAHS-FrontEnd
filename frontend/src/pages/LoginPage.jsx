import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { toastService } from "../Components/ToastNotification";

import logo from "../assets/school-logo.png";
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

const ROLE_ROUTES = {
  admin: "/admin/dashboard",
  principal: "/principal/dashboard",
  registrar: "/registrar/dashboard",
  teacher: "/teacher/dashboard",
};

const USE_API =
  Boolean(import.meta.env.VITE_API_BASE_URL) &&
  import.meta.env.VITE_USE_API_AUTH !== "false";

// FIX: was !== "false" — defaulted to TRUE in any non-PROD env, meaning any
// dev or staging deployment ships with a local-credential backdoor unless
// explicitly disabled. Now defaults to OFF; must be explicitly set to "true".
const ALLOW_AUTH_FALLBACK =
  !import.meta.env.PROD &&
  import.meta.env.VITE_ALLOW_AUTH_FALLBACK === "true";

const DEFAULT_SCHOOL_DATA = {
  stats: {
    students: "4,386",
    teachers: "24",
    sections: "48",
  },
};

const IconEye = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconArrowLeft = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const DecorativePanel = ({ schoolData }) => {
  const { stats } = schoolData;

  return (
    <div className="deco-panel">
      <div className="deco-center">
        <p className="deco-eyebrow">TVL · Senior High School</p>

        <h2 className="deco-heading">
          Manage your school
          <br />
          <span className="deco-accent">smarter.</span>
        </h2>

        <p className="deco-body">
          Enrollment, scheduling, faculty records,
          <br />
          and DepEd reports — all in one place.
        </p>

        <div className="deco-stats">
          {[
            [stats.students, "Students"],
            [stats.teachers, "Teachers"],
            [stats.sections, "Sections"],
          ].map(([value, label]) => (
            <div key={label} className="deco-stat">
              <span className="deco-stat-val">{value}</span>
              <span className="deco-stat-lbl">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const [schoolData, setSchoolData] = useState(DEFAULT_SCHOOL_DATA);

  useEffect(() => {
    const loadSchoolData = async () => {
      try {
        const data = await fetchSchoolData();

        if (data) {
          setSchoolData(data);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("[LoginPage] Failed to load school data:", err);
        }
      }
    };

    loadSchoolData();
  }, []);
  
  const validateDepedEmail = (value) => {
    const email = value.trim();

    if (!email) {
      return "Username or email is required.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setFieldErrors({});

    const trimmedUsername = username.trim();

    const errors = {};

    const usernameError = validateDepedEmail(trimmedUsername);

    const passwordError = validateTextField(
      password,
      "Password",
      {
        min: 4,
        max: 128,
      }
    );

    if (usernameError) errors.username = usernameError;
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      //setError("Please fix the highlighted fields.");
      return;
    }

    setIsLoading(true);

    try {
      let result = null;

      if (USE_API) {
        try {
          result = await authenticate(trimmedUsername, password);
        } catch (err) {
          if (!ALLOW_AUTH_FALLBACK) {
            throw err;
          }
        }
      }

      if (!result?.success && ALLOW_AUTH_FALLBACK) {
        result = authenticateFallback(trimmedUsername, password);
      }

      if (!result?.success) {
        setError("Invalid username or password.");
        return;
      }

      const role = result.role?.toLowerCase();

      if (!ROLE_ROUTES[role]) {
        setError("Unauthorized role.");
        return;
      }

      login({
        username: trimmedUsername,
        role,
        token: result.token ?? null,
        user: result.user ?? null,
        isAuthenticated: true,
        loginTime: new Date().toISOString(),
      });

      logSession({
        username: trimmedUsername,
        role,
        success: true,
      });

      if (import.meta.env.DEV) {
        console.log("LOGIN RESULT:", result);
      }

      toastService.success(`Welcome back, ${trimmedUsername}!`);
      navigate(ROLE_ROUTES[role]);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(err);
      }
      const errorMsg = err?.message || "Something went wrong. Please try again.";
      toastService.error(errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-root">
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

            <div className="hero-school-sub">
              Maria Cristina Proper Belgar Agricultural High School
            </div>
          </div>
        </div>

        <div className="hero-body" aria-hidden="true">
          <DecorativePanel schoolData={schoolData} />
        </div>

        <footer className="hero-footer">
          {[
            "Privacy Policy",
            "Terms of Use",
            "DepEd Portal",
            "Support",
          ].map((label) => (
            <a key={label} href="#" className="hero-footer-link">
              {label}
            </a>
          ))}
        </footer>
      </section>

      <main className="login-form-panel">
        <button
          onClick={() => navigate("/")}
          className="login-back-btn"
          aria-label="Go back"
        >
          <IconArrowLeft /> Back
        </button>

        <div className="login-form-inner">
          <div className="login-form-header">
            <div className="login-form-logo-wrap">
              <img
                src={logo}
                alt="School Seal"
                className="login-form-logo"
              />
            </div>

            <h1 className="login-title">Welcome Back</h1>

            <p className="login-sub">
              Sign in to the School Management Portal
            </p>
          </div>

          <div className="login-form-divider" />

          <form
            onSubmit={handleSubmit}
            noValidate
            className="login-form"
          >
            <div className="login-field">
              <label htmlFor="username" className="login-label">
                Username
              </label>

              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 40);

                  setUsername(value);

                  setFieldErrors((prev) => ({
                    ...prev,
                    username: validateDepedEmail(value),
                  }));
                }}   
                autoComplete="username"
                autoFocus
                required
                className="login-input"
                aria-invalid={
                  fieldErrors.username ? "true" : undefined
                }
              />

              {fieldErrors.username && (
                <span className="login-field-error">
                  {fieldErrors.username}
                </span>
              )}
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label
                  htmlFor="password"
                  className="login-label"
                >
                  Password
                </label>
              </div>

              <div className="login-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value.slice(0, 128));

                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: null,
                      }));
                    }
                  }}
                  autoComplete="current-password"
                  required
                  className="login-input login-input--pw"
                  aria-invalid={
                    fieldErrors.password ? "true" : undefined
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  className="login-pw-toggle"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <IconEyeOff />
                  ) : (
                    <IconEye />
                  )}
                </button>
              </div>

              {fieldErrors.password && (
                <span className="login-field-error">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {error && (
              <div className="login-error" role="alert">
                <span className="login-error-icon">⚠</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="login-submit"
            >
              {isLoading ? (
                <>
                  <span className="login-spinner" />
                  Logging in…
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/**
           * 
           * <details className="login-test-hint">
            <summary>Test credentials</summary>

            <table className="login-test-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Password</th>
                  <th>Role</th>
                </tr>
              </thead>

              <tbody>
                {getFallbackUsers().map(
                  ({ username, password, role }) => (
                    <tr key={username}>
                      <td>
                        <code>{username}</code>
                      </td>

                      <td>
                        <code>{password}</code>
                      </td>

                      <td>{role}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </details>
           */}
          

          <div className="login-help">
            <div className="login-help-icon">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1a5c1a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <p className="login-help-text">
              For login assistance, contact your{" "}
              <strong>IT Administrator</strong> or the school's
              registrar office.
            </p>
          </div>

          <div className="login-gov-badge">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>

            Official DepEd School Portal · Secured Connection
          </div>
        </div>
      </main>
    </div>
  );
}