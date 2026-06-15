// src/components/ui/FormField.jsx
// Replaces Field from G7Form and OldStudentForm
// Also exports SectionHeading to replace the secHead style object

export function SectionHeading({ children }) {
  return (
    <div className="text-[11px] font-bold text-[#006312] uppercase tracking-widest pb-2.5 pt-1.5 border-b-2 border-[#c3dfc7] mb-4">
      {children}
    </div>
  );
}

export default function FormField({ label, half = false, children }) {
  return (
    <div className={half ? "flex-1 basis-[calc(50%-8px)] min-w-[180px]" : "flex-1 basis-full"}>
      <label className="block text-[11.5px] font-semibold text-[#4a6b4a] uppercase tracking-[0.06em] mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}