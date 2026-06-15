/* eslint-disable react-refresh/only-export-components -- shared primitives + Ico map for scheduling UI */
import { PAGE_SIZE } from "./adminClassSchedulingConstants.js";

export const ApiStatusBanner = ({ status, errorMsg, onRetry }) => {
  if (!status) return null;

  const config = {
    fetching: { label: "Fetching data from API…",              cls: "api-status-banner--fetching",  dot: "api-status-dot--fetching"  },
    success:  { label: "Live data loaded from API.",           cls: "api-status-banner--success",   dot: "api-status-dot--success"   },
    error:    { label: `API error: ${errorMsg || "unreachable"}. Showing default data.`, cls: "api-status-banner--error", dot: "api-status-dot--error" },
    fallback: { label: "Could not reach API. Showing fallback data.", cls: "api-status-banner--fallback", dot: "api-status-dot--fallback" },
  }[status];

  if (!config) return null;

  return (
    <div className={`api-status-banner ${config.cls}`}>
      <div className={`api-status-dot ${config.dot}`}/>
      {status === "fetching" && <div className="spinner"/>}
      <span style={{flex:1}}>{config.label}</span>
      {(status === "error" || status === "fallback") && onRetry && (
        <button onClick={onRetry} style={{fontSize:12,fontWeight:700,cursor:"pointer",background:"none",border:"1.5px solid currentColor",borderRadius:6,padding:"3px 10px",color:"inherit",fontFamily:"inherit"}}>
          Retry
        </button>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   SKELETON LOADERS
   ════════════════════════════════════════════════════════════ */
export const SkeletonRow = ({ cols = 5 }) => (
  <div className="skeleton-row">
    <div className={`skeleton skeleton-check`}/>
    {Array.from({ length: cols }).map((_, i) => (
      <div key={i} className={`skeleton skeleton-cell ${i === 0 ? "skeleton-cell--sm" : i === cols - 1 ? "skeleton-cell--md" : "skeleton-cell--lg"}`}/>
    ))}
    <div className="skeleton skeleton-cell--btn"/>
    <div className="skeleton skeleton-cell--btn"/>
  </div>
);

export const SkeletonTable = ({ rows = 6, cols = 5 }) => (
  <div style={{background:"#fff",border:"1.5px solid #e8ede8",borderRadius:14,overflow:"hidden"}}>
    <div style={{background:"#fafbfa",padding:"12px 18px",borderBottom:"1.5px solid #e8ede8",display:"flex",gap:14,alignItems:"center"}}>
      <div className="skeleton skeleton-check"/>
      {Array.from({length:cols}).map((_,i)=>(
        <div key={i} className={`skeleton skeleton-cell ${i===0?"skeleton-cell--sm":"skeleton-cell--md"}`} style={{height:12}}/>
      ))}
      <div style={{width:80,height:12}} className="skeleton skeleton-cell"/>
    </div>
    {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={cols}/>)}
  </div>
);

/* ════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════ */
export const Ico = {
  Search: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Filter: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>,
  Sort:   ()=><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>,
  Edit:   ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Eye:    ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Trash:  ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Plus:   ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  X:      ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  Save:   ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Check:  ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  Info:   ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  Grid:   ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  ChevL:  ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevR:  ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>,
  Archive:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
};

/* ════════════════════════════════════════════════════════════
   ATOMS
   ════════════════════════════════════════════════════════════ */
export const Checkbox = ({ checked, onChange, indeterminate = false }) => (
  <div onClick={e=>{e.stopPropagation();onChange();}}
    className={`checkbox ${checked||indeterminate?"checkbox--checked":"checkbox--unchecked"}`}>
    {indeterminate&&!checked ? <span className="checkbox__dash">−</span> : checked ? <span className="checkbox__mark">✓</span> : null}
  </div>
);

export const TabBar = ({ tabs, active, onChange }) => (
  <div className="tab-bar">
    {tabs.map(t => (
      <button key={t} onClick={()=>onChange(t)}
        className={`tab-bar__item ${active===t?"tab-bar__item--active":""}`}>
        {t}
      </button>
    ))}
  </div>
);

export const CardTitle = ({ children, action }) => (
  <div className="card-title">
    <span className="card-title__label">{children}</span>
    {action}
  </div>
);

export const Field = ({ label, value }) => (
  <div>
    <div className="field__label">{label}</div>
    <div className="field__value">{value || "—"}</div>
  </div>
);

export const Err = ({ msg }) => msg ? <span className="err">{msg}</span> : null;

export const SelectF = ({ label, value, onChange, options, placeholder="Select an option", required, error }) => (
  <div className="select-field">
    {label && (
      <label className="select-field__label">
        {label}{required && <span className="select-field__required"> *</span>}
      </label>
    )}
    <div className="select-field__wrapper">
      <select value={value} onChange={e=>onChange(e.target.value)}
        className="select-field__control"
        required={required}
        aria-invalid={Boolean(error)}
        style={{color:value?"#111f11":"#9ca3af"}}>
        <option value="" disabled>{placeholder}</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
      <div className="select-field__chevron"><Ico.Sort/></div>
    </div>
    {error && <Err msg={error} />}
  </div>
);

export const Pager = ({ total, page, onChange }) => {
  const tp = Math.max(1, Math.ceil(total/PAGE_SIZE));
  if (tp<=1) return null;
  const pages=[];
  if(tp<=7){for(let i=1;i<=tp;i++)pages.push(i);}
  else{pages.push(1);if(page>3)pages.push("…");for(let i=Math.max(2,page-1);i<=Math.min(tp-1,page+1);i++)pages.push(i);if(page<tp-2)pages.push("…");pages.push(tp);}
  return (
    <div className="pager">
      <button disabled={page===1} onClick={()=>onChange(page-1)} className="pager__btn pager__btn--inactive pager__nav">
        <Ico.ChevL/> Previous
      </button>
      {pages.map((p,i)=>p==="…"
        ? <span key={"e"+i} className="pager__ellipsis">…</span>
        : <button key={p} onClick={()=>onChange(p)} className={`pager__btn ${page===p?"pager__btn--active":"pager__btn--inactive"}`}>{p}</button>
      )}
      <button disabled={page===tp} onClick={()=>onChange(page+1)} className="pager__btn pager__btn--inactive pager__nav">
        Next <Ico.ChevR/>
      </button>
    </div>
  );
};

export const Overlay = ({ children }) => (
  <div className="overlay">{children}</div>
);

export const DeleteDlg = ({ name, onCancel, onConfirm, loading }) => (
  <Overlay>
    <div className="dialog dialog--delete">
      <div className="dialog__title">Confirm Delete</div>
      <p className="dialog__body">Are you sure you want to delete <strong>"{name}"</strong>? This cannot be undone.</p>
      <div className="dialog__footer">
        <button onClick={onCancel} className="btn btn-outline" disabled={loading}>Cancel</button>
        <button onClick={onConfirm} className="btn btn-danger" disabled={loading}>
          {loading ? <><div className="spinner"/>Deleting…</> : "Delete"}
        </button>
      </div>
    </div>
  </Overlay>
);

export const PreviewDlg = ({ title, fields, data, onCancel, onConfirm, loading }) => (
  <Overlay>
    <div className="dialog dialog--preview">
      <div className="preview-header">
        <div style={{color:"#1a5c1a"}}><Ico.Info/></div>
        <span className="preview-title">Preview</span>
      </div>
      <div className="preview-body">
        <div className="preview-body__label">{title}</div>
        <div className="preview-body__grid">
          {fields.map(f=>(
            <div key={f.label} className="preview-field">
              <span className="preview-field__label">{f.label}</span>
              <div className="preview-field__value">{data[f.key]||"—"}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="dialog__footer">
        <button onClick={onCancel} className="btn btn-outline" disabled={loading}><Ico.X/> Cancel</button>
        <button onClick={onConfirm} className="btn btn-primary" disabled={loading}>
          {loading ? <><div className="spinner"/>Saving…</> : <><Ico.Check/> Confirm</>}
        </button>
      </div>
    </div>
  </Overlay>
);

export const Breadcrumb = ({ items }) => (
  <div className="breadcrumb">
    {items.map((item,i)=>(
      <span key={i} style={{display:"flex",alignItems:"center",gap:10}}>
        {i>0 && <span className="breadcrumb__sep">›</span>}
        {item.onClick
          ? <button onClick={item.onClick} className="breadcrumb__link">{item.label}</button>
          : <span className="breadcrumb__current">{item.label}</span>}
      </span>
    ))}
  </div>
);


