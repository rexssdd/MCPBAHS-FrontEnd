import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../../../Components/Sidebar";
import { Toast } from "../../../Components/ui";
import * as enrollmentService from "../../../services/Admin/Enrollment/enrollmentService";
import { validateEnrollees, validateEnrollee } from "../../../utils/enrollmentValidation";
import {
  GRADE_LEVELS, PAGE_SIZE, generateDefaultEnrollees, EMPTY_FORM,
} from "./adminEnrollmentConstants.js";
import {
  ApiStatusBanner, SkeletonRows, SkeletonView, EnrolleeView, EnrolleeForm, EnrolleeList,
} from "./AdminEnrollmentSections.jsx";

export function EnrollmentAdminContent() {
  /* ── state ─────────────────────────────────────────── */
  const [enrollees, setEnrollees] = useState([]);
  const [view,      setView]      = useState("list");
  const [target,    setTarget]    = useState(null);
  const [toast,     setToast]     = useState(null);
  const [isSaving,  setIsSaving]  = useState(false);
  const [error,     setError]     = useState(null);
  const [mutationError, setMutationError] = useState(null);

  // "loading" | "success" | "error" | "fallback"
  const [apiStatus, setApiStatus] = useState("loading");
  const isMountedRef = useRef(true);

  /* ── cleanup on unmount ────────────────────────────── */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /* ── fetch enrollees with error handling ────────────── */
  const fetchEnrollees = useCallback(async () => {
    try {
      setApiStatus("loading");
      setError(null);
      
      const { data, ok } = await enrollmentService.listEnrollees();
      
      if (!isMountedRef.current) return;
      
      if (ok && data) {
        const validatedData = validateEnrollees(data, []);
        setEnrollees(validatedData);
        setApiStatus("success");
      } else {
        throw new Error("API returned invalid response");
      }
    } catch (err) {
      console.error("[Enrollment] Fetch failed:", err);
      
      if (!isMountedRef.current) return;
      
      setError(err.message || "Failed to load enrollees");
      setEnrollees(generateDefaultEnrollees());
      setApiStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchEnrollees();
    // Empty deps: fetchEnrollees is stable and runs once on mount
  }, []);

  /* ── helpers ─────────────────────────────────────────── */
  const goList    = () => { setView("list"); setTarget(null); setMutationError(null); };
  const showToast = msg => setToast(msg);

  /* ── create with error handling ──────────────────────── */
 const handleCreate = async (form) => {
  let succeeded = false;

  try {
    setIsSaving(true);
    setMutationError(null);

    const result = await enrollmentService.createEnrollee(form);

    if (import.meta.env.DEV) console.log("CREATE RESULT:", result);

    if (!isMountedRef.current) return;

    if (!result.ok) {
      throw new Error(result.error || "Failed to create enrollee");
    }

    const data = result.data?.data || result.data;

    if (!data || !validateEnrollee(data)) {
      throw new Error("Invalid response from server");
    }

    setEnrollees(e => [data, ...e]);

    showToast("Enrollee successfully added");

    succeeded = true;

  } catch (err) {
    console.error("[Enrollment] Create failed:", err);

    if (!isMountedRef.current) return;

    const errorMsg =
      err?.message ||
      "Failed to add enrollee";

    setMutationError(errorMsg);

    showToast(errorMsg);

  } finally {
    if (isMountedRef.current) {
      setIsSaving(false);
    }
  }

  if (succeeded) {
    goList();
  }
};
  /* ── update with error handling ──────────────────────── */
 const handleUpdate = async (form) => {
  let succeeded = false;

  try {
    setIsSaving(true);
    setMutationError(null);

    if (!target?.id) {
      throw new Error("Target enrollee not found");
    }

    const result = await enrollmentService.updateEnrollee(
      target.id,
      form
    );

    if (import.meta.env.DEV) console.log("UPDATE RESULT:", result);

    if (!isMountedRef.current) return;

    if (!result.ok) {
      throw new Error(result.error || "Failed to update enrollee");
    }

    const data = result.data?.data || result.data;

    if (!data || !validateEnrollee(data)) {
      throw new Error("Invalid response from server");
    }

    setEnrollees(e =>
      e.map(x => x.id === data.id ? data : x)
    );

    showToast("Enrollee successfully updated");

    succeeded = true;

  } catch (err) {
    console.error("[Enrollment] Update failed:", err);

    if (!isMountedRef.current) return;

    const errorMsg =
      err?.message ||
      "Failed to update enrollee";

    setMutationError(errorMsg);

    showToast(errorMsg);

  } finally {
    if (isMountedRef.current) {
      setIsSaving(false);
    }
  }

  if (succeeded) {
    goList();
  }
};

  /* ── archive (single or bulk) with error handling ────── */
  const handleArchive = async (ids) => {
    try {
      const arr = Array.isArray(ids) ? ids : [ids];
      setMutationError(null);
      
      // Optimistic update
      setEnrollees(e => e.map(x => arr.includes(x.id) ? { ...x, status: "Archived" } : x));
      
      const { ok } = arr.length === 1
        ? await enrollmentService.archiveEnrollee(arr[0])
        : await enrollmentService.bulkArchiveEnrollees(arr);

      if (!isMountedRef.current) return;
      
      if (ok) {
        showToast(arr.length > 1 ? `${arr.length} enrollees archived` : "Enrollee successfully archived");
      } else {
        throw new Error("Failed to archive enrollees");
      }
    } catch (err) {
      console.error("[Enrollment] Archive failed:", err);
      
      if (!isMountedRef.current) return;
      
      const errorMsg = err.message || "Failed to archive enrollees";
      setMutationError(errorMsg);
      showToast(errorMsg);
      fetchEnrollees();
    }
  };

  const handleSave = (form) => {
    if (view === "create") handleCreate(form);
    else                   handleUpdate(form);
  };

  const isLoading = apiStatus === "loading";

  /* ── render ──────────────────────────────────────────── */
  return (
    <div className="page-layout">
      <Sidebar role="admin"/>
      <main id="main-content" className="page-main">
        <div className="page-body">
          
          {error && !isLoading && (
            <div style={{ padding: "16px", background: "#FFEBEE", borderRadius: "8px", marginBottom: "20px", border: "1px solid #EF9A9A" }}>
              <p style={{ color: "#C62828", fontWeight: 600, margin: "0 0 10px 0" }}>⚠️ Error: {error}</p>
              <button className="btn btn-outline" onClick={fetchEnrollees} style={{ fontSize: "13px" }}>
                ⟳ Retry Loading Enrollees
              </button>
            </div>
          )}

          {mutationError && (
            <div style={{ padding: "16px", background: "#FFEBEE", borderRadius: "8px", marginBottom: "20px", border: "1px solid #EF9A9A" }}>
              <p style={{ color: "#C62828", fontWeight: 600, margin: "0 0 10px 0" }}>⚠️ {mutationError}</p>
              <button className="btn btn-outline" onClick={() => setMutationError(null)} style={{ fontSize: "13px" }}>
                Dismiss
              </button>
            </div>
          )}

          {view === "list" && (
            <EnrolleeList
              enrollees={enrollees}
              isLoading={isLoading}
              apiStatus={apiStatus}
              onRetry={fetchEnrollees}
              onView={e=>{ setTarget(e); setView("view"); }}
              onEdit={e=>{ setTarget(e); setView("edit"); }}
              onArchive={handleArchive}
              onAdd={()=>setView("create")}
            />
          )}

          {view === "view" && (
            isLoading
              ? <SkeletonView/>
              : <EnrolleeView enrollee={target} onBack={goList} onEdit={e=>{ setTarget(e); setView("edit"); }}/>
          )}

          {view === "edit" && (
            <EnrolleeForm
              initial={target} mode="edit"
              onSave={handleSave} onCancel={goList}
              isSaving={isSaving}
            />
          )}

          {view === "create" && (
            <EnrolleeForm
              initial={null} mode="create"
              onSave={handleSave} onCancel={goList}
              isSaving={isSaving}
            />
          )}

        </div>
      </main>
      {toast && <Toast message={toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}


