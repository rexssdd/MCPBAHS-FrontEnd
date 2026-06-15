import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../../../Components/Sidebar";
import { Toast } from "../../../Components/ui";
import * as facultyService from "../../../services/Admin/FacultyAndStaff/facultyAndStaffService";
import { validateFacultyList, sanitizeFaculty } from "../../../utils/facultyValidation";
import { USE_API, MOCK_FACULTY } from "./adminFacultyConstants.js";
import { FacultyList } from "./AdminFacultyList.jsx";
import { FacultyView } from "./AdminFacultyView.jsx";
import { FacultyForm } from "./AdminFacultyForm.jsx";

export function FacultyandStaffPage() {
  const [faculty, setFaculty] = useState(MOCK_FACULTY);
  const [view, setView] = useState("list");
  const [target, setTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const [loading, setLoading] = useState(false);
  const [apiState, setApiState] = useState(null);
  const [apiError, setApiError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  

  const fetchFaculty = useCallback(async () => {
    if (!USE_API) {
      setApiState("success");
      return;
    }

    setLoading(true);
    setApiState("fetching");
    setApiError(null);

    try {
      const { data, ok, error } = await facultyService.listFaculty();
      if (!isMountedRef.current) return;

      if (ok && Array.isArray(data)) {
        setFaculty(validateFacultyList(data, MOCK_FACULTY));
        setApiState("success");
      } else {
        throw new Error(error || "Unable to fetch faculty list.");
      }
    } catch (err) {
      console.error("[Faculty] Fetch failed:", err);
      if (!isMountedRef.current) return;
      setApiState("error");
      setApiError(err.message || "Unknown error");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  const goList = () => {
    setView("list");
    setTarget(null);
  };

  const handleSave = (form, apiResult) => {
    const sanitized = sanitizeFaculty(form);
    if (view === "create") {
      const newRecord = {
        ...sanitized,
        id: apiResult?.id ?? sanitized.id ?? Date.now().toString(),
        teachingLoad: apiResult?.teachingLoad ?? sanitized.teachingLoad ?? [],
        advisory: apiResult?.advisory ?? sanitized.advisory ?? null,
      };
      setFaculty((f) => [newRecord, ...f]);
      setToast(apiResult ? "Faculty record added (API)" : "Faculty record added locally");
    } else {
      setFaculty((f) => f.map((x) => (x.id === target?.id ? { ...x, ...(apiResult ?? sanitized) } : x)));
      setToast(apiResult ? "Faculty record updated (API)" : "Faculty record updated locally");
    }
    goList();
  };

  const handleDelete = async (id) => {
    const previousFaculty = faculty;
    setFaculty((f) => f.filter((x) => x.id !== id));
    setToast("Record deleted");

    if (!USE_API) return;

    try {
      const { ok, error } = await facultyService.deleteFaculty(id);
      if (!isMountedRef.current) return;
      if (!ok) {
        setFaculty(previousFaculty);
        setToast(`Delete failed: ${error || "API error"}`);
      }
    } catch (err) {
      console.error("[Faculty] Delete failed:", err);
      if (!isMountedRef.current) return;
      setFaculty(previousFaculty);
      setToast("Delete failed. Please try again.");
    }
  };

  const handleArchive = async (id) => {
    const previousFaculty = faculty;
    setFaculty((f) => f.map((x) => (x.id === id ? { ...x, status: "Inactive" } : x)));
    setToast("Record archived");

    if (!USE_API) return;

    try {
      const { ok, error } = await facultyService.archiveFaculty(id);
      if (!isMountedRef.current) return;
      if (!ok) {
        setFaculty(previousFaculty);
        setToast(`Archive failed: ${error || "API error"}`);
      }
    } catch (err) {
      console.error("[Faculty] Archive failed:", err);
      if (!isMountedRef.current) return;
      setFaculty(previousFaculty);
      setToast("Archive failed. Please try again.");
    }
  };

  return (
    <div className="page-layout">
      <Sidebar role="admin" />
      <main id="main-content" className="page-main">
        <div className="page-body">
          {view === "list" && (
            <FacultyList
              faculty={faculty}
//              loading={loading}
              apiState={apiState}
              apiError={apiError}
              onRetry={fetchFaculty}
              onView={(f) => {
                setTarget(f);
                setView("view");
              }}
              onEdit={(f) => {
                setTarget(f);
                setView("edit");
              }}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onAdd={() => setView("create")}
            />
          )}
          {view === "view" && target && (
            <FacultyView
              facultyId={target.id}
              facultyLocal={target}
              onBack={goList}
              onEdit={(f) => {
                setTarget(f);
                setView("edit");
              }}
            />
          )}
          {view === "edit" && target && <FacultyForm initial={target} mode="edit" onSave={handleSave} onCancel={goList} />}
          {view === "create" && <FacultyForm initial={null} mode="create" onSave={handleSave} onCancel={goList} />}
        </div>
      </main>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
