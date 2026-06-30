/**
 * AvatarUpload.jsx
 * Shared profile-picture upload control used by Admin/Registrar (and
 * usable by any other role) profile pages.
 *
 * Renders the current avatar (image or initials fallback) with a small
 * camera button overlay that opens a file picker. Client-side validates
 * type/size before handing the File off to the caller's onUpload handler.
 */
import { useRef } from "react";

const MAX_AVATAR_MB = 5;
const ACCEPTED_AVATAR_TYPES = "image/jpeg,image/png,image/webp,image/gif";

export default function AvatarUpload({ imageUrl, initials, uploading, onUpload, name }) {
  const inputRef = useRef(null);

  const pickFile = () => {
    if (uploading) return;
    inputRef.current?.click();
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onUpload(null, "Please select an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      onUpload(null, `Image is too large. Maximum size is ${MAX_AVATAR_MB}MB.`);
      return;
    }
    onUpload(file);
  };

  return (
    <div className="avatar" aria-label={name}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="avatar-img" />
      ) : (
        <span className="avatar-initials">{initials}</span>
      )}

      <button
        type="button"
        className="avatar-edit-btn"
        onClick={pickFile}
        disabled={uploading}
        aria-label="Change profile picture"
        title="Change profile picture"
      >
        {uploading ? (
          <span className="avatar-spinner" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_AVATAR_TYPES}
        className="avatar-file-input"
        onChange={onFileChange}
      />
    </div>
  );
}