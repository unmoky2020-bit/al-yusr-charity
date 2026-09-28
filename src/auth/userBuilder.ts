/**
 * userBuilder.ts — Utility to convert a raw Laravel API user to the app's User type.
 * Extracted from AuthContext.tsx so that file only exports React components/hooks,
 * which is required for Vite Fast Refresh to work correctly.
 */
import { LaravelUser } from "@/data/laravelApi";

export type Role = "admin" | "editor" | "caseworker" | "case_manager" | "volunteer" | "delegate" | "donor";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  roles: Role[];
  avatar?: string;
  createdAt: string;
  volunteerStatus?: "pending" | "approved" | "rejected" | "suspended";
  skills?: string[];
  city?: string;
  bio?: string;
  assignedProgram?: string;
  permissions?: string[];
  totalDonated?: number;
  donationsCount?: number;
  preferredProgram?: string;
}

const normalizeRole = (r: string): Role => {
  const lower = String(r).toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (lower.includes("admin") || lower === "super_admin") return "admin";
  if (lower.includes("editor") || lower === "content_editor") return "editor";
  if (lower.includes("case") || lower === "case_manager") return "case_manager";
  if (lower.includes("volunteer")) return "volunteer";
  if (lower.includes("delegate")) return "delegate";
  return "donor";
};

export function buildUserFromLaravel(lUser: LaravelUser): User {
  const rawRoles: string[] = [];
  if (Array.isArray(lUser.roles)) {
    lUser.roles.forEach((item) => {
      if (typeof item === "string") rawRoles.push(item);
      else if (item && typeof item === "object") {
        if (item.slug) rawRoles.push(item.slug);
        else if (item.name) rawRoles.push(item.name);
      }
    });
  }
  if (lUser.role) {
    rawRoles.push(lUser.role);
  }
  if (rawRoles.length === 0) {
    if (lUser.email?.toLowerCase().includes("admin")) rawRoles.push("admin");
    else if (lUser.email?.toLowerCase().includes("editor")) rawRoles.push("editor");
    else rawRoles.push("donor");
  }

  const mappedRoles = Array.from(new Set(rawRoles.map(normalizeRole)));

  return {
    id: String(lUser.id),
    name: lUser.name || (lUser.email ? lUser.email.split("@")[0] : "مستخدم"),
    email: lUser.email || "",
    phone: lUser.phone || undefined,
    roles: mappedRoles.length ? mappedRoles : ["donor"],
    avatar: lUser.avatar || undefined,
    createdAt: lUser.created_at ? lUser.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}
