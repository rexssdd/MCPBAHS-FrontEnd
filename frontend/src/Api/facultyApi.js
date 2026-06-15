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