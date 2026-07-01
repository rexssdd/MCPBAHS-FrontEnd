import { apiFetch } from "./client";
import { authHeaders } from "../utils/authToken";

/**
 * Admin CRUD for TVL (Technical-Vocational-Livelihood) offers, backed by
 * GET/POST/PUT/DELETE /v1/tvl-offers (role:admin). Image uploads use
 * multipart FormData with Laravel's POST + _method=PUT spoofing, since
 * browsers cannot send file bodies on a real PUT request.
 */

export async function listTvlOffers() {
  return apiFetch("/v1/tvl-offers");
}

export async function getTvlOffer(uuid) {
  return apiFetch(`/v1/tvl-offers/${uuid}`);
}

export async function deleteTvlOffer(uuid) {
  return apiFetch(`/v1/tvl-offers/${uuid}`, { method: "DELETE" });
}

/**
 * Builds the multipart FormData for create/update, including the image
 * file when one was selected.
 */
function buildTvlFormData(data, { isUpdate = false } = {}) {
  const formData = new FormData();

  if (isUpdate) formData.append("_method", "PUT");

  formData.append("title", data.title ?? "");
  formData.append("description", data.description ?? "");
  formData.append("icon", data.icon ?? "");
  formData.append("duration", data.duration ?? "");
  formData.append("display_order", String(data.display_order ?? 0));
  formData.append("is_active", data.is_active ? "1" : "0");

  (data.certifications ?? []).forEach((cert, i) => {
    formData.append(`certifications[${i}]`, cert);
  });

  (data.details ?? []).forEach((detail, i) => {
    formData.append(`details[${i}]`, detail);
  });

  if (data.image instanceof File) {
    formData.append("image", data.image);
  }

  return formData;
}

async function submitMultipart(url, method, formData) {
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
  const headers = authHeaders({ Accept: "application/json" }, false);

  const response = await fetch(`${API_URL}${url}`, {
    method,
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
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function createTvlOffer(data) {
  const formData = buildTvlFormData(data);
  return submitMultipart("/v1/tvl-offers", "POST", formData);
}

export async function updateTvlOffer(uuid, data) {
  const formData = buildTvlFormData(data, { isUpdate: true });
  return submitMultipart(`/v1/tvl-offers/${uuid}`, "POST", formData);
}