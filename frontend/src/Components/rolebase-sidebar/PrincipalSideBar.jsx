import { useState } from "react";
import logo from "../../assets/school-logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import "../../Css/PrincipalSideBar.css";

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Enrollment",
    path: "/enrollmentlist",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    label: "Reports and Deeds",
    path: "/principal/reports",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
  {
    label: "DepEd",
    path: "/deped",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    label: "Announcements",
    path: "/announcements",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

const accountItems = [
  {
    label: "Notification",
    path: "/notifications",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: "Profile",
    path: "/profile",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

/* ── Logout Modal ─────────────────────────────────────────────────────────── */
function LogoutModal({ onCancel, onConfirm }) {
  return (
    <div className="sb-overlay">
      <div className="sb-modal">
        <div className="sb-modal-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <h2 className="sb-modal-title">Sign out?</h2>
        <p className="sb-modal-body">
          You will be signed out of your account. Any unsaved changes will be lost.
        </p>
        <div className="sb-modal-foot">
          <button className="sb-modal-btn sb-modal-btn--cancel" onClick={onCancel}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            No, Stay
          </button>
          <button className="sb-modal-btn sb-modal-btn--danger" onClick={onConfirm}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Yes, Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── NavItem ──────────────────────────────────────────────────────────────── */
function NavItem({ item, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(item)}
      className={`sidebar-nav-item${isActive ? " sidebar-nav-item--active" : ""}`}
      title={item.label}
    >
      <span className="sidebar-nav-icon">{item.icon}</span>
      <span className="sidebar-nav-label">{item.label}</span>
      {isActive && <span className="sidebar-nav-pip" />}
    </button>
  );
}

/* ── PrincipalSideBar ─────────────────────────────────────────────────────── */
export default function PrincipalSideBar({ active, onNavigate, onLogout, user }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const activeLabel = active ?? (() => {
    const match = [...navItems, ...accountItems].find(i => location.pathname.startsWith(i.path));
    return match?.label ?? "";
  })();

  const handleClick = (item) => {
    if (onNavigate) onNavigate(item);
    else navigate(item.path);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    sessionStorage.clear();
    if (onLogout) onLogout();
    navigate("/", { replace: true });
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "JD";

  return (
    <>
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-img-wrap">
            <img src={logo} alt="School Seal" className="sidebar-logo-img" />
          </div>
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-name">M.C.P.B.A.H.S</div>
            <div className="sidebar-logo-sub">School Management</div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Main Menu</span>
          {navItems.map(item => (
            <NavItem
              key={item.label}
              item={item}
              isActive={activeLabel === item.label}
              onClick={handleClick}
            />
          ))}
        </nav>

        {/* Account nav */}
        <div className="sidebar-account">
          <span className="sidebar-section-label">Account</span>
          {accountItems.map(item => (
            <NavItem
              key={item.label}
              item={item}
              isActive={activeLabel === item.label}
              onClick={handleClick}
            />
          ))}
        </div>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name ?? "Jane Doe"}</div>
            <div className="sidebar-user-email">{user?.email ?? "janedoe@deped.gov.ph"}</div>
          </div>
          <button
            className="sidebar-logout"
            title="Sign out"
            onClick={() => setShowLogoutModal(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {showLogoutModal && (
        <LogoutModal
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={handleLogoutConfirm}
        />
      )}
    </>
  );
}
