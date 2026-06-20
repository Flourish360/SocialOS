import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

// Extracts a human-readable message from an axios error, including network failures.
export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return "Cannot reach the server. Check your connection or the API URL.";
    }
    const detail = err.response.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  }
  return fallback;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }).then((r) => r.data),
  register: (email: string, password: string, full_name: string) =>
    api.post("/auth/register", { email, password, full_name }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const analyticsApi = {
  summary: () => api.get("/analytics/summary").then((r) => r.data),
  platforms: () => api.get("/analytics/platforms").then((r) => r.data),
  engagementSeries: (days = 30) => api.get(`/analytics/engagement-series?days=${days}`).then((r) => r.data),
  followerSeries: (days = 30) => api.get(`/analytics/follower-series?days=${days}`).then((r) => r.data),
  heatmap: () => api.get("/analytics/heatmap").then((r) => r.data),
  ask: (question: string) => api.post("/analytics/ask", { question }).then((r) => r.data),
};

export const postsApi = {
  list: (status?: string) => api.get(`/posts${status ? `?status=${status}` : ""}`).then((r) => r.data),
  create: (body: Record<string, unknown>) => api.post("/posts", body).then((r) => r.data),
  update: (id: string, body: Record<string, unknown>) => api.patch(`/posts/${id}`, body).then((r) => r.data),
  delete: (id: string) => api.delete(`/posts/${id}`).then((r) => r.data),
  analytics: (id: string) => api.get(`/posts/${id}/analytics`).then((r) => r.data),
  addToQueue: (body: Record<string, unknown>) => api.post("/posts/queue", body).then((r) => r.data),
  retry: (id: string) => api.post(`/posts/${id}/retry`).then((r) => r.data),
};

export const accountsApi = {
  list: () => api.get("/accounts").then((r) => r.data),
  oauthUrl: (platform: string) => api.get(`/oauth/${platform}/url`).then((r) => r.data),
  disconnect: (id: string) => api.delete(`/accounts/${id}`),
};

export const aiApi = {
  generateCaption: (body: Record<string, unknown>) => api.post("/ai/generate-caption", body).then((r) => r.data),
  rewrite: (body: Record<string, unknown>) => api.post("/ai/rewrite", body).then((r) => r.data),
  hashtags: (body: Record<string, unknown>) => api.post("/ai/hashtags", body).then((r) => r.data),
  sentiment: (text: string) => api.post("/ai/analyze-sentiment", { text }).then((r) => r.data),
  bestTime: (platform: string) => api.get(`/ai/best-time?platform=${platform}`).then((r) => r.data),
  captions: (body: Record<string, unknown>) => api.post("/ai/captions", body).then((r) => r.data),
  chat: (message: string, history: { role: string; content: string }[]) =>
    api.post("/ai/chat", { message, history }).then((r) => r.data),
};

export const mediaApi = {
  list: () => api.get("/media").then((r) => r.data),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/media/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },
  delete: (id: string) => api.delete(`/media/${id}`).then((r) => r.data),
};

export const automationApi = {
  rules: () => api.get("/automation/rules").then((r) => r.data),
  createRule: (body: Record<string, unknown>) => api.post("/automation/rules", body).then((r) => r.data),
  toggleRule: (id: string) => api.patch(`/automation/rules/${id}/toggle`).then((r) => r.data),
  inbox: (priority?: string) => api.get(`/automation/inbox${priority ? `?priority=${priority}` : ""}`).then((r) => r.data),
  reply: (id: string, text: string) => api.post(`/automation/inbox/${id}/reply`, { text }).then((r) => r.data),
  competitors: () => api.get("/automation/competitors").then((r) => r.data),
};

export default api;
