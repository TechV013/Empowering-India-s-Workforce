// Copy this file into your friend's React frontend, e.g. src/api.js

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("worknext_token");
}

async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const registerUser = (payload) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const loginUser = async (payload) => {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  localStorage.setItem("worknext_token", data.token);
  localStorage.setItem("worknext_user", JSON.stringify(data.user));

  return data;
};

export const logoutUser = () => {
  localStorage.removeItem("worknext_token");
  localStorage.removeItem("worknext_user");
};

export const getCurrentUser = () => request("/auth/me");

export const getJobs = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/jobs${query ? `?${query}` : ""}`);
};

export const getJob = (id) => request(`/jobs/${id}`);

export const createJob = (payload) =>
  request("/jobs", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const updateJob = (id, payload) =>
  request(`/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

export const deleteJob = (id) =>
  request(`/jobs/${id}`, {
    method: "DELETE"
  });

export const getProfile = () => request("/profile");

export const updateProfile = (payload) =>
  request("/profile", {
    method: "PUT",
    body: JSON.stringify(payload)
  });

export const applyForJob = (jobId) =>
  request(`/applications/${jobId}`, {
    method: "POST"
  });

export const getMyApplications = () =>
  request("/applications/my");

export const updateApplication = (id, status) =>
  request(`/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });

export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append("resume", file);

  return request("/resumes", {
    method: "POST",
    body: formData
  });
};

export const getResumes = () => request("/resumes");

export const deleteResume = (id) =>
  request(`/resumes/${id}`, {
    method: "DELETE"
  });

export const saveJob = (jobId) =>
  request(`/saved-jobs/${jobId}`, {
    method: "POST"
  });

export const unsaveJob = (jobId) =>
  request(`/saved-jobs/${jobId}`, {
    method: "DELETE"
  });

export const getSavedJobs = () =>
  request("/saved-jobs");
