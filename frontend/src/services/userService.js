import { apiFetch } from "./api";

export const getUsers = () => {
  return apiFetch("/users");
};

export const createUser = (payload) => {
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateUser = (id, payload) => {
  return apiFetch(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deactivateUser = (id) => {
  return apiFetch(`/users/${id}/deactivate`, {
    method: "PATCH",
  });
};

export const activateUser = (id) =>
  apiFetch(`/users/${id}/activate`, {
    method: "PATCH",
  });

export const resetUserPassword = (id, payload) => {
  return apiFetch(`/users/${id}/reset-password`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};