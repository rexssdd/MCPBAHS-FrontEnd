// src/components/ui/UploadBox.jsx
// Replaces UploadBox from G7Form and OldStudentForm

import { useState, useRef } from "react";

export default function UploadBox({ label, file, onFile }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);
  const preview = file ? URL.createObjectURL(file) : null;

  return (
    <div className="flex-1 basis-[calc(50%-10px)] min-w-[160px]">
      <label className="block text-[11.5px] font-semibold text-[#4a6b4a] uppercase tracking-[0.06em] mb-1">
        {label}
      </label>
      <div
        onClick={() => ref.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
        }}
        className={`min-h-[96px] rounded-lg border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1.5 p-2.5 transition-all
          ${drag
            ? "border-[#006312] bg-[#e6f4ea]"
            : file
              ? "border-[#2d6e2d] bg-[#f0f9f0]"
              : "border-[#c3dfc7] bg-[#f5f9f5]"
          }`}
      >
        <input
          ref={ref}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]); }}
        />

        {preview ? (
          <img src={preview} alt="preview" className="max-h-14 max-w-full rounded object-contain" />
        ) : (
          <span className="text-[26px] text-[#c3dfc7] leading-none">+</span>
        )}

        <span className={`text-[11px] font-semibold text-center ${file ? "text-[#006312]" : "text-[#4a6b4a]"}`}>
          {file
            ? file.name.length > 22 ? file.name.slice(0, 20) + "…" : file.name
            : "Click or drag to upload"}
        </span>
      </div>
    </div>
  );
}