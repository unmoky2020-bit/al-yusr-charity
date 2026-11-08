/**
 * Changes an editor sends are held by the server for an admin's approval: the editor.approval
 * middleware stores a content change request (method, route_uri, payload) and answers 202 instead
 * of saving. apiFetch reports every held write here; one listener shows the notice, and pages can
 * tell a held save from a real one with heldWritesCount().
 */
export const PENDING_APPROVAL_EVENT = "content:pending-approval";

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => !!v && typeof v === "object" && !Array.isArray(v);
const isPendingRequest = (v: unknown): boolean =>
  isObject(v) && typeof v.route_uri === "string" && (v.status === undefined || v.status === "pending");

/** True for the answer to a write the server kept for review instead of applying it. */
export function isHeldForApproval(status: number, body: unknown): boolean {
  if (status === 202) return true;
  if (!isObject(body)) return false;
  return [body, body.data, body.request, body.change_request, body.content_change_request].some(isPendingRequest);
}

let held = 0;

/** How many writes the server has held for review since the page loaded. */
export const heldWritesCount = (): number => held;

export function announceHeldWrite(body: unknown): void {
  held += 1;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(PENDING_APPROVAL_EVENT, { detail: body }));
}
