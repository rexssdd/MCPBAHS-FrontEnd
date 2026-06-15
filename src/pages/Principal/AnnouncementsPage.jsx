// src/pages/Principal/AnnouncementsPage.jsx

import { useState, useEffect } from "react";
import "../../Css/Principal/Announcement.css";

import Sidebar from "../../Components/Sidebar";

import {
  Toast,
  ConfirmModal,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Breadcrumb,
  Pagination,
  SearchInput,
  DataTable,
  FormInput,
  FormSelect,
  InfoCard,
  InfoField,
  Badge,
} from "../../Components/ui";

import AnnouncementList from "../../Components/Announcement/announcementList";
import AnnouncementModal from "../../Components/Announcement/announcementModal";
import AnnouncementView from "../../Components/Announcement/announcementView";

import { useAnnouncements } from "../../hooks/useAnnouncements";

// ─── Constants ─────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 8;

const showToastMessage = (setToast, message, type = "success") => {
  setToast({ message, type });
};

// ─── Page Root ─────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const [view,         setView]         = useState("list");
  const [target,       setTarget]       = useState(null);
  const [toast,        setToast]        = useState(null);
  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkIds,      setBulkIds]      = useState([]);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [modalMode,    setModalMode]    = useState("create");
  const [modalTarget,  setModalTarget]  = useState(null);

  const {
    announcements,
    apiStatus,
    isSaving,
    fetchAll,
    create,
    update,
    remove,
    bulkRemove,
  } = useAnnouncements();

  useEffect(() => {
    fetchAll().then(({ ok }) => {
      if (!ok) showToastMessage(setToast, "Could not reach server — showing default data.", "warning");
    });
  }, [fetchAll]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goList = () => { setView("list"); setTarget(null); };
  const showToast = (message, type = "success") => showToastMessage(setToast, message, type);

  const openCreateModal = () => {
    setModalMode("create");
    setModalTarget(null);
    setModalOpen(true);
  };

  const openEditModal = (ann) => {
    setModalMode("edit");
    setModalTarget(ann);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalTarget(null);
  };

  // ── Breadcrumb ──────────────────────────────────────────────────────────────

  const breadcrumbItems = (() => {
    const base = { label: "Announcements", onClick: goList };
    if (view === "view" && target) return [base, { label: String(target.id) }];
    return [base];
  })();

  // ── CRUD handlers ───────────────────────────────────────────────────────────

  const handleSave = async (form) => {
    if (modalMode === "create") {
      const { ok } = await create(form);
      showToast(
        ok ? "Announcement successfully added"
           : "Announcement added (offline — will sync on next refresh)",
        ok ? "success" : "warning"
      );
    } else {
      // NEW-04 FIX: pass uuid (not id) — updateAnnouncement hits /announcements/:uuid.
      const { ok } = await update(modalTarget?.uuid, form);
      showToast(
        ok ? "Announcement successfully updated"
           : "Announcement updated (offline — will sync on next refresh)",
        ok ? "success" : "warning"
      );
    }
    setModalOpen(false);
    setModalTarget(null);
    goList();
  };

  const handleDeleteRequest = (id) => {
    setDeleteTarget(id);
    setBulkIds([]);
    setConfirmOpen(true);
  };

  const handleBulkDeleteRequest = (ids) => {
    setDeleteTarget("bulk");
    setBulkIds(ids);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setConfirmOpen(false);
    if (deleteTarget === "bulk") {
      await bulkRemove(bulkIds);
      showToast(`${bulkIds.length} announcement(s) deleted`);
      setBulkIds([]);
    } else {
      await remove(deleteTarget);
      showToast("Announcement successfully deleted");
    }
    setDeleteTarget(null);
  };

  const handleDeleteCancel = () => {
    setConfirmOpen(false);
    setDeleteTarget(null);
    setBulkIds([]);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="page-layout">
      <Sidebar role="principal" />

      <main id="main-content" className="page-main">

        {/* ── Page header — only shown in list view ── */}
        <div className="page-header">
          <Breadcrumb parts={breadcrumbItems} />

          {/* Title row: shown in list view only.
              In "view" mode the breadcrumb itself provides context. */}
          {view === "list" && (
            <div style={{ marginBottom: 4 }}>
              <h1 className="page-title">Announcements</h1>
              <p className="page-subtitle">Manage announcements and school reminders.</p>
            </div>
          )}

          {/* Detail view heading */}
          {view === "view" && target && (
            <h1 className="page-title" style={{ marginBottom: 4 }}>Announcement</h1>
          )}
        </div>

        {/* ── Content ── */}
        <div className="page-body">
          {view === "view" && target ? (
            <AnnouncementView ann={target} onBack={goList} />
          ) : (
            <AnnouncementList
              announcements={announcements}
              apiStatus={apiStatus}
              itemsPerPage={ITEMS_PER_PAGE}
              onRetry={fetchAll}
              onView={(ann) => { setTarget(ann); setView("view"); }}
              onEdit={openEditModal}
              onAdd={openCreateModal}
              onDelete={handleDeleteRequest}
              onBulkDelete={handleBulkDeleteRequest}
            />
          )}
        </div>

        {/* ── Create / Edit modal ── */}
        {modalOpen && (
          <AnnouncementModal
            mode={modalMode}
            initial={modalMode === "edit" ? modalTarget : null}
            isOpen={modalOpen}
            onClose={closeModal}
            onSave={handleSave}
            isSaving={isSaving}
          />
        )}
      </main>

      {/* ── Delete confirm ── */}
      {confirmOpen && (
        <ConfirmModal
          title="Are you sure?"
          message={
            deleteTarget === "bulk"
              ? `Deleting ${bulkIds.length} announcement(s) will permanently remove them.`
              : "Deleting this will permanently remove it and cannot be undone."
          }
          confirmLabel="Yes, Delete"
          cancelLabel="No, Cancel"
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
