// src/components/ui/FormInput.jsx
// Replaces FInput from G7Form and OldStudentForm

export default function FormInput({
  value,
  onChange,
  type = "text",
  placeholder = "Enter value",
  error,
  required = false,
  maxLength,
  autoComplete,
  inputMode,
  className = "",
  ...props
}) {
  const resolvedMaxLength = maxLength ?? (type === "text" || type === "email" || type === "tel" ? 120 : undefined);
  const handleChange = (event) => {
    if (["text", "email", "tel", "search", "url", "password"].includes(type)) {
      event.target.value = String(event.target.value ?? "").replace(/[<>]/g, "").slice(0, resolvedMaxLength ?? undefined);
    }
    onChange?.(event);
  };
  return (
    <>
      <input
        type={type}
        value={value ?? ""}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        maxLength={resolvedMaxLength}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        className={`w-full px-3 py-2 border ${error ? "border-[#dc2626] bg-[#fff7f7]" : "border-[#c3dfc7]"} rounded-md text-[13.5px] text-[#1a2e1a] bg-white outline-none transition
          focus:border-[#006312] focus:ring-2 focus:ring-[#006312]/10
          placeholder:text-[#9ab89a] ${className}`}
        {...props}
      />
      {error && <span className="block mt-1 text-[11.5px] font-semibold text-[#dc2626]">{error}</span>}
    </>
  );
}


