/**
 * src/pages/Admin/Reports.jsx  (also used by Principal with role="principal")
 *
 * Black-box fixes applied:
 *  ✔ BUG 1  — useEffect now re-runs fetchReports when filters/page change
 *  ✔ BUG 2  — double createReport removed; SubmitReport owns the API call
 *  ✔ BUG 3  — delete/archive snapshot rollback on API failure
 *  ✔ BUG 4  — window.confirm replaced with ConfirmModal for bulk delete
 *  ✔ BUG 5  — selected cleared after bulk delete
 *  ✔ BUG 6  — currentPage reset to 1 on search/filter change
 *  ✔ BUG 7  — previewReport synced after evaluate (already present, kept)
 *  ✔ BUG 8  — activeReport cleared on back navigation from viewfull
 *  ✔ BUG 9  — toast shown when evaluate API fails (offline warning)
 *  ✔ BUG 10 — SubmitReport collects sfNumber, gradeLevel, section, month
 *             from the user instead of hardcoding them
 *  ✔ BUG 11 — Submit button disabled until all files are "complete"
 *  ✔ BUG 14 — uploadFile guarantees onProgress(100) after XHR onload
 */
import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../Components/Sidebar";
import "../../Css/Admin/Reports.css";
import reportsService from "../../services/Admin/Reports/reportService";
import { SF_INFO, MOCK_REPORTS, PAGE_SIZE } from "./reports/adminReportsConstants.js";
import {
  PreviewPanel, ConfirmModal, SubmitReport, ViewReportPage, EvaluatePage,
} from "./reports/AdminReportsSubpages.jsx";
import {
  ISearch, IFilter, ISort, IChevL, IChevR, ICancel, IDelete, IArchive, IRefresh, ISubmitDoc, IEvaluate, IEye, IDownload,
} from "./reports/AdminReportsIcons.jsx";
import {
  ApiStatusBar, SkeletonTable, Checkbox, Toast, StatusBadge,
} from "./reports/AdminReportsDocumentKit.jsx";

/**
 * Normalize a raw API report record to the shape the frontend expects.
 * Backend returns snake_case + raw enum values; frontend uses camelCase + labels.
 */
function normalizeReport(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    // Identity — prefer uuid as id since routes use whereUuid()
    id:           raw.uuid  ?? raw.id,
    uuid:         raw.uuid  ?? raw.id,
    // SF number: backend sends "sf1"..."sf10", frontend wants integer 1-10
    sfNumber:     raw.sfNumber != null
                    ? parseInt(raw.sfNumber)
                    : raw.form_type
                      ? parseInt(String(raw.form_type).replace("sf", ""))
                      : raw.sfNumber,
    // Status: use status_label when present (e.g. "For Admin Approval",
    // "For Principal Approval", "Approved", "Disapproved"), otherwise fall
    // back to the raw enum string.
    status:       raw.status_label ?? raw.status,
    // Submitter name: backend nests it in submitted_by.name
    submittedBy:  raw.submittedBy
                    ?? raw.submitted_by?.name
                    ?? raw.submitted_by
                    ?? "—",
    // File metadata: backend nests under file{}
    fileName:     raw.fileName
                    ?? raw.original_filename
                    ?? raw.file?.original_filename,
    original_filename: raw.original_filename ?? raw.file?.original_filename,
    // Dates
    submittedOn:  raw.submittedOn  ?? raw.created_at,
    evaluatedOn:  raw.evaluatedOn  ?? raw.reviewed_at ?? "—",
    dateSubmitted: raw.dateSubmitted ?? raw.created_at,
    // Reviewer remarks
    comment:      raw.comment  ?? raw.remarks,
    // Pass-through fields
    schoolYear:   raw.schoolYear  ?? raw.school_year,
    gradeLevel:   raw.gradeLevel  ?? raw.grade_level,
    section:      raw.section,
    month:        raw.month,
    docId:        raw.docId ?? raw.uuid,
    files:        raw.files ?? [],
    archivedAt:   raw.archivedAt ?? raw.archived_at ?? null,
  };
}

export default function Reports() {
  const [reports,       setReports]       = useState([]);
  const [archivedReports, setArchivedReports] = useState([]);
  const [activeTab,     setActiveTab]     = useState("active"); // "active" | "archived"
  const [selected,      setSelected]      = useState([]);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("All");
  const [sfFilter,      setSfFilter]      = useState("All");
  const [showFilter,    setShowFilter]    = useState(false);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [view,          setView]          = useState("list");
  const [activeReport,  setActiveReport]  = useState(null);
  const [previewReport, setPreviewReport] = useState(null);
  const [toast,         setToast]         = useState({ message:"", type:"success" });
  const [apiStatus,     setApiStatus]     = useState("loading");
  const [apiMsg,        setApiMsg]        = useState("");
  const [tableLoading,  setTableLoading]  = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmModal,  setConfirmModal]  = useState(null);
  const [bulkConfirm,   setBulkConfirm]   = useState(false);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message:"", type:"success" }), 3500);
  }, []);

  /* ── fetchReports: re-runs on filter/page/tab changes ── */
  const fetchReports = useCallback(async () => {
    setTableLoading(true);
    setApiStatus("loading");
    setApiMsg("");
    try {
      await reportsService.healthCheck();
      if (activeTab === "archived") {
        const result = await reportsService.getArchivedReports({ page: currentPage, limit: PAGE_SIZE });
        const data = (Array.isArray(result) ? result : (result.data || [])).map(normalizeReport);
        setArchivedReports(data);
        setApiStatus("connected");
        setApiMsg(`${data.length} archived record${data.length !== 1 ? "s" : ""} loaded`);
      } else {
        const result = await reportsService.getReports({
          search,
          status: statusFilter !== "All" ? statusFilter : "",
          sf:     sfFilter     !== "All" ? sfFilter     : "",
          page:   currentPage,
          limit:  PAGE_SIZE,
        });
        const data = (Array.isArray(result) ? result : (result.data || [])).map(normalizeReport);
        setReports(data);
        setApiStatus("connected");
        setApiMsg(`${data.length} record${data.length !== 1 ? "s" : ""} loaded`);
      }
    } catch (err) {
      setApiStatus("error");
      setApiMsg("Unable to load reports — " + (err.message || "API not reachable"));
      if (activeTab === "archived") setArchivedReports([]);
      else setReports([]);
    } finally {
      setTableLoading(false);
    }
  }, [search, statusFilter, sfFilter, currentPage, activeTab]);

  // FIX BUG 1: depend on the filters so changes re-fetch
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /* ── FIX BUG 6: reset page when search or filter changes ── */
  const handleSearchChange = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };
  const handleStatusFilter = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };
  const handleSfFilter = (val) => {
    setSfFilter(val);
    setCurrentPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelected([]);
    setPreviewReport(null);
    setSearch("");
  };

  /* ── Client-side filter ── */
  const sourceList = activeTab === "archived" ? archivedReports : reports;
  const filtered = sourceList.filter(r => {
    const q = search.toLowerCase();
    return (r.docId?.toLowerCase().includes(q) || r.submittedBy?.toLowerCase().includes(q))
      && (statusFilter === "All" || r.status === statusFilter)
      && (sfFilter === "All" || r.sfNumber === parseInt(sfFilter));
  });

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(currentPage, totalPages);
  const paged       = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allChecked  = paged.length > 0 && paged.every(r => selected.includes(r.id));
  const someChecked = selected.length > 0 && !allChecked;
  const toggleAll   = () => setSelected(allChecked ? [] : paged.map(r => r.id));
  const toggleOne   = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  /* ── FIX BUG 5: clear stale selections when reports list changes ── */
  useEffect(() => {
    const validIds = new Set(reports.map(r => r.id));
    setSelected(prev => prev.filter(id => validIds.has(id)));
  }, [reports]);

  /* ── Download ── */
  const handleDownload = async (report) => {
    try {
      // Route is registered with whereUuid('report') — pass UUID, not integer id.
      // normalizeReport sets id = uuid so report.id is already the UUID.
      const blob = await reportsService.downloadReport(report.uuid ?? report.id);
      const url = URL.createObjectURL(blob);
      const filename = report.original_filename ?? report.fileName ?? "report";
      const a = document.createElement("a"); a.href = url; a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // FIX: defer revoke so the browser has time to start the download.
      setTimeout(() => URL.revokeObjectURL(url), 150);
      showToast(`Downloaded ${filename}`);
    } catch {
      showToast(`Download failed — ${report.original_filename ?? report.fileName} not available from server`, "error");
    }
  };

  /* ── FIX BUG 3: Delete with snapshot rollback ── */
  const handleDelete = async () => {
    if (!confirmModal?.report) return;
    setActionLoading(true);
    const snapshot = reports;
    // Optimistic removal
    setReports(p => p.filter(r => r.id !== confirmModal.report.id));
    if (previewReport?.id === confirmModal.report.id) setPreviewReport(null);
    try {
      await reportsService.deleteReport(confirmModal.report.id);
      showToast("Report deleted successfully.");
    } catch {
      // Rollback on failure
      setReports(snapshot);
      showToast("Delete failed — please try again.", "error");
    } finally {
      setActionLoading(false);
      setConfirmModal(null);
    }
  };

  /* ── Archive with proper move to archived list ── */
  const handleArchive = async () => {
    if (!confirmModal?.report) return;
    setActionLoading(true);
    const target = confirmModal.report;
    const snapshotActive = reports;
    // Optimistic: remove from active list
    setReports(p => p.filter(r => r.id !== target.id));
    if (previewReport?.id === target.id) setPreviewReport(null);
    try {
      const archived = await reportsService.archiveReport(target.uuid ?? target.id);
      const normalized = normalizeReport(archived);
      // Add to archived list so it appears immediately if user switches tab
      setArchivedReports(p => [normalized, ...p]);
      showToast("Report archived successfully.");
    } catch {
      setReports(snapshotActive);
      showToast("Archive failed — please try again.", "error");
    } finally {
      setActionLoading(false);
      setConfirmModal(null);
    }
  };

  /* ── Unarchive: restore to active list ── */
  const handleUnarchive = async (report) => {
    const snapshotArchived = archivedReports;
    setArchivedReports(p => p.filter(r => r.id !== report.id));
    try {
      const restored = await reportsService.unarchiveReport(report.uuid ?? report.id);
      const normalized = normalizeReport(restored);
      setReports(p => [normalized, ...p]);
      showToast("Report restored to active list.");
    } catch {
      setArchivedReports(snapshotArchived);
      showToast("Restore failed — please try again.", "error");
    }
  };

  /* ── FIX BUG 4+5: Bulk delete with ConfirmModal + clear selected ── */
  const handleBulkDelete = async () => {
    setBulkConfirm(false);
    const ids = [...selected];
    const snapshot = reports;
    // Optimistic removal
    setReports(p => p.filter(r => !ids.includes(r.id)));
    setSelected([]); // FIX BUG 5
    if (ids.includes(previewReport?.id)) setPreviewReport(null);
    try {
      await reportsService.bulkDelete(ids);
      showToast(`${ids.length} report(s) deleted.`);
    } catch {
      setReports(snapshot);
      setSelected(ids); // restore selection on failure
      showToast("Bulk delete failed — please try again.", "error");
    }
  };

  /* ── Pagination numbers ── */
  const pageNums = [];
  if (totalPages <= 7) { for(let i=1;i<=totalPages;i++) pageNums.push(i); }
  else {
    pageNums.push(1);
    if (safePage > 3) pageNums.push("…");
    for(let i=Math.max(2,safePage-1); i<=Math.min(totalPages-1,safePage+1); i++) pageNums.push(i);
    if (safePage < totalPages-2) pageNums.push("…");
    pageNums.push(totalPages);
  }

  /* ── Sub-page routes ── */

  // FIX BUG 2: parent just receives the already-created report from SubmitReport
  if (view === "submit") return (
    <SubmitReport
      onBack={() => setView("list")}
      onSubmitted={(created) => {
        setReports(p => [created, ...p]);
        setView("list");
        showToast("Report submitted successfully.");
      }}
    />
  );

  // FIX BUG 8: activeReport cleared on back
  if (view === "viewfull" && activeReport) return (
    <ViewReportPage
      report={activeReport}
      onBack={() => { setView("list"); setActiveReport(null); }}
      onEvaluate={() => setView("evaluate")}
    />
  );

  // FIX BUG 8+9: activeReport cleared on back; offline warning shown
  if (view === "evaluate" && activeReport) return (
    <EvaluatePage
      report={activeReport}
      onBack={() => { setView("list"); setActiveReport(null); }}
      onDone={(updated, isOffline) => {
        setReports(p => p.map(r => r.id === updated.id ? updated : r));
        if (previewReport?.id === updated.id) setPreviewReport(updated);
        setView("list");
        setActiveReport(null); // FIX BUG 8
        // FIX BUG 9: show offline warning if API failed
        showToast(
          isOffline
            ? `Report ${updated.status.toLowerCase()} locally (offline — will sync on refresh)`
            : `Report ${updated.status.toLowerCase()} successfully.`,
          isOffline ? "error" : "success"
        );
      }}
    />
  );

  /* ── Main list ── */
  const hasPreview = !!previewReport;

  return (
    <div className="rpt-root">
      <Sidebar active="Reports and DepEd" />
      <main className="rpt-main">

        <div className="rpt-page-header">
          <h1 className="rpt-page-title">Reports and DepEd Compliance</h1>
          <p className="rpt-page-sub">Manage SF reports submitted by teachers. Data is fetched live from the API.</p>
        </div>

        {/* ── Tabs ── */}
        <div style={{display:"flex",gap:0,borderBottom:"2px solid #e8ede8",marginBottom:18,marginTop:4}}>
          {[
            { key:"active",   label:"Active Reports",   count: reports.length },
            // { key:"archived", label:"Archived Reports", count: archivedReports.length },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                padding:"10px 22px", fontSize:13.5, fontWeight:700, border:"none",
                borderBottom: activeTab===tab.key ? "2.5px solid #1a5c1a" : "2.5px solid transparent",
                background:"transparent", color: activeTab===tab.key ? "#1a5c1a" : "#9aaa9a",
                cursor:"pointer", display:"flex", alignItems:"center", gap:8, transition:"color 0.15s",
                marginBottom:"-2px",
              }}>
              {tab.label}
              <span style={{
                fontSize:11, fontWeight:800, padding:"2px 7px", borderRadius:99,
                background: activeTab===tab.key ? "#e8f5e9" : "#f4f6f4",
                color: activeTab===tab.key ? "#1a5c1a" : "#9aaa9a",
              }}>{tab.count}</span>
            </button>
          ))}
        </div>

        <ApiStatusBar status={apiStatus} message={apiMsg} onRetry={fetchReports} />

        <div className="rpt-toolbar">
          <div className="rpt-search-box">
            <ISearch/>
            <input className="rpt-search-input" placeholder="Search by doc ID or submitter…"
              value={search} onChange={e => handleSearchChange(e.target.value)} />
          </div>

          <div style={{position:"relative"}}>
            <button className="rpt-btn rpt-btn--filter" onClick={()=>setShowFilter(v=>!v)}>
              <IFilter /> Filters
              {(statusFilter!=="All"||sfFilter!=="All") && (
                <span className="rpt-filter-badge">{(statusFilter!=="All"?1:0)+(sfFilter!=="All"?1:0)}</span>
              )}
            </button>
            {showFilter && (
              <div className="rpt-filter-dropdown">
                <div className="rpt-filter-group-label">Status</div>
                {["All","For Admin Approval","For Principal Approval","Approved","Disapproved"].map(s=>(
                  <div key={s} className="rpt-filter-option" onClick={()=>handleStatusFilter(s)}>
                    <div className="rpt-filter-check"
                      style={{background:statusFilter===s?"#1a5c1a":"#fff",border:statusFilter===s?"none":"1.5px solid #d0d8d0"}}>
                      {statusFilter===s&&<span style={{color:"#fff",fontSize:10}}>✓</span>}
                    </div>
                    {s==="All"?"All Statuses":s}
                  </div>
                ))}
                <div className="rpt-filter-group-label" style={{marginTop:10}}>SF Form</div>
                {["All",...Array.from({length:10},(_,i)=>String(i+1))].map(s=>(
                  <div key={s} className="rpt-filter-option" onClick={()=>handleSfFilter(s)}>
                    <div className="rpt-filter-check"
                      style={{background:sfFilter===s?"#1a5c1a":"#fff",border:sfFilter===s?"none":"1.5px solid #d0d8d0"}}>
                      {sfFilter===s&&<span style={{color:"#fff",fontSize:10}}>✓</span>}
                    </div>
                    {s==="All"?"All Forms":`SF${s}`}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="rpt-btn rpt-btn--filter" onClick={fetchReports} title="Refresh data from API">
            <IRefresh /> Refresh
          </button>

          {/* FIX BUG 4: ConfirmModal for bulk delete */}
          {selected.length > 0 && (
            <button className="rpt-btn rpt-btn--danger-ghost" onClick={() => setBulkConfirm(true)}>
              <IDelete /> Delete Selected ({selected.length})
            </button>
          )}

          <div style={{flex:1}}/>
          <button className="rpt-btn rpt-btn--primary" onClick={()=>setView("submit")}>
            <ISubmitDoc /> Submit a Report
          </button>
        </div>

        {/* Table + preview panel */}
        <div className={`rpt-content-wrap${hasPreview?" rpt-content-wrap--split":""}`}>
          <div className="rpt-table-card">
            <table className="rpt-table-full">
              <thead>
                <tr className="rpt-table-head-row">
                  <th className="rpt-th rpt-th--check">
                    <Checkbox checked={allChecked} indeterminate={someChecked} onChange={toggleAll}/>
                  </th>
                  {[["Doc ID",true],["SF Form",false],["Submitted By",true],["Date Submitted",true],...(activeTab==="archived"?[["Archived On",true]]:[["Status",false]]),["Actions",false]].map(([lbl,sort])=>(
                    <th key={lbl} className="rpt-th">
                      {sort ? <span className="rpt-th-sort">{lbl} <ISort/></span> : lbl}
                    </th>
                  ))}
                </tr>
              </thead>

              {tableLoading ? (
                <SkeletonTable rows={PAGE_SIZE} />
              ) : (
                <tbody>
                  {paged.map(r => {
                    const sfInfo = SF_INFO[r.sfNumber] || SF_INFO[1];
                    const isPreviewActive = previewReport?.id === r.id;
                    return (
                      <tr key={r.id}
                        className={`rpt-table-row${isPreviewActive?" rpt-table-row--active":""}`}
                        onClick={() => activeTab !== "archived" && setPreviewReport(isPreviewActive ? null : r)}
                        style={{cursor: activeTab === "archived" ? "default" : "pointer"}}>

                        <td className="rpt-td rpt-td--check" onClick={e=>e.stopPropagation()}>
                          <Checkbox checked={selected.includes(r.id)} onChange={()=>toggleOne(r.id)}/>
                        </td>
                        <td className="rpt-td">
                          <div style={{fontWeight:700,color:"#111f11",fontSize:13}}>{r.docId}</div>
                          <div style={{fontSize:11,color:"#9aaa9a",marginTop:1}}>{r.fileName}</div>
                        </td>
                        <td className="rpt-td">
                          <span className="rpt-sf-pill">{sfInfo.name}</span>
                          <div style={{fontSize:10,color:"#9aaa9a",marginTop:3,maxWidth:140,lineHeight:1.3}}>{sfInfo.title}</div>
                        </td>
                        <td className="rpt-td rpt-td--muted">{r.submittedBy}</td>
                        <td className="rpt-td rpt-td--muted">{r.dateSubmitted}</td>
                        {activeTab === "archived"
                          ? <td className="rpt-td rpt-td--muted">{r.archivedAt || "—"}</td>
                          : <td className="rpt-td"><StatusBadge status={r.status}/></td>
                        }
                        <td className="rpt-td" onClick={e=>e.stopPropagation()}>
                          <div className="rpt-actions">
                            {activeTab === "archived" ? (
                              <>
                                <button className="rpt-action-btn rpt-action-btn--green" title="Restore Report"
                                  onClick={()=>handleUnarchive(r)}>
                                  <IRefresh /> Restore
                                </button>
                                <button className="rpt-action-btn rpt-action-btn--primary" title="Download Report"
                                  onClick={()=>handleDownload(r)}><IDownload /> Download</button>
                                <button className="rpt-action-btn rpt-action-btn--danger" title="Delete Report"
                                  onClick={()=>setConfirmModal({ type:"delete", report:r })}><IDelete /> Delete</button>
                              </>
                            ) : (
                              <>
                                {!["For Principal Approval","Approved","Disapproved"].includes(r.status) && (
                                  <button className="rpt-action-btn rpt-action-btn--warn" title="Evaluate Report"
                                    onClick={()=>{ setActiveReport(r); setView("evaluate"); }}><IEvaluate /> Evaluate</button>
                                )}
                                <button className="rpt-action-btn rpt-action-btn--green" title="View Full Report"
                                  onClick={()=>{ setActiveReport(r); setView("viewfull"); }}><IEye /> View</button>
                                <button className="rpt-action-btn rpt-action-btn--primary" title="Download Report"
                                  onClick={()=>handleDownload(r)}><IDownload /> Download</button>
                                {/* <button className="rpt-action-btn rpt-action-btn--danger" title="Archive Report"
                                  onClick={()=>setConfirmModal({ type:"archive", report:r })}><IArchive /> Archive</button> */}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paged.length === 0 && (
                    <tr><td colSpan={7} className="rpt-empty-row">No reports found.</td></tr>
                  )}
                </tbody>
              )}
            </table>

            <div className="rpt-pagination">
              <button className="rpt-page-btn rpt-page-btn--nav" disabled={safePage===1}
                onClick={()=>setCurrentPage(p=>Math.max(1,p-1))}><IChevL/> Previous</button>
              {pageNums.map((p,i)=>
                p==="…"
                  ? <span key={"e"+i} className="rpt-page-ellipsis">…</span>
                  : <button key={p} onClick={()=>setCurrentPage(p)}
                      className={`rpt-page-btn${safePage===p?" rpt-page-btn--active":""}`}>{p}</button>
              )}
              <button className="rpt-page-btn rpt-page-btn--nav" disabled={safePage===totalPages}
                onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))}>Next <IChevR/></button>
            </div>
          </div>

          {hasPreview && (
            <PreviewPanel
              report={previewReport}
              loading={false}
              onClose={()=>setPreviewReport(null)}
              onView={()=>{ setActiveReport(previewReport); setView("viewfull"); }}
              onEvaluate={()=>{ setActiveReport(previewReport); setView("evaluate"); }}
            />
          )}
        </div>
      </main>

      {/* Delete / Archive confirmation */}
      {confirmModal && (
        <ConfirmModal
          type={confirmModal.type}
          report={confirmModal.report}
          loading={actionLoading}
          onCancel={()=>setConfirmModal(null)}
          onConfirm={confirmModal.type==="delete" ? handleDelete : handleArchive}
        />
      )}

      {/* FIX BUG 4: Bulk delete confirmation modal */}
      {bulkConfirm && (
        <ConfirmModal
          type="delete"
          report={{ docId:`${selected.length} selected report(s)` }}
          loading={false}
          onCancel={()=>setBulkConfirm(false)}
          onConfirm={handleBulkDelete}
        />
      )}

      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}
