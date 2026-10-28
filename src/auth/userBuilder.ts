/**
 * userBuilder.ts — Utility to convert a raw Laravel API user to the app's User type.
 * Extracted from AuthContext.tsx so that file only exports React components/hooks,
 * which is required for Vite Fast Refresh to work correctly.
 */
import { LaravelUser } from "@/data/laravelApi";
import type { Permission } from "./permissions";

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
  permissions?: Permission[];
  totalDonated?: number;
  donationsCount?: number;
  preferredProgram?: string;
}

const KNOWN_ROLES: readonly Role[] = ["admin", "editor", "caseworker", "case_manager", "volunteer", "delegate", "donor"];

/**
 * Accept only a role the backend explicitly returned, matched exactly (case-insensitive;
 * spaces/hyphens are treated as underscores, e.g. "Case Manager" → "case_manager").
 * Anything else is ignored — roles are never inferred from substrings or e-mail addresses.
 */
/**
 * Backend role names that differ from the app's role ids, mapped explicitly (exact keys only).
 * The backend's /roles list (2026-10): "Super Admin" (super-admin), "Editor", "Volunteer", "Donor".
 */
const ROLE_ALIASES: Readonly<Record<string, Role>> = {
  super_admin: "admin",
};

const normalizeRole = (r: string): Role | null => {
  const key = String(r).toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (key in ROLE_ALIASES) return ROLE_ALIASES[key];
  return (KNOWN_ROLES as readonly string[]).includes(key) ? (key as Role) : null;
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

  // Unknown/missing roles are dropped; an empty result falls back to "donor" below.
  const mappedRoles = Array.from(
    new Set(rawRoles.map(normalizeRole).filter((r): r is Role => r !== null)),
  );

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
