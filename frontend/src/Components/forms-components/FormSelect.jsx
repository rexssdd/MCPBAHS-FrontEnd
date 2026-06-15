// src/components/ui/FormSelect.jsx
// Replaces FSelect from G7Form and OldStudentForm

export default function FormSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  error,
  required = false,
  className = "",
}) {
  return (
    <>
      <select
        value={value ?? ""}
        onChange={onChange}
        required={required}
        aria-invalid={Boolean(error)}
        className={`w-full px-3 py-2 border ${error ? "border-[#dc2626] bg-[#fff7f7]" : "border-[#c3dfc7]"} rounded-md text-[13.5px] text-[#1a2e1a] bg-white outline-none cursor-pointer transition
          focus:border-[#006312] focus:ring-2 focus:ring-[#006312]/10 ${className}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
      {error && <span className="block mt-1 text-[11.5px] font-semibold text-[#dc2626]">{error}</span>}
    </>
  );
}


