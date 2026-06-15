// src/components/ui/Button.jsx
// Replaces GreenBtn + OutlineBtn from G7Form and OldStudentForm
// Also usable across the whole app for consistent buttons
//
// Usage:
//   <Button>Save</Button>                      — green filled (default)
//   <Button variant="outline">Back</Button>    — transparent with green border
//   <Button variant="danger">Delete</Button>   — red filled
//   <Button variant="ghost">Cancel</Button>    — subtle gray
//   <Button disabled>Disabled</Button>
//   <Button size="sm">Small</Button>
//   <Button size="lg">Large</Button>

const variants = {
  primary: `bg-[#006312] hover:bg-[#FFF87F] hover:text-[#006312] hover:border-[#FFF87F]
            text-white border-[#2d6e2d] shadow-md`,
  outline: `bg-transparent hover:bg-[#006312] hover:text-white hover:border-[#006312]
            text-[#006312] border-[#006312]`,
  danger:  `bg-red-600 hover:bg-red-700 text-white border-red-600`,
  ghost:   `bg-white hover:bg-gray-50 text-gray-600 border-gray-200`,
};

const sizes = {
  sm: "px-4 py-1.5 text-sm",
  md: "px-6 py-2 text-sm",
  lg: "px-8 py-3 text-base",
};

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-bold border-2 rounded-lg
        transition-all duration-200 tracking-wide
        ${sizes[size]}
        ${disabled
          ? "bg-gray-300 text-white border-gray-300 cursor-not-allowed shadow-none"
          : variants[variant]
        }
        ${!disabled ? "cursor-pointer" : ""}
        ${className}`}
    >
      {children}
    </button>
  );
}