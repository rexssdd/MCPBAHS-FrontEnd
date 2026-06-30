import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/school-logo.png";
import "../../Css/Admin/AdminSideBar.css";

/* ── Nav data (FIXED ROUTES) ─────────────────────────────────────────────── */
const navItems = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Faculty and Staff",
    path: "/admin/faculty-and-staff",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: "TVL Offers",
    path: "/admin/tvl-offers",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    label: "Enrollment",
    path: "/admin/enrollmentlist",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      </svg>
    ),
  },
  {
    label: "Scheduling and Section",
    path: "/admin/scheduling",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
      </svg>
    ),
  },
  {
    label: "User",
    path: "/admin/usermanagement",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: "Reports and DepEd",
    path: "/admin/reports",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
      </svg>
    ),
  },
  {
    label: "Announcements",
    path: "/admin/announcements",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 11h3l8-5v12l-8-5H3z" />
        <path d="M17 9.5a3 3 0 0 1 0 5" />
      </svg>
    ),
  },
];

const accountItems = [
  {
    label: "Notification",
    path: "/admin/notifications",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      </svg>
    ),
  },
  {
    label: "Profile",
    path: "/view-profile",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

/* ── Nav Item ─────────────────────────────────────────────────────────────── */
function NavItem({ item, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(item)}
      className={`sidebar-nav-item${isActive ? " sidebar-nav-item--active" : ""}`}
    >
      <span className="sidebar-nav-icon">{item.icon}</span>
      <span className="sidebar-nav-label">{item.label}</span>
      {isActive && <span className="sidebar-nav-pip" />}
    </button>
  );
}

/* ── Logout Modal ─────────────────────────────────────────────────────────── */
function LogoutModal({ onCancel, onConfirm }) {
  return (
    <div className="sb-overlay">
      <div className="sb-modal">
        <h2>Sign out?</h2>
        <p>You will be signed out of your account.</p>

        <button onClick={onCancel}>Cancel</button>
        <button onClick={onConfirm}>Logout</button>
      </div>
    </div>
  );
}

/* ── MAIN SIDEBAR ──────────────────────────────────────────────────────────── */
export default function AdminSideBar({ user }) {
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (item) => {
    navigate(item.path);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth");
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  const activeLabel =
    [...navItems, ...accountItems].find((i) =>
      location.pathname.startsWith(i.path)
    )?.label || "";

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "JD";

  return (
    <>
      <aside className="sidebar">

        {/* Logo */}
        <div className="sidebar-logo">
          <img src={logo} alt="Logo" />
          <div>
            <div>M.C.P.B.A.H.S</div>
            <small>School Management</small>
          </div>
        </div>

        {/* Main Menu */}
        <nav>
          <h4>Main Menu</h4>
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              isActive={activeLabel === item.label}
              onClick={handleClick}
            />
          ))}
        </nav>

        {/* Account */}
        <div>
          <h4>Account</h4>
          {accountItems.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              isActive={activeLabel === item.label}
              onClick={handleClick}
            />
          ))}
        </div>

        {/* Footer */}
        <div>
          <div>{initials}</div>
          <div>{user?.name || "User"}</div>
          <button onClick={() => setShowLogout(true)}>Logout</button>
        </div>
      </aside>

      {/* Logout Modal */}
      {showLogout && (
        <LogoutModal
          onCancel={() => setShowLogout(false)}
          onConfirm={handleLogout}
        />
      )}
    </>
  );
}
