import { usersApi, rolesApi, permissionsApi, LaravelUser, LaravelRole, LaravelPermission } from "@/data/laravelApi";

export type DbRole = "admin" | "case_manager" | "editor" | "volunteer" | "donor" | "delegate";

export interface AdminUserRow {
  id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  preferred_program: string | null;
  total_donated: number;
  donations_count: number;
  created_at: string;
  email?: string | null;
  roles: DbRole[];
  rawRoles?: LaravelRole[];
}

export const mapLaravelRole = (r: unknown): DbRole => {
  if (typeof r === "string") {
    const s = r.toLowerCase();
    if (s.includes("admin")) return "admin";
    if (s.includes("editor")) return "editor";
    if (s.includes("case")) return "case_manager";
    if (s.includes("volunteer")) return "volunteer";
    if (s.includes("delegate")) return "delegate";
    return "donor";
  }
  if (r && typeof r === "object" && "slug" in r) {
    return mapLaravelRole((r as { slug: string }).slug);
  }
  if (r && typeof r === "object" && "name" in r) {
    return mapLaravelRole((r as { name: string }).name);
  }
  return "donor";
};

export const ROLE_TO_LARAVEL_ID: Record<DbRole, number> = {
  admin: 1,        // Super Admin
  editor: 2,       // Editor
  volunteer: 3,    // Volunteer
  donor: 4,        // Donor
  case_manager: 2, // Editor fallback
  delegate: 3,     // Volunteer fallback
};

export async function fetchAllUsers(): Promise<AdminUserRow[]> {
  try {
    const lUsers = await usersApi.listAll();
    if (Array.isArray(lUsers) && lUsers.length > 0) {
      return lUsers.map((u: LaravelUser) => {
        const roles: DbRole[] = [];
        const rawRoles: LaravelRole[] = [];

        if (Array.isArray(u.roles)) {
          u.roles.forEach((r) => {
            roles.push(mapLaravelRole(r));
            if (typeof r === "object" && r !== null) {
              rawRoles.push(r as LaravelRole);
            }
          });
        }
        if (u.role) {
          roles.push(mapLaravelRole(u.role));
        }
        if (roles.length === 0) {
          roles.push(u.email?.includes("admin") ? "admin" : "donor");
        }

        return {
          id: String(u.id),
          full_name: u.name || (u.email ? u.email.split("@")[0] : "مستخدم"),
          email: u.email,
          phone: u.phone || null,
          city: null,
          avatar_url: u.avatar || null,
          preferred_program: null,
          total_donated: 0,
          donations_count: 0,
          created_at: u.created_at || new Date().toISOString(),
          roles: Array.from(new Set(roles)),
          rawRoles,
        };
      });
    }
  } catch (err) {
    console.warn("Could not fetch users from Laravel API:", err);
  }

  // Fallback initial admin
  return [
    {
      id: "1",
      full_name: "مدير النظام",
      email: "admin@alyusr.com",
      phone: "01000000000",
      city: "المنصورة",
      avatar_url: null,
      preferred_program: null,
      total_donated: 0,
      donations_count: 0,
      created_at: new Date().toISOString(),
      roles: ["admin"],
    },
  ];
}

export async function fetchAllRoles(): Promise<LaravelRole[]> {
  try {
    const res = await rolesApi.listAll();
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.warn("Could not fetch roles:", err);
    return [];
  }
}

export async function fetchAllPermissions(): Promise<LaravelPermission[]> {
  try {
    const res = await permissionsApi.listAll();
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.warn("Could not fetch permissions:", err);
    return [];
  }
}

export async function updateRolePermissions(
  roleId: number | string,
  permissionIds: number[],
  extra?: { name?: string; slug?: string; description?: string }
): Promise<LaravelRole> {
  return await rolesApi.updatePermissions(roleId, permissionIds, extra);
}

export async function createRole(input: {
  name: string;
  slug: string;
  description?: string;
  permission_ids?: number[];
}): Promise<LaravelRole> {
  return await rolesApi.create({
    name: input.name,
    slug: input.slug,
    description: input.description || "",
    permission_ids: input.permission_ids || [],
  } as any);
}

export async function deleteRole(roleId: number | string): Promise<void> {
  return await rolesApi.remove(roleId);
}

export async function createUser(input: {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role?: DbRole;
  role_id?: number;
}) {
  const roleId = input.role_id || ROLE_TO_LARAVEL_ID[input.role || "donor"] || 4;
  const pwd = input.password || "Password123!";
  return await usersApi.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    password: pwd,
    password_confirmation: pwd,
    status: "active",
    role_ids: [roleId],
  } as any);
}

export async function updateUser(id: string, input: {
  name?: string;
  email?: string;
  phone?: string;
  roles?: DbRole[];
  role_ids?: number[];
  status?: "active" | "inactive";
}) {
  const existing = await usersApi.get(id);
  let roleIds = input.role_ids;
  if (!roleIds && input.roles && input.roles.length > 0) {
    roleIds = input.roles.map((r) => ROLE_TO_LARAVEL_ID[r] || 4);
  }

  return await usersApi.update(id, {
    name: input.name || existing.name || "مستخدم",
    email: input.email || existing.email || "",
    phone: input.phone || existing.phone,
    status: input.status || "active",
    role_ids: roleIds ? Array.from(new Set(roleIds)) : undefined,
  } as any);
}

export async function deleteUser(id: string) {
  return await usersApi.remove(id);
}

export async function addRole(userId: string, role: DbRole) {
  try {
    const user = await usersApi.get(userId);
    const existingRoles: DbRole[] = Array.isArray(user.roles)
      ? user.roles.map(mapLaravelRole)
      : [];
    const merged = Array.from(new Set([...existingRoles, role]));
    const roleIds = merged.map((r) => ROLE_TO_LARAVEL_ID[r] || 4);

    await usersApi.update(userId, {
      name: user.name,
      email: user.email,
      status: "active",
      role_ids: roleIds,
    } as any);
  } catch (err) {
    console.warn("Could not update role on Laravel API:", err);
  }
}

export async function removeRole(userId: string, role: DbRole) {
  try {
    const user = await usersApi.get(userId);
    const existingRoles: DbRole[] = Array.isArray(user.roles)
      ? user.roles.map(mapLaravelRole)
      : [];
    const remaining = existingRoles.filter((r) => r !== role);
    const roleIds = remaining.length > 0 ? remaining.map((r) => ROLE_TO_LARAVEL_ID[r] || 4) : [4];

    await usersApi.update(userId, {
      name: user.name,
      email: user.email,
      status: "active",
      role_ids: roleIds,
    } as any);
  } catch (err) {
    console.warn("Could not remove role on Laravel API:", err);
  }
}