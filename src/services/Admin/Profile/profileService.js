/**
 * profileService.js
 * Profile domain service — built on top of the project's apiClient.
 *
 * apiClient always resolves (never throws). Every response follows:
 *   { data: T | null, ok: boolean, status: number | null, error: string | null }
 *
 * This service unwraps the envelope: it returns `data` on success and
 * throws an Error (with the server's error message) on failure, so
 * call-sites can keep a simple try/catch pattern and remain unchanged.
 */

import apiClient from "../apiClient";
import { supabase } from "../../../lib/supabase";

/* ─────────────────────────────────────────────────────────────────
   INTERNAL HELPERS
───────────────────────────────────────────────────────────────── */

/**
 * Unwrap an apiClient envelope.
 * Returns `data` when ok, throws with the error message otherwise.
 * @template T
 * @param {{ data: T|null, ok: boolean, status: number|null, error: string|null }} envelope
 * @returns {T}
 */
function unwrap(envelope) {
  if (envelope.ok) return envelope.data;
  throw new Error(envelope.error ?? `HTTP ${envelope.status}`);
}

/* ─────────────────────────────────────────────────────────────────
   PROFILE
───────────────────────────────────────────────────────────────── */

/**
 * Fetch the current user's profile.
 *
 * Expected response shape:
 *   { firstName, lastName, email, role, employeeId,
 *     school, department, contactNumber, profileImage, lastPasswordChange? }
 *
 * @returns {Promise<Profile>}
 */
async function getProfile() {
  return unwrap(await apiClient.get("/profile"));
}

/**
 * Update editable profile fields.
 *
 * @param {{ firstName?: string, lastName?: string, email?: string,
 *           contactNumber?: string, department?: string,
 *           profileImage?: string }} payload
 * @returns {Promise<Profile>}
 */
async function updateProfile(payload) {
  return unwrap(await apiClient.put("/profile", payload));
}

/* ─────────────────────────────────────────────────────────────────
   AVATAR / PROFILE IMAGE  (Supabase Storage)
───────────────────────────────────────────────────────────────── */

const AVATAR_BUCKET    = "avatars";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES    = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function extOf(file) {
  const fromName = file.name?.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  return (file.type?.split("/")[1] || "jpg").toLowerCase();
}

/**
 * Upload a new profile picture to Supabase Storage and persist its public
 * URL onto the user's row via the backend `/profile` endpoint, so the
 * avatar is reflected both in Storage and in the database record.
 *
 * @param {File} file       — image file selected by the user
 * @param {string|number} userId — used to namespace the storage path so
 *                                  each user's avatars don't collide
 * @returns {Promise<{ profileImage: string }>} the persisted profile patch
 */
async function uploadProfileImage(file, userId) {
  if (!file) throw new Error("No file selected.");
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Please upload a JPG, PNG, WEBP, or GIF image.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Image is too large. Maximum size is 5MB.");
  }

  const safeId   = String(userId ?? "user").replace(/[^a-zA-Z0-9_-]/g, "");
  const path     = `${safeId || "user"}/${Date.now()}.${extOf(file)}`;

  // 1) Upload the binary to Supabase Storage
  const { error: uploadError } = await supabase
    .storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload image to storage.");
  }

  // 2) Resolve its public URL
  const { data: publicUrlData } = supabase
    .storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(path);

  const publicUrl = publicUrlData?.publicUrl;
  if (!publicUrl) {
    throw new Error("Upload succeeded but no public URL was returned.");
  }

  // 3) Persist the URL onto the user's profile row in the database
  //    (cache-bust so <img> tags don't show a stale cached image after
  //    re-uploads to the same path)
  const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
  const updated = await updateProfile({ profileImage: cacheBustedUrl });

  return { profileImage: cacheBustedUrl, ...updated };
}

/* ─────────────────────────────────────────────────────────────────
   SECURITY / PASSWORD
───────────────────────────────────────────────────────────────── */

/**
 * Change the current user's password.
 *
 * The server is expected to return a 200 with a JSON body on success,
 * or a non-2xx status with an optional { message } body on failure.
 * apiClient surfaces the latter as an Error whose message matches what
 * the original inline fetch code forwarded to the UI.
 *
 * @param {{ currentPassword: string, newPassword: string }} payload
 * @returns {Promise<{ message?: string }>}
 */
async function changePassword(payload) {
  return unwrap(await apiClient.post("/profile/change-password", payload));
}

/* ─────────────────────────────────────────────────────────────────
   EXPORT
───────────────────────────────────────────────────────────────── */

const profileService = {
  getProfile,
  updateProfile,
  uploadProfileImage,
  changePassword,
};

export default profileService;