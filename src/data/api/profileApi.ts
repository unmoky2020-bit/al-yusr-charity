/**
 * The signed-in person's own account (backend bundle 9 Nov 2026, routes/api-2026-11-09.php):
 *   GET    /profile          → { user }
 *   PUT    /profile          { name, email, phone, bio, city, governorate, job_title, preferences } → { data: user }
 *   POST   /profile/avatar   multipart `avatar` (jpg/png/webp ≤ 4 MB) → { data: user }
 *   DELETE /profile/avatar   → { data: user }
 * Volunteer admin updates: PUT /volunteers/{id} { status, program_slug, permissions[] }.
 */
import type { LaravelUser, LaravelVolunteer, ProfilePreferences } from "@/data/laravelApi";
import { invalidateApiCache } from "@/data/laravelApi";
import { sendJson } from "./adminApiHelpers";

export interface ProfilePatch {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  city?: string;
  governorate?: string;
  job_title?: string;
  preferences?: ProfilePreferences;
}

type UserReply = (LaravelUser & { user?: LaravelUser; data?: LaravelUser }) | null;

/** The user inside any of the backend's reply shapes ({data}, {user} or the user itself). */
const userOf = (res: UserReply): LaravelUser | null =>
  (res && (res.data || res.user || (res.id ? res : null))) || null;

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
  /** PUT /profile. Throws on failure; returns the updated user. */
  async update(patch: ProfilePatch): Promise<LaravelUser | null> {
    const res = await sendJson<UserReply>("/profile", "PUT", clean(patch));
    invalidateApiCache("/profile");
    return userOf(res);
  },

  /** POST /profile/avatar. The caller compresses the photo first. Returns the updated user. */
  async uploadAvatar(file: Blob, fileName = "avatar.jpg"): Promise<LaravelUser | null> {
    const fd = new FormData();
    fd.append("avatar", file, (file as File).name || fileName);
    const res = await sendJson<UserReply>("/profile/avatar", "POST", fd);
    invalidateApiCache("/profile");
    return userOf(res);
  },

  /** DELETE /profile/avatar → back to the initial-letter avatar. */
  async removeAvatar(): Promise<LaravelUser | null> {
    const res = await sendJson<UserReply>("/profile/avatar", "DELETE");
    invalidateApiCache("/profile");
    return userOf(res);
  },
};

export const volunteerAdminApi = {
  /** PUT /volunteers/{id}. Throws on failure. */
  update(id: string | number, patch: VolunteerAdminPatch) {
    return sendJson<LaravelVolunteer>(`/volunteers/${id}`, "PUT", clean(patch));
  },
};
