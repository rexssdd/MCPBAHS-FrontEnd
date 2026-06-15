// src/components/ui/YesNo.jsx
// Replaces YesNo from G7Form and OldStudentForm

export default function YesNo({ value, onChange }) {
  return (
    <div className="flex gap-5 pt-0.5">
      {["Yes", "No"].map((opt) => (
        <label
          key={opt}
          onClick={() => onChange(opt)}
          className="flex items-center gap-1.5 cursor-pointer text-[13.5px] font-medium text-[#1a2e1a] select-none"
        >
          {/* radio circle */}
          <div
            className={`w-[17px] h-[17px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
              ${value === opt
                ? "border-[#006312] bg-[#006312]"
                : "border-[#c3dfc7] bg-white"
              }`}
          >
            {value === opt && (
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </div>
          {opt}
        </label>
      ))}
    </div>
  );
}