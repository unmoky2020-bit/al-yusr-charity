import type { Role } from "./AuthContext";

type MinimalSession = {
  user: {
    id: string;
    email?: string;
    created_at?: string;
  } | null;
};

export const buildUserFromSession = (
  sess: MinimalSession | null,
  profile?: {
    full_name?: string | null;
    phone?: string | null;
    city?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    skills?: string[] | null;
    preferred_program?: string | null;
    total_donated?: number | null;
    donations_count?: number | null;
    created_at?: string | null;
  },
  roleRows?: Array<{ role?: string | null }> | null,
) => {
  if (!sess?.user) {
    return null;
  }

  const uid = sess.user.id;
  const roles = (roleRows ?? []).map((r) => r.role).filter(Boolean) as Role[];

  return {
    id: uid,
    email: sess.user.email ?? "",
    name: profile?.full_name || (sess.user.email?.split("@")[0] ?? ""),
    phone: profile?.phone ?? undefined,
    city: profile?.city ?? undefined,
    bio: profile?.bio ?? undefined,
    avatar: profile?.avatar_url ?? undefined,
    skills: profile?.skills ?? [],
    preferredProgram: profile?.preferred_program ?? undefined,
    totalDonated: Number(profile?.total_donated ?? 0),
    donationsCount: profile?.donations_count ?? 0,
    roles: roles.length ? roles : ["donor"],
    createdAt: profile?.created_at?.slice(0, 10) ?? sess.user.created_at?.slice(0, 10) ?? "",
  };
};
