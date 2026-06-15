import { useEffect, useRef, useState } from "react";

import Sidebar from "../../../Components/Sidebar";
import { Toast } from "../../../Components/ui";

import { FacultyList } from "./AdminFacultyList.jsx";
import { FacultyView } from "./AdminFacultyView.jsx";
import { FacultyForm } from "./AdminFacultyForm.jsx";

import {
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getArchivedFaculty,
  restoreArchivedFaculty,
} from "../../../Api/facultyApi";

export function FacultyandStaffPage() {
  const [faculty, setFaculty] = useState([]);

  const [view, setView] = useState("list");
  const [target, setTarget] = useState(null);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [toast, setToast] = useState(null);

  const [meta, setMeta] = useState(null);

  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [tab, setTab] = useState("active");

  const controllerRef = useRef(null);
  const searchTimeout = useRef(null);

  const normalizeFaculty = (f) => ({
    ...f,
    uuid: f.uuid || f.id,
  });

  const fetchFaculty = async (
    nextPage = 1,
    nextSearch = "",
    nextDept = "",
    nextTab = "active"
  ) => {
    try {
      setLoading(true);
      setApiError("");

      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      controllerRef.current = new AbortController();

      const params = new URLSearchParams();

      params.append("page", nextPage);

      if (nextSearch) {
        params.append("search", nextSearch);
      }

      if (nextDept) {
        params.append("department", nextDept);
      }

      const res =
        nextTab === "archived"
          ? await getArchivedFaculty(`?${params.toString()}`, {
              signal: controllerRef.current.signal,
            })
          : await getFaculty(`?${params.toString()}`, {
              signal: controllerRef.current.signal,
            });

      setFaculty(
        (res?.data || []).map((item) => normalizeFaculty(item))
      );

      setMeta(res?.meta || null);

      setSearch(nextSearch);
      setDept(nextDept);
      setTab(nextTab);

    } catch (err) {
      if (err.name === "AbortError") return;

      console.error(err);

      setApiError(err.message || "Failed to load faculty.");

      setFaculty([]);
      setMeta(null);

    } finally {
      if (
        controllerRef.current &&
        !controllerRef.current.signal.aborted
      ) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchFaculty(1, "", "", "active");

    return () => {
      clearTimeout(searchTimeout.current);

      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const handleSearch = (value) => {
    setSearch(value);

    clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      fetchFaculty(1, value, dept, tab);
    }, 400);
  };

  const handleDept = (value) => {
    setDept(value);

    fetchFaculty(1, search, value, tab);
  };

  const handleTabChange = (value) => {
    setTab(value);

    fetchFaculty(1, search, dept, value);
  };

  const handlePageChange = (p) => {
    fetchFaculty(p, search, dept, tab);
  };

  const goList = () => {
    setView("list");
    setTarget(null);
  };

  const goView = (f) => {
    setTarget(normalizeFaculty(f));
    setView("view");
  };

  const goEdit = (f) => {
    setTarget(normalizeFaculty(f));
    setView("edit");
  };

  const handleSave = async (payload) => {
    try {
      let record;

      if (view === "create") {
        record = await createFaculty(payload);

        const normalized = normalizeFaculty(record);

        setFaculty((prev) => [normalized, ...prev]);

        setToast("Faculty created successfully.");

      } else {
        record = await updateFaculty(target.uuid, payload);

        const normalized = normalizeFaculty(record);

        setFaculty((prev) =>
          prev.map((item) =>
            item.uuid === target.uuid
              ? normalized
              : item
          )
        );

        setToast("Faculty updated successfully.");
      }

      goList();

    } catch (err) {
      console.error(err);

      setToast(err.message || "Failed to save faculty.");
    }
  };

  const handleDelete = async (uuid) => {
    try {
      await deleteFaculty(uuid);

      setFaculty((prev) =>
        prev.filter((item) => item.uuid !== uuid)
      );

      setToast("Faculty deleted.");

    } catch (err) {
      console.error(err);

      setToast("Delete failed.");
    }
  };

  const handleRestore = async (uuid) => {
    try {
      await restoreArchivedFaculty(uuid);

      setFaculty((prev) =>
        prev.filter((item) => item.uuid !== uuid)
      );

      setToast("Faculty restored.");

    } catch (err) {
      console.error(err);

      setToast("Restore failed.");
    }
  };

  return (
    <div className="page-layout">
      <Sidebar role="admin" />

      <main id="main-content" className="page-main">
        <div className="page-body">

          {apiError && (
            <div className="alert alert-error">
              {apiError}
            </div>
          )}

          {view === "list" && (
            <FacultyList
              faculty={faculty}
              loading={loading}
              meta={meta}
              search={search}
              dept={dept}
              activeTab={tab}
              onTabChange={handleTabChange}
              onSearch={handleSearch}
              onDeptChange={handleDept}
              onPageChange={handlePageChange}
              onView={goView}
              onEdit={goEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onAdd={() => setView("create")}
            />
          )}

          {view === "view" && target && (
            <FacultyView
              facultyId={target.uuid}
              facultyLocal={target}
              onBack={goList}
              onEdit={goEdit}
            />
          )}

          {view === "edit" && target && (
            <FacultyForm
              initial={target}
              mode="edit"
              onSave={handleSave}
              onBackToList={goList}
              onBackToView={() => setView("view")}
            />
          )}

          {view === "create" && (
            <FacultyForm
              initial={null}
              mode="create"
              onSave={handleSave}
              onBackToList={goList}
            />
          )}

        </div>
      </main>

      {toast && (
        <Toast
          message={toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
