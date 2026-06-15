import { useEffect, useState } from "react";

import {
  Breadcrumb,
  InfoCard,
  InfoField,
} from "../../../Components/ui";

import { getFacultyPersonnel } from "../../../Api/facultyApi";

import {
  getAvatarBg,
  getInitials,
} from "./adminFacultyConstants.js";

import {
  ApiStatusBanner,
  ViewSkeleton,
} from "./AdminFacultySharedUi.jsx";

/**
 * Normalize backend → frontend shape
 */
const normalizeFaculty = (f) => ({
  ...f,
  id: f.uuid || f.id,
});

export function FacultyView({
  facultyId,
  facultyLocal,
  onBack,
  onEdit,
}) {
  const [faculty, setFaculty] = useState(
    facultyLocal ? normalizeFaculty(facultyLocal) : null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * FETCH DETAILS
   */
  useEffect(() => {
    if (!facultyId) return;

    const fetchFaculty = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getFacultyPersonnel(facultyId);

        // handle both {data: {...}} and direct object responses
        const data = res?.data ?? res;

        setFaculty(normalizeFaculty(data));
      } catch (err) {
        console.error("[FacultyView] Fetch failed:", err);
        setError(err.message || "Failed to load faculty details.");
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, [facultyId]);

  /**
   * LOADING STATE
   */
  if (loading) {
    return (
      <>
        <Breadcrumb
          parts={[
            { label: "Faculty and Staff", onClick: onBack },
            { label: "..." },
          ]}
        />

        <ViewSkeleton />
      </>
    );
  }

  /**
   * EMPTY STATE
   */
  if (!faculty) {
    return (
      <>
        <Breadcrumb
          parts={[
            { label: "Faculty and Staff", onClick: onBack },
          ]}
        />

        <div
          style={{
            padding: "20px",
            textAlign: "center",
            color: "#C62828",
          }}
        >
          <p>Error: Faculty data is missing.</p>

          <button
            type="button"
            className="btn btn-outline"
            onClick={onBack}
          >
            Back to List
          </button>
        </div>
      </>
    );
  }

  /**
   * DISPLAY VALUES (UI SAFE)
   */
  const fullName =
    faculty.full_name ||
    [
      faculty.first_name,
      faculty.middle_name,
      faculty.last_name,
    ]
      .filter(Boolean)
      .join(" ");

  const role = faculty.position || "—";

  const city =
    faculty?.address?.city || "Unknown City";

  const status =
    faculty.employment_status || "—";

  const displayId =
    faculty.personnel_id_number || "Unknown";

  /**
   * RENDER
   */
  return (
    <>
      <Breadcrumb
        parts={[
          {
            label: "Faculty and Staff",
            onClick: onBack,
          },
          {
            label: displayId,
          },
        ]}
      />

      {error && (
        <ApiStatusBanner status="error" error={error} />
      )}

      <div
        className="info-card"
        style={{
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
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
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "var(--green-800)",
              margin: "0 0 4px",
            }}
          >
            {fullName}
          </h2>

          <p
            style={{
              fontSize: "13px",
              color: "var(--gray-500)",
              margin: "0 0 2px",
            }}
          >
            {role}
          </p>

          <p
            style={{
              fontSize: "13px",
              color: "var(--gray-400)",
              margin: 0,
            }}
          >
            {city}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ marginLeft: "auto" }}
          onClick={() => onEdit(faculty)}
        >
          Edit
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <InfoCard title="Personal Information">
          <div className="form-grid-3" style={{ marginBottom: "16px" }}>
            <InfoField label="First Name" value={faculty.first_name || "—"} />
            <InfoField label="Middle Name" value={faculty.middle_name || "—"} />
            <InfoField label="Last Name" value={faculty.last_name || "—"} />
          </div>

          <div className="form-grid-3">
            <InfoField label="Email" value={faculty.email || "—"} />
            <InfoField label="Phone Number" value={faculty.phone_number || "—"} />
            <InfoField
              label="Date of Birth"
              value={
                faculty.date_of_birth
                  ? new Date(faculty.date_of_birth).toLocaleDateString()
                  : "—"
              }
            />
          </div>

          <div
            className="form-grid-3"
            style={{ marginTop: 12 }}
          >
            <InfoField label="Position" value={role} />
            <InfoField label="Status" value={status} />
            <InfoField
              label="Department"
              value={faculty.department || "—"}
            />
          </div>
        </InfoCard>

        <InfoCard title="Address">
          <div className="form-grid-3">
            <InfoField label="Country" value={faculty?.address?.country || "—"} />
            <InfoField label="Region" value={faculty?.address?.region || "—"} />
            <InfoField label="City" value={faculty?.address?.city || "—"} />
          </div>

          <div className="form-grid-3" style={{ marginTop: 12 }}>
            <InfoField label="Province" value={faculty?.address?.province || "—"} />
            <InfoField label="Postal Code" value={faculty?.address?.postal_code || "—"} />
            <InfoField label="Street" value={faculty?.address?.street || "—"} />
          </div>
        </InfoCard>

        <InfoCard title="Teaching Load">
          <InfoField
            label="Units"
            value={faculty.teaching_load ?? "—"}
          />
        </InfoCard>
      </div>
    </>
  );
}