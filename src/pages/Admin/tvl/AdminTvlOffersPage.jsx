import { useEffect, useState } from "react";

import Sidebar from "../../../Components/Sidebar";
import {
  Breadcrumb,
  Toast,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmModal,
  FormInput,
  Checkbox,
} from "../../../Components/ui";

import {
  listTvlOffers,
  createTvlOffer,
  updateTvlOffer,
  deleteTvlOffer,
} from "../../../Api/tvlOfferApi";

const EMPTY_FORM = {
  title: "",
  description: "",
  icon: "",
  display_order: 0,
  is_active: true,
  certifications: [],
  image: null,
};

function normalizeOffer(offer) {
  return {
    uuid: offer.uuid,
    title: offer.title ?? "",
    description: offer.description ?? "",
    icon: offer.icon ?? "",
    image_url: offer.image_url ?? null,
    display_order: offer.display_order ?? 0,
    is_active: Boolean(offer.is_active),
    certifications: Array.isArray(offer.certifications) ? offer.certifications : [],
    image: null,
  };
}

export default function AdminTvlOffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [toast, setToast] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingUuid, setEditingUuid] = useState(null);
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    setApiError("");
    try {
      const res = await listTvlOffers();
      const rows = Array.isArray(res) ? res : res?.data ?? [];
      setOffers(rows.map(normalizeOffer).sort((a, b) => a.display_order - b.display_order));
    } catch (err) {
      setApiError(err?.message || "Failed to load TVL offers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingUuid(null);
    setForm(EMPTY_FORM);
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEdit = (offer) => {
    setEditingUuid(offer.uuid);
    setForm({
      title: offer.title,
      description: offer.description,
      icon: offer.icon,
      display_order: offer.display_order,
      is_active: offer.is_active,
      certifications: offer.certifications,
      image: null,
    });
    setImagePreview(offer.image_url);
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast("Please select an image file.");
      return;
    }
    setForm((f) => ({ ...f, image: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCertificationsChange = (e) => {
    const list = e.target.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setForm((f) => ({ ...f, certifications: list }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setToast("Title is required.");
      return;
    }
    setSaving(true);
    try {
      if (editingUuid) {
        await updateTvlOffer(editingUuid, form);
        setToast("TVL offer updated.");
      } else {
        await createTvlOffer(form);
        setToast("TVL offer created.");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setToast(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteTvlOffer(confirmDelete.uuid);
      setToast("TVL offer deleted.");
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setToast(err?.message || "Delete failed.");
    }
  };

  return (
    <div className="page-layout">
      <Sidebar role="admin" />

      <main id="main-content" className="page-main">
        <div className="page-body">
          <Breadcrumb parts={[{ label: "TVL Offers" }]} />

          {apiError && <div className="alert alert-error">{apiError}</div>}

          <div className="form-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 className="form-section-title" style={{ marginBottom: 4 }}>TVL Track Offers</h2>
                <p style={{ fontSize: 13, color: "#7a8a7c", margin: 0 }}>
                  Manage the Technical-Vocational-Livelihood tracks shown on the public homepage, including each track's photo.
                </p>
              </div>
              <button className="btn btn-primary" onClick={openCreate}>+ Add TVL Offer</button>
            </div>

            {loading && <p>Loading…</p>}

            {!loading && offers.length === 0 && (
              <p style={{ color: "#7a8a7c" }}>No TVL offers yet. Click "Add TVL Offer" to create one.</p>
            )}

            {!loading && offers.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {offers.map((offer) => (
                  <div
                    key={offer.uuid}
                    style={{
                      border: "1px solid #e1e8e2", borderRadius: 10, overflow: "hidden",
                      display: "flex", flexDirection: "column", background: "#fff",
                      opacity: offer.is_active ? 1 : 0.55,
                    }}
                  >
                    <div style={{ height: 140, background: "#eef3ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {offer.image_url ? (
                        <img src={offer.image_url} alt={offer.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 36 }}>{offer.icon || "🎓"}</span>
                      )}
                    </div>
                    <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 16 }}>{offer.icon} {offer.title}</h3>
                      <p style={{ margin: 0, fontSize: 13, color: "#5d6b5e", flex: 1 }}>
                        {offer.description?.slice(0, 110) || "No description."}
                        {offer.description?.length > 110 ? "…" : ""}
                      </p>
                      {!offer.is_active && (
                        <span style={{ fontSize: 11, color: "#c0392b" }}>Hidden from public site</span>
                      )}
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => openEdit(offer)}>Edit</button>
                        <button className="btn btn-outline" style={{ color: "#c0392b" }} onClick={() => setConfirmDelete(offer)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {modalOpen && (
        <Modal size="lg" onClose={() => setModalOpen(false)}>
          <ModalHeader>{editingUuid ? "Edit TVL Offer" : "Add TVL Offer"}</ModalHeader>
          <ModalBody>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div
                style={{
                  width: 120, height: 120, borderRadius: 8, overflow: "hidden",
                  background: "#eef3ef", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0, border: "1px solid #d6ded8",
                }}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 32 }}>{form.icon || "🎓"}</span>
                )}
              </div>
              <div>
                <label className="btn btn-outline" style={{ cursor: "pointer" }}>
                  Choose Image
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                </label>
                <p style={{ fontSize: 12, color: "#7a8a7c", marginTop: 6 }}>
                  Shown on the public homepage TVL section. JPG/PNG, up to 4MB.
                </p>
              </div>
            </div>

            <FormInput label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required maxLength={255} />

            <div style={{ marginTop: 12 }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="form-grid-3" style={{ marginTop: 12 }}>
              <FormInput label="Icon (emoji)" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} maxLength={10} />
              <FormInput
                label="Display Order"
                type="number"
                value={form.display_order}
                onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) || 0 }))}
              />
              <FormInput
                label="Certifications (comma-separated)"
                value={form.certifications.join(", ")}
                onChange={handleCertificationsChange}
                placeholder="NC II, NC III"
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <Checkbox
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                label="Visible on public homepage"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={saving} onClick={handleSubmit}>
              {saving ? "Saving…" : "Save"}
            </button>
          </ModalFooter>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete TVL Offer"
          body={`Are you sure you want to delete "${confirmDelete.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
