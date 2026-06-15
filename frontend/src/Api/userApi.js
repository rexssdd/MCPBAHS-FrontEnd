import { apiFetch } from "./client";

export async function getUser(params = "") {
  const res = await apiFetch(`/v1/users${params}`);

  return res;
}

export async function createUser(data) {
  const res = await apiFetch("/v1/users", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return res; 
}

export async function getUserById(uuid) {
  return apiFetch(`/v1/users/${uuid}`);
}

export async function updateUser(uuid, data) {
  return apiFetch(`/v1/users/${uuid}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(uuid) {
  return apiFetch(`/v1/users/${uuid}`, {
    method: "DELETE",
  });
}

