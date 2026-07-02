import api from "./api";

// Fetches a binary endpoint through the authenticated axios client (which attaches the
// Bearer token + x-selected-shop headers), avoiding tokens in the URL query string.
async function fetchBlob(path: string, params?: Record<string, unknown>): Promise<Blob> {
  const res = await api.get(path, { params, responseType: "blob" });
  const type = (res.headers?.["content-type"] as string) || "application/octet-stream";
  return new Blob([res.data], { type });
}

// Opens the fetched file in a new tab via an anchor click (not window.open, so it isn't
// caught by popup blockers the way an async window.open would be).
export async function openAuthedFile(path: string, params?: Record<string, unknown>): Promise<void> {
  const blob = await fetchBlob(path, params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// Downloads the fetched file with the given filename.
export async function downloadAuthedFile(path: string, filename: string, params?: Record<string, unknown>): Promise<void> {
  const blob = await fetchBlob(path, params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
