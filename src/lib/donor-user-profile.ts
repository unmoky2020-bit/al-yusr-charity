import { usersApi } from "@/data/laravelApi";

type DonorAccountIdentity = {
  user_id?: string | number | null;
  user?: { id?: string | number | null } | null;
  email?: string | null;
  phone?: string | null;
};

function normalizeEmail(value: string | null | undefined): string {
  return value?.trim().toLowerCase() || "";
}

function normalizePhone(value: string | null | undefined): string {
  let digits = value?.replace(/\D/g, "") || "";
  if (digits.startsWith("0020")) digits = digits.slice(4);
  else if (digits.startsWith("20") && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export async function resolveDonorUserProfileId(
  donor: DonorAccountIdentity,
): Promise<string | null> {
  const linkedId = donor.user_id ?? donor.user?.id;
  if (linkedId != null && String(linkedId).trim()) return String(linkedId);

  const email = normalizeEmail(donor.email);
  const phone = normalizePhone(donor.phone);
  if (!email && !phone) return null;

  const users = await usersApi.listAll(undefined, { useCache: false });
  const matches = users.filter((user) =>
    (email && normalizeEmail(user.email) === email) ||
    (phone && normalizePhone(user.phone) === phone)
  );
  return matches.length === 1 ? String(matches[0].id) : null;
}
