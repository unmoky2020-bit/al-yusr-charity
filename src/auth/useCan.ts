import { useCallback } from "react";
import { useAuth } from "@/auth/AuthContext";
import { accessAllows } from "@/auth/adminAccess";

/**
 * `can("media.view")` → true / false from the signed-in account's server permissions,
 * or undefined while they load (or when an older backend can't tell).
 * Screens use it to offer only what the account may do; the server still checks every request.
 */
export function useCan() {
  const { access } = useAuth();
  return useCallback((perm: string) => accessAllows(access, perm), [access]);
}
