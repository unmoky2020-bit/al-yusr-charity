/**
 * Own profile + volunteer admin updates — replaces the no-op functions in AuthContext.
 *
 * EXISTING (Postman): GET /profile, PUT /users/{id}, GET/POST /volunteers
 * PROPOSED / to confirm:
 *   PUT /profile                 { name, email, phone, bio, city }  → updated user
 *   PUT /volunteers/{id}         { status, program_slug, permissions[] } (new columns: program_slug, permissions)
 * See backend-handoff/02-replace-supabase-admin.md.
 */
import type { LaravelUser, LaravelVolunteer } from "@/data/laravelApi";
import { sendJson } from "./adminApiHelpers";

export interface ProfilePatch {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  city?: string;
}

export interface VolunteerAdminPatch {
  status?: "pending" | "approved" | "rejected" | "suspended" | string;
  /** Slug of the program the volunteer is assigned to (frontend programs list). */
  program_slug?: string | null;
  /** Fine-grained volunteer permissions (see src/auth/permissions.ts). */
  permissions?: string[];
}

const clean = <T extends object>(o: T): Partial<T> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

export const profileApi = {
  /** PUT /profile. Throws on failure; returns the updated user when the backend sends it back. */
  update(patch: ProfilePatch) {
    return sendJson<(LaravelUser & { user?: LaravelUser }) | null>("/profile", "PUT", clean(patch)).then(
      (res) => (res && "user" in res && res.user ? res.user : res) as LaravelUser | null,
    );
  },
};

export const volunteerAdminApi = {
  /** PUT /volunteers/{id}. Throws on failure. */
  update(id: string | number, patch: VolunteerAdminPatch) {
    return sendJson<LaravelVolunteer>(`/volunteers/${id}`, "PUT", clean(patch));
  },
};
