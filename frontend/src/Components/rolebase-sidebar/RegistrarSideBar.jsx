import logo from "../../assets/school-logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import "../../Css/RegistrarSideBar.css";

/* ─────────────────────────────────────────────────────────
   NAV ITEMS — Dashboard now included at the top
───────────────────────────────────────────────────────── */
const navItems = [
  {
    label: "Dashboard",
    path: "/Registrar/Dashboard",
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

/* ─────────────────────────────────────────────────────────
   NAV ITEM COMPONENT
───────────────────────────────────────────────────────── */
function NavItem({ item, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(item)}
      className={`rs-nav-item${isActive ? " rs-nav-item--active" : ""}`}
      title={item.label}
    >
      {/* Active left-edge pip */}
      {isActive && <span className="rs-nav-pip" aria-hidden="true" />}

      <span className="rs-nav-icon">
        {item.icon}
      </span>

      <span className="rs-nav-label">
        {item.label}
      </span>
    </button>
  );
}

function LogoImage() {
  if (!logo) {
    return <div className="rs-logo-fallback">🏫</div>;
  }

  return (
    <div className="rs-logo-img-wrap">
      <img
        src={logo}
        alt="School Seal"
        className="rs-logo-img"
        onError={e => {
          e.currentTarget.style.display = "none";
          e.currentTarget.parentElement.innerHTML = "<span style='font-size:19px'>🏫</span>";
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN SIDEBAR COMPONENT

   Props:
     active     — string   label of the active nav item, e.g. "Dashboard"
     onNavigate — fn(item) called on nav click; receives { label, path }
     user       — { name, email }
───────────────────────────────────────────────────────── */
export default function RegistrarSideBar({ active, onNavigate, user }) {
  /* Router hooks — safely no-op if used outside a Router */
  const navigate = useNavigate();
  const location = useLocation();

  /* Resolve active label */
  const activeLabel = active ?? (() => {
    const match = [...navItems, ...accountItems].find(i =>
      location.pathname.startsWith(i.path)
    );
    return match?.label ?? "";
  })();

  const handleClick = (item) => {
    if (onNavigate) onNavigate(item);
    else navigate(item.path);
  };

  /* Avatar initials */
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "JD";

  return (
    <aside className="rs-sidebar">

      {/* ── Logo header ─────────────────────────────────── */}
      <div className="rs-logo">
        <LogoImage />
        <div className="rs-logo-text">
          <span className="rs-logo-name">M.C.P.B.A.H.S</span>
          <span className="rs-logo-sub">School Management</span>
        </div>
      </div>

      {/* ── Main navigation ─────────────────────────────── */}
      <nav className="rs-nav" aria-label="Main navigation">
        {navItems.map(item => (
          <NavItem
            key={item.label}
            item={item}
            isActive={activeLabel === item.label}
            onClick={handleClick}
          />
        ))}
      </nav>

      {/* ── Account section ─────────────────────────────── */}
      <div className="rs-account" aria-label="Account navigation">
        <span className="rs-section-label">Account</span>
        {accountItems.map(item => (
          <NavItem
            key={item.label}
            item={item}
            isActive={activeLabel === item.label}
            onClick={handleClick}
          />
        ))}
      </div>

      {/* ── User footer ─────────────────────────────────── */}
      <div className="rs-footer">
        <div className="rs-avatar" aria-hidden="true">
          {initials}
        </div>

        <div className="rs-footer-info">
          <div className="rs-footer-name">{user?.name ?? "Jane Doe"}</div>
          <div className="rs-footer-email">{user?.email ?? "janedoe@deped.gov.ph"}</div>
        </div>

        {/* Optional more/logout button */}
        <button
          className="rs-footer-btn"
          title="More options"
          aria-label="More options"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5"  r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none"/>
          </svg>
        </button>
      </div>

    </aside>
  );
}
