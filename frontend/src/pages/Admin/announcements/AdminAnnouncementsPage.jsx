import { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "../../../Components/Sidebar";
import {
  MOCK_ANNOUNCEMENTS,
  normalizeAnnouncements,
  normalizeAnnouncement,
  announcementService,
} from "./adminAnnouncementData.js";
import {
  ErrorBanner,
  AnnouncementFormPage,
  DeleteConfirmModal,
  PublishModal,
  AnnouncementCard,
  AnnouncementViewModal,
} from "./AdminAnnouncementSections.jsx";
import {
  MegaphoneIcon,
  PlusIcon,
} from "../notification/AdminNotificationIcons.jsx";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(false);
  const [annError, setAnnError] = useState(null);
  const [activePageMode, setActivePageMode] = useState("list");
  const [viewingAnn, setViewingAnn] = useState(null);
  const [announcementBeingEdited, setAnnouncementBeingEdited] = useState(null);
  const [deletingAnn, setDeletingAnn] = useState(null);
  const [publishingAnn, setPublishingAnn] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const isMountedRef = useRef(true);
  const annAbortRef = useRef(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      annAbortRef.current?.abort();
    };
  }, []);

  const loadAnnouncements = useCallback(async () => {
    annAbortRef.current?.abort();
    annAbortRef.current = new AbortController();
    setAnnLoading(true);  // BUG-03 FIX: was false — spinner never showed
    setAnnError(null);

    try {
      const data = await announcementService.getAll(annAbortRef.current.signal);
      if (!isMountedRef.current) return;
      const normalized = normalizeAnnouncements(data);
      setAnnouncements(normalized.length > 0 ? normalized : normalizeAnnouncements(MOCK_ANNOUNCEMENTS));
    } catch (err) {
      if (!isMountedRef.current) return;
      setAnnouncements((current) => current.length > 0 ? current : normalizeAnnouncements(MOCK_ANNOUNCEMENTS));
      setAnnError(err?.message ? `Unable to load announcements: ${err.message}` : "Unable to load announcements.");
    } finally {
      if (isMountedRef.current) setAnnLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleCreateAnn = useCallback(async (formData) => {
    setIsSaving(true);
    // FIX BUG-1: Use a unique sentinel on the optimistic record that survives
    // normalizeAnnouncement(). normalizeAnnouncement() sets id = raw.uuid ?? raw.id,
    // so storing the localId in id gets clobbered. We store it in _localId instead
    // and match on that field when swapping the placeholder for the real record.
    const localId = `ann-${Date.now()}`;
    const optimistic = { ...normalizeAnnouncement({ ...formData, id: localId }), _localId: localId };
    setAnnouncements((prev) => [optimistic, ...prev]);
    setActivePageMode("list");
    setIsSaving(false);

    try {
      const created = await announcementService.create(formData);
      if (!isMountedRef.current) return;
      if (created) {
        const normalized = normalizeAnnouncement(created);
        // Replace by _localId sentinel, not by ann.id (which normalizeAnnouncement may have changed)
        setAnnouncements((prev) =>
          prev.map((ann) => (ann._localId === localId ? normalized : ann))
        );
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setAnnError(err?.message ? `Saved locally (API error: ${err.message})` : "Saved locally. API unavailable.");
    }
  }, []);

  const handleUpdateAnn = useCallback(async (formData) => {
    if (!announcementBeingEdited) return;
    if (announcementBeingEdited.status === "Published") {
      setAnnError("Published announcements cannot be edited.");
      setAnnouncementBeingEdited(null);
      setActivePageMode("list");
      return;
    }
    setIsSaving(true);
    const previous = announcements;
    const updated = normalizeAnnouncement({ ...announcementBeingEdited, ...formData });
    setAnnouncements(previous.map((a) => (a.id === announcementBeingEdited.id ? updated : a)));
    setAnnouncementBeingEdited(null);
    setActivePageMode("list");
    setIsSaving(false);

    try {
      await announcementService.update(announcementBeingEdited.uuid, formData); // BUG-02 FIX: uuid not id
    } catch (err) {
      if (!isMountedRef.current) return;
      setAnnouncements(previous);
      setAnnouncementBeingEdited(updated);
      setActivePageMode("edit");
      setAnnError(err?.message ? `Update failed: ${err.message}` : "Update failed.");
    }
  }, [announcementBeingEdited, announcements]);

  const handleDeleteAnn = useCallback(async () => {
    if (!deletingAnn) return;
    setIsDeleting(true);
    const previous = announcements;
    setAnnouncements(previous.filter((a) => a.id !== deletingAnn.id));
    setDeletingAnn(null);

    try {
      await announcementService.remove(deletingAnn.uuid); // BUG-02 FIX: uuid not id
    } catch (err) {
      if (!isMountedRef.current) return;
      setAnnouncements(previous);
      setAnnError(err?.message ? `Delete failed: ${err.message}` : "Delete failed.");
    } finally {
      if (isMountedRef.current) setIsDeleting(false);
    }
  }, [deletingAnn, announcements]);

  const handlePublishAnn = useCallback(async () => {
    if (!publishingAnn) return;
    setIsPublishing(true);
    const previous = announcements;
    setAnnouncements(previous.map((a) => (a.id === publishingAnn.id ? { ...a, status: "Published" } : a)));
    setPublishingAnn(null);

    try {
      await announcementService.publish(publishingAnn.uuid); // BUG-02 FIX: uuid not id
    } catch (err) {
      if (!isMountedRef.current) return;
      setAnnouncements(previous);
      setAnnError(err?.message ? `Publish failed: ${err.message}` : "Publish failed.");
    } finally {
      if (isMountedRef.current) setIsPublishing(false);
    }
  }, [publishingAnn, announcements]);

  const openCreatePage = useCallback(() => {
    setAnnouncementBeingEdited(null);
    setActivePageMode("create");
  }, []);

  const openEditPage = useCallback((announcement) => {
    if (announcement?.status === "Published") {
      setAnnError("Published announcements cannot be edited.");
      setViewingAnn(null);
      return;
    }
    setViewingAnn(null);
    setAnnouncementBeingEdited(announcement);
    setActivePageMode("edit");
  }, []);

  const returnToList = useCallback(() => {
    if (isSaving) return;
    setAnnouncementBeingEdited(null);
    setActivePageMode("list");
  }, [isSaving]);

  const isFormPage = activePageMode === "create" || activePageMode === "edit";

  return (
    <div className="notif-root">
      <Sidebar role="admin" />

      <main className="notif-main">
        <div className="notif-header">
          <div className="notif-header-left">
            <div className="notif-title-row">
              <h1 className="notif-title">
                {activePageMode === "create" ? "Create Announcement" : activePageMode === "edit" ? "Edit Announcement" : "Announcements"}
              </h1>
              {!isFormPage && <span className="notif-badge">{announcements.length} total</span>}
            </div>
            <p className="notif-subtitle">
              {isFormPage ? "Fill in the details below to manage an announcement." : "Create and manage school-wide announcements."}
            </p>
          </div>

          {!isFormPage && (
            <button
              className="ntn-btn ntn-btn--primary"
              onClick={openCreatePage}
              disabled={annLoading || isSaving || isDeleting || isPublishing}
            >
              <PlusIcon /> New Announcement
            </button>
          )}
        </div>

        {annError && (
          <ErrorBanner
            message={annError}
            onRetry={loadAnnouncements}
            onDismiss={() => setAnnError(null)}
          />
        )}

        {isFormPage ? (
          <AnnouncementFormPage
            announcement={activePageMode === "edit" ? announcementBeingEdited : null}
            onCancel={returnToList}
            onSave={activePageMode === "edit" ? handleUpdateAnn : handleCreateAnn}
            isSaving={isSaving}
          />
        ) : (
          <div className="notif-card">
            {annLoading ? (
            <div className="notif-loading">
              <div className="loading-ring" />
              <p>Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="notif-empty">
              <div className="notif-empty-icon"><MegaphoneIcon /></div>
              <p className="notif-empty-title">No announcements yet</p>
              <p className="notif-empty-sub">Create your first announcement to reach your audience.</p>
              <button
                className="ntn-btn ntn-btn--primary"
                style={{ marginTop: "16px" }}
                onClick={openCreatePage}
              >
                <PlusIcon /> New Announcement
              </button>
            </div>
          ) : (
            <div className="ann-list">
              {announcements.map((ann) => (
                <AnnouncementCard
                  key={ann.id}
                  ann={ann}
                  onView={setViewingAnn}
                  onEdit={openEditPage}
                  onDelete={setDeletingAnn}
                  onPublish={setPublishingAnn}
                />
              ))}
            </div>
            )}
          </div>
        )}
      </main>

      {viewingAnn && (
        <AnnouncementViewModal
          announcement={viewingAnn}
          onClose={() => setViewingAnn(null)}
          onEdit={openEditPage}
        />
      )}

      {deletingAnn && (
        <DeleteConfirmModal
          announcement={deletingAnn}
          onClose={() => !isDeleting && setDeletingAnn(null)}
          onConfirm={handleDeleteAnn}
          isDeleting={isDeleting}
        />
      )}

      {publishingAnn && (
        <PublishModal
          announcement={publishingAnn}
          onClose={() => !isPublishing && setPublishingAnn(null)}
          onConfirm={handlePublishAnn}
          isPublishing={isPublishing}
        />
      )}
    </div>
  );
}