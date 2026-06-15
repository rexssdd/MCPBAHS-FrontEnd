// src/components/ui/StepBar.jsx
// Replaces StepBar from G7Form and OldStudentForm
// Props:
//   steps   — string[]  e.g. ["Personal Info", "Address", "Parents", "Attachments"]
//   current — number    0-based index of the active step

export default function StepBar({ steps, current }) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          {/* step circle + label */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[13px] border-2 transition-all
                ${i < current
                  ? "bg-[#006312] border-[#2d6e2d] text-white"
                  : i === current
                    ? "bg-[#FFF87F] border-[#006312] text-[#006312]"
                    : "bg-white/25 border-white/30 text-white"
                }`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={`text-[10px] uppercase tracking-[0.06em] whitespace-nowrap transition-all
                ${i === current ? "font-bold text-[#FFF87F]" : "font-medium text-white/70"}`}
            >
              {label}
            </span>
          </div>

          {/* connector line */}
          {i < steps.length - 1 && (
            <div
              className={`w-[52px] h-0.5 mb-[17px] transition-colors
                ${i < current ? "bg-[#FFF87F]" : "bg-white/25"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}