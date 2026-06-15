import { useState, useEffect, useRef } from "react";
import { Breadcrumb, InfoCard, InfoField } from "../../../Components/ui";
import * as facultyService from "../../../services/Admin/FacultyAndStaff/facultyAndStaffService";
import { validateFaculty, getFacultyFullName, getFacultyRole, getFacultyCity } from "../../../utils/facultyValidation";
import { USE_API, getAvatarBg, getInitials } from "./adminFacultyConstants.js";
import { ApiStatusBanner, ViewSkeleton } from "./AdminFacultySharedUi.jsx";

export function FacultyView({ facultyId, facultyLocal, onBack, onEdit }) {
  const [faculty, setFaculty] = useState(facultyLocal ?? null);
  const [loading, setLoading] = useState(false);
  const [apiState, setApiState] = useState(null);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!USE_API) return;

    const fetchFacultyData = async () => {
      try {
        setLoading(true);
        setApiState("fetching");
        setError(null);

        const { data, ok } = await facultyService.getFaculty(facultyId);

        if (!isMountedRef.current) return;

        if (ok && data && validateFaculty(data)) {
          setFaculty(data);
          setApiState("success");
        } else {
          throw new Error("Invalid faculty data from API");
        }
      } catch (err) {
        console.error("[Faculty] Fetch failed:", err);

        if (!isMountedRef.current) return;

        setError(err.message || "Failed to load faculty details");
        setFaculty(facultyLocal);
        setApiState("error");
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchFacultyData();
  }, [facultyId]);

  if (loading) {
    return (
      <>
        <Breadcrumb parts={[{ label: "Faculty and Staff", onClick: onBack }, { label: "…" }]} />
        <ApiStatusBanner status="fetching" />
        <ViewSkeleton />
      </>
    );
  }

  if (!faculty) {
    return (
      <>
        <Breadcrumb parts={[{ label: "Faculty and Staff", onClick: onBack }]} />
        <div style={{ padding: "20px", textAlign: "center", color: "#C62828" }}>
          <p>Error: Faculty data is invalid or missing.</p>
          <button type="button" className="btn btn-outline" onClick={onBack}>
            Back to List
          </button>
        </div>
      </>
    );
  }

  const fullName = getFacultyFullName(faculty, "Unknown Faculty");
  const role = getFacultyRole(faculty);
  const city = getFacultyCity(faculty);

  return (
    <>
      <Breadcrumb parts={[{ label: "Faculty and Staff", onClick: onBack }, { label: faculty.id || "Unknown" }]} />
      {error && <ApiStatusBanner status="error" error={error} />}
      <ApiStatusBanner status={apiState} />

      <div className="info-card" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "20px" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: getAvatarBg(fullName),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {getInitials(fullName)}
        </div>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--green-800)", margin: "0 0 4px" }}>{fullName}</h2>
          <p style={{ fontSize: "13px", color: "var(--gray-500)", margin: "0 0 2px" }}>{role}</p>
          <p style={{ fontSize: "13px", color: "var(--gray-400)", margin: 0 }}>{city}</p>
        </div>
        <button type="button" className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={() => onEdit(faculty)}>
          Edit
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <InfoCard title="Personal Information">
          <div className="form-grid-3" style={{ marginBottom: "16px" }}>
            <InfoField label="First Name" value={faculty.firstName || "—"} />
            <InfoField label="Middle Name" value={faculty.middleName || "—"} />
            <InfoField label="Last Name" value={faculty.lastName || "—"} />
          </div>
          <div className="form-grid-3">
            <InfoField label="Email" value={faculty.email || "—"} />
            <InfoField label="Phone Number" value={faculty.contact || "—"} />
            <InfoField label="Date of Birth" value={faculty.dob || "—"} />
          </div>
          <div className="form-grid-3" style={{ marginTop: 12 }}>
            <InfoField label="Role" value={role} />
            <InfoField label="Status" value={faculty.status || "—"} />
            <InfoField label="Department" value={faculty.department || "—"} />
          </div>
        </InfoCard>

        <InfoCard title="Address">
          <div className="form-grid-3">
            <InfoField label="Country" value={faculty.country || "—"} />
            <InfoField label="City" value={faculty.city || "—"} />
            <InfoField label="Postal Code" value={faculty.postalCode || "—"} />
          </div>
        </InfoCard>

        <InfoCard title="Teaching Load">
          {!faculty.teachingLoad || faculty.teachingLoad.length === 0 ? (
            <p style={{ color: "var(--gray-400)", fontSize: "13px" }}>No teaching load assigned.</p>
          ) : (
            faculty.teachingLoad.map((t, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "12px",
                  padding: "12px",
                  background: "var(--gray-50)",
                  borderRadius: "8px",
                  border: "1px solid var(--gray-200)",
                }}
              >
                <p style={{ fontWeight: 700, color: "var(--gray-900)", margin: "0 0 4px", fontSize: "13px" }}>{t.subject || "—"}</p>
                <p style={{ fontSize: "12px", color: "var(--gray-500)", margin: "0 0 2px" }}>{t.section || "—"}</p>
                <p style={{ fontSize: "12px", color: "var(--gray-400)", margin: 0 }}>{t.timeslot || "—"}</p>
              </div>
            ))
          )}
        </InfoCard>

        <InfoCard title="Advisory Class">
          {faculty.advisory ? (
            <div style={{ padding: "16px", background: "var(--green-50)", borderRadius: "8px", border: "1px solid var(--green-200)" }}>
              <InfoField label="Section" value={faculty.advisory.section || "—"} />
              <InfoField label="No. of Students" value={String(faculty.advisory.students ?? "—")} />
            </div>
          ) : (
            <p style={{ color: "var(--gray-400)", fontSize: "13px" }}>No advisory class assigned.</p>
          )}
        </InfoCard>
      </div>
    </>
  );
}
