import { apiFetch } from "./api";

export const getEmployeeLedger = (userSchoolId) => {
  return apiFetch(`/ledger/${userSchoolId}`);
};

export const addEarnedCredit = (userSchoolId, payload) => {
  return apiFetch(`/ledger/${userSchoolId}/earned-credit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const createBeginningBalance = (userSchoolId, payload) => {
  return apiFetch(`/ledger/${userSchoolId}/beginning-balance`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateLedgerTransaction = (transactionId, payload) => {
  return apiFetch(`/ledger/transactions/${transactionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};