import { apiFetch } from "./client";

export async function getFaculty(params = "") {
  const res = await apiFetch(`/v1/personnels${params}`);

  return res;
}

export async function createFaculty(data) {
  const res = await apiFetch("/v1/personnels", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return res; 
}

export async function getFacultyPersonnel(uuid) {
  return apiFetch(`/v1/personnels/${uuid}`);
}

export async function updateFaculty(uuid, data) {
  return apiFetch(`/v1/personnels/${uuid}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteFaculty(uuid) {
  return apiFetch(`/v1/personnels/${uuid}`, {
    method: "DELETE",
  });
}

export async function getArchivedFaculty(params = "") {
  const res = await apiFetch(`/v1/personnels/archived${params}`);

  return res;
}

export async function restoreArchivedFaculty(uuid) {
  return apiFetch(`/v1/personnels/${uuid}/restore`, {
    method: "PATCH",
  });
}

/**
 * Upload (or replace) a personnel's profile photo so it shows on the
 * public homepage Faculty section. Uses FormData directly (instead of
 * apiFetch's JSON-only headers) so the browser sets the multipart
 * boundary correctly.
 */
export async function uploadFacultyPhoto(uuid, file) {
  const { authHeaders } = await import("../utils/authToken");
  const formData = new FormData();
  formData.append("photo", file);

  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
  const headers = authHeaders({ Accept: "application/json" }, false);

  const response = await fetch(`${API_URL}/v1/personnels/${uuid}/photo`, {
    method: "POST",
    headers,
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body?.message || message;
    } catch {
      // ignore parse failure
    }
    throw new Error(message);
  }

  return response.json();
}