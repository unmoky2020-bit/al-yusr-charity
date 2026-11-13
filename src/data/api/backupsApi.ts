/** «النسخ الاحتياطية» (backend bundle deploy-2026-11-13h-backups-perf). Super admin only. */
import { API_BASE_URL, ApiError, apiFetch, getApiToken } from "@/data/laravelApi";

export type BackupStatus = "requested" | "running" | "done" | "failed" | "pruned";
export interface BackupRun {
  id: number;
  kind: "db" | "full";
  status: BackupStatus;
  trigger: "schedule" | "dashboard" | "deploy";
  file: string | null;
  size: number | null;
  summary: { tables?: number; rows?: number; files?: number | null } | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  on_server: boolean;
  parts: ("database" | "uploads")[];
}
export interface BackupsOverview {
  runs: BackupRun[];
  drive: { at: string; ok: boolean; message: string; remote: string; folders: number } | null;
  deploys: { name: string; at: string; rollback: boolean }[];
  cron_ok: boolean;
  cron_last: string | null;
  keep: { db: number; full: number };
  schedule: { db: string; full: string };
  disk_free: number | null;
  restore_cmd: string;
}

export const backupsApi = {
  async overview(): Promise<BackupsOverview> {
    const r = await apiFetch<{ data: BackupsOverview }>("/admin/backups", { useCache: false });
    return r.data;
  },
  async create(kind: "db" | "full") {
    return apiFetch<{ message: string }>("/admin/backups", { method: "POST", body: { kind } });
  },
  async remove(id: number) {
    return apiFetch<{ message: string }>(`/admin/backups/${id}`, { method: "DELETE" });
  },
  /** Downloads one part of a backup with the admin's token, then saves it. */
  async download(run: BackupRun, part: "database" | "uploads" | "manifest") {
    const token = getApiToken();
    const res = await fetch(`${API_BASE_URL}/admin/backups/${run.id}/download?part=${part}`, {
      headers: { Accept: "application/octet-stream", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) throw new ApiError("تعذر تنزيل الملف", res.status);
    const blob = await res.blob();
    const name = `${run.file}-${part === "database" ? "database.sql.gz" : part === "uploads" ? "uploads.zip" : "manifest.json"}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  },
};
