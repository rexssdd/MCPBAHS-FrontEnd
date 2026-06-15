// src/components/ui/SectionTag.jsx
export default function SectionTag({ children }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center gap-2 bg-[#006312] text-[#FFF87F] px-5 py-1.5 rounded-full font-bold text-[14px] tracking-wide mb-3"
    >
      {children}
    </span>
  );
}