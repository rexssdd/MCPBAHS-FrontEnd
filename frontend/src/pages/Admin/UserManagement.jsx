import { useEffect, useRef, useState, useCallback } from "react";
import Sidebar from "../../Components/Sidebar";
import { Toast } from "../../Components/ui";
import useUserManagement from "../../hooks/useUserManagement";
import { ROLES, PAGE_SIZE, EMPTY_FORM } from "../../utils/userDefaults";
import "../../Css/Admin/UserManagement.css";
import {
  ApiStatusBanner,
  SkeletonUserTable,
  SearchInput,
  FormInput,
  FormSelect,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Breadcrumb,
  DataTable,
  Pagination,
  Badge,
  ConfirmModal,
  TrashIcon,
  EditIcon,
  ArchiveIcon,
  KeyIcon,
  ActivityIcon,
} from "./userManagement/UserManagementUIKit.jsx";
import { ResetPasswordModal, ActivityLogsModal } from "./userManagement/UserManagementAccount.jsx";
import { validateForm } from "./userManagement/userManagementValidation.js";

function UserForm({ initial, mode, onSave, onCancel }) {
  const [form,    setForm]    = useState(initial ?? { ...EMPTY_FORM });
  const [errors,  setErrors]  = useState({});
  const [preview, setPreview] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const isEdit = mode === "edit";

  const handleSubmit = () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({}); setPreview(true);
  };

  const handleConfirm = async () => {
    setSaving(true); setSaveErr("");
    const result = await onSave({
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role.trim(),
    });
    setSaving(false);
    if (result && !result.ok) {
      setSaveErr(result.error ?? "An unexpected error occurred.");
    } else {
      setPreview(false);
    }
  };

  return (<>
    <Breadcrumb parts={isEdit
      ? [{ label:"User Management", onClick:onCancel }, { label:initial.staffId }, { label:"Edit" }]
      : [{ label:"User Management", onClick:onCancel }, { label:"Add" }]}
    />
    <div className="form-card">
      <div>
        <h2 className="form-section-title">{isEdit ? "Edit User" : "Add User"}</h2>
        <div className="form-divider"/>
      </div>
      <div className="form-grid-3">
        <FormInput
          label="Full Name"
          value={form.name}
          onChange={set("name")}
          placeholder="Juan Dela Cruz"
          error={errors.name}
          required
          maxLength={80}
          autoComplete="name"
        />
        <FormInput
          label="Email"
          value={form.email}
          onChange={set("email")}
          placeholder="name@deped.gov.ph"
          error={errors.email}
          type="email"
          required
          maxLength={120}
          autoComplete="email"
        />
        <FormSelect
          label="Role"
          value={form.role}
          onChange={set("role")}
          options={ROLES}
          error={errors.role}
          placeholder="Select user role"
          required
        />
      </div>
      <div className="form-divider"/>
      <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit}>{isEdit ? "Save Changes" : "Add User"}</button>
      </div>
    </div>

    {preview && (
      <Modal size="md">
        <ModalHeader>Preview</ModalHeader>
        <ModalBody>
          <div className="form-grid-3">
            {[["Full Name",form.name],["Email",form.email],["Role",form.role]].map(([l,v])=>(
              <div key={l}>
                <p className="info-field-label">{l}</p>
                <div className="form-input" style={{ cursor:"default" }}>{v||"—"}</div>
              </div>
            ))}
          </div>
          {saveErr && <p style={{ color:"var(--red-600)", marginTop:12, fontSize:13 }}>{saveErr}</p>}
        </ModalBody>
        <ModalFooter>
          <button className="btn btn-outline" onClick={()=>{ setPreview(false); setSaveErr(""); }} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" disabled={saving} onClick={handleConfirm}>
            {saving ? <><div className="spinner"/>Saving…</> : "Confirm"}
          </button>
        </ModalFooter>
      </Modal>
    )}
  </>);
}

/* ════════════════════════════════════════════════════════════
   USER LIST
   ════════════════════════════════════════════════════════════ */
function UserList({ users, loading, onEdit, onDelete, onAdd, onResetPassword, onViewActivity }) {
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [selected,    setSelected]    = useState([]);
  const [delTarget,   setDelTarget]   = useState(null);
  const [delLoading,  setDelLoading]  = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  // UMSS_004: which user's activity logs are open
  const [activityTarget, setActivityTarget] = useState(null);

  const handleSearch = useCallback(e => {
    setSearch(e.target.value); setPage(1); setSelected([]);
  }, []);

  const filtered   = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns = [
    { key:"staffId", label:"Staff ID", bold:true, link:true },
    { key:"name",    label:"Name",     bold:true },
    { key:"email",   label:"Email",    muted:true },
    { key:"role",    label:"Role",     muted:true },
    { key:"status",  label:"Status",   render: r => <Badge status={r.status}/> },
  ];

  return (<>
    <div style={{ marginBottom:24 }}>
      <h1 className="page-title">User Management</h1>
      <p className="page-subtitle">Manage system users and their roles.</p>
    </div>
    <div className="toolbar">
      <SearchInput value={search} onChange={handleSearch}/>
      <button className="btn btn-outline">Filters</button>
      <div className="toolbar-spacer"/>
      {selected.length > 0 && (
        <button className="btn btn-danger" onClick={()=>setDelTarget("bulk")}>
          Delete ({selected.length})
        </button>
      )}
      <button className="btn btn-primary" onClick={onAdd}>+ Add User</button>
    </div>

    {loading
      ? <SkeletonUserTable rows={10}/>
      : <DataTable
          columns={columns}
          rows={paginated}
          selected={selected}
          onToggleAll={()=>setSelected(
            paginated.every(r=>selected.includes(r.id)) ? [] : paginated.map(r=>r.id)
          )}
          onToggleOne={id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])}
          renderActions={row=>(
            <>
              <button className="btn btn-action-delete" onClick={()=>setDelTarget(row.id)}>
                <TrashIcon/> Delete
              </button>
              <button className="btn btn-action-edit" onClick={()=>onEdit(row)}>
                <EditIcon/> Edit
              </button>
              <button className="btn btn-action-reset-pw" onClick={()=>setResetTarget(row)}>
                <KeyIcon/> Reset PW
              </button>
              <button className="btn btn-action-activity" onClick={()=>setActivityTarget(row)}>
                <ActivityIcon/> Activity
              </button>
            </>
          )}
        />
    }

    {!loading && (
      <div className="data-table-wrapper" style={{ border:"none", borderTop:"1px solid #f4f6f4" }}>
        <Pagination page={safePage} total={filtered.length} perPage={PAGE_SIZE} onChange={setPage}/>
      </div>
    )}

    {/* Delete confirm */}
    {delTarget && (
      <ConfirmModal
        title="Delete user?" danger
        body="This will permanently remove the user from the system."
        confirmLabel="Yes, Delete" cancelLabel="Cancel"
        loading={delLoading}
        onCancel={()=>setDelTarget(null)}
        onConfirm={async()=>{
          setDelLoading(true);
          const ids = delTarget === "bulk" ? selected : [delTarget];
          await onDelete(ids);
          setSelected([]); setPage(1); setDelLoading(false); setDelTarget(null);
        }}
      />
    )}

    {/* Reset Password modal */}
    {resetTarget && (
      <ResetPasswordModal
        user={resetTarget}
        onReset={onResetPassword}
        onCancel={()=>setResetTarget(null)}
      />
    )}

    {/* UMSS_004: Activity Logs modal */}
    {activityTarget && (
      <ActivityLogsModal
        user={activityTarget}
        onFetch={onViewActivity}
        onClose={()=>setActivityTarget(null)}
      />
    )}
  </>);
}

/* ════════════════════════════════════════════════════════════
   TOAST HOOK
   ════════════════════════════════════════════════════════════ */
function useToast() {
  const [toast,  setToast]  = useState(null);
  const timerRef            = useRef(null);

  const showToast = useCallback(msg => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(msg);
    timerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const dismissToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, showToast, dismissToast };
}

/* ════════════════════════════════════════════════════════════
   ROOT COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function UserManagement() {
  const {
    users, loading, view, target,
    createUser, updateUser, deleteUsers,
    resetPassword, fetchActivityLogs,
    goList, startCreate, startEdit,
  } = useUserManagement();

  const { toast, showToast, dismissToast } = useToast();

  const handleSave = async (form) => {
    if (view === "create") {
      const result = await createUser(form);
      if (result.ok) {
        showToast("User successfully added");
        goList();
      }
      return result;
    } else {
      const result = await updateUser(target.id, { ...target, ...form });
      if (result.ok) {
        showToast("User successfully updated");
        goList();
      }
      return result;
    }
  };

  const handleDelete = async (ids) => {
    const result = await deleteUsers(ids);
    const n = Array.isArray(ids) ? ids.length : 1;
    showToast(result.ok ? (n > 1 ? `${n} users deleted` : "User deleted") : "Deleted (offline mode)");
  };

  const handleResetPassword = async (userId, newPassword) => {
    const result = await resetPassword(userId, newPassword);
    if (result.ok) showToast("Password reset successfully");
    return result;
  };

  // UMSS_004: delegate to hook's fetchActivityLogs — modal manages its own state
  const handleViewActivity = useCallback(
    (userId, params, signal) => fetchActivityLogs(userId, params, signal),
    [fetchActivityLogs]
  );

  return (
    <div className="page-layout">
      <Sidebar role="admin"/>
      <main id="main-content" className="page-main">
        <div className="page-body">
          {view === "list" && (
            <>
              {/**<ApiStatusBanner status={apiStatus} errorMsg={apiError} onRetry={fetchUsers}/>*/ }

              <UserList
                users={users}
                loading={loading}
                onEdit={startEdit}
                onDelete={handleDelete}
                onAdd={startCreate}
                onResetPassword={handleResetPassword}
                onViewActivity={handleViewActivity}
              />
            </>
          )}
          {(view === "create" || view === "edit") && (
            <UserForm initial={target} mode={view} onSave={handleSave} onCancel={goList}/>
          )}
        </div>
      </main>
      {toast && <Toast message={toast} onClose={dismissToast}/>}
    </div>
  );
}



