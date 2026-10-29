/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DonationRecord, DonationStatus } from "./donationsStore";

/**
 * Convert a donation returned by the backend (e.g. GET /donations/track/{ref}) into the
 * DonationRecord shape used by the receipt and the thank-you screen. Shared by the
 * tracking page and the donate page.
 */
export const mapStatus = (s: string): DonationStatus => {
  const norm = String(s || "").toLowerCase();
  return norm === "paid" || norm === "completed" || norm === "succeeded" || norm === "success" || norm === "approved"
    ? "completed"
    : norm === "failed" || norm === "cancelled" || norm === "canceled" || norm === "refunded"
    ? "failed"
    : "pending";
};

/** Convert a raw Laravel donation object to a DonationRecord */
export const fromLaravelRow = (row: any): DonationRecord => {
  const methodVal =
    row.payment_method?.name_ar ||
    row.payment_method?.slug ||
    (typeof row.payment_method === "string" ? row.payment_method : null) ||
    row.method ||
    "تحويل بنكي";

  const programName =
    row.program?.name_ar ||
    row.program?.title_ar ||
    row.project?.name_ar ||
    row.project?.name ||
    row.donation_campaign?.title_ar ||
    row.donation_package?.name_ar ||
    row.message ||
    row.note ||
    "تبرع عام للمؤسسة";

  let targetType = "تبرع عام";
  if (row.case) targetType = "حالة إنسانية";
  else if (row.project) targetType = "مشروع تنموي";
  else if (row.program) targetType = "برنامج خيري";
  else if (row.donation_campaign) targetType = "حملة خيرية";

  const rawItems = Array.isArray(row.items) && row.items.length > 0 ? row.items : [];
  const items = rawItems.length > 0
    ? rawItems.map((it: any) => ({
        title: it.title || it.name || it.item_name || it.program_name || it.description || programName,
        category: it.category || it.type || targetType,
        quantity: Number(it.quantity || it.qty || 1),
        amount: Number(it.amount || it.total || it.price || 0),
        unit_price: Number(it.unit_price || it.price || 0),
      }))
    : [
        {
          title: programName,
          category: targetType,
          quantity: 1,
          amount: Number(row.amount || 0),
        },
      ];

  const notesText = row.notes || row.note || row.message || row.donor_notes || "";

  return {
    ref: row.transaction_reference || row.code || row.reference_code || row.ref_code || String(row.id || ""),
    donor: {
      name:  row.donor_name  || row.donor?.name  || "متبرع فاعل خير",
      email: row.donor_email || row.donor?.email || "",
      phone: row.donor_phone || row.donor?.phone || "",
    },
    amount:       Number(row.amount || 0),
    program:      row.program?.slug || row.project?.slug || row.category_id || row.program || "general",
    programLabel: programName,
    method:       methodVal as any,
    status:       mapStatus(row.payment_status || row.status || "pending"),
    createdAt:    row.created_at || new Date().toISOString(),
    updatedAt:    row.updated_at || row.created_at || new Date().toISOString(),
    items,
    notes:        notesText,
    note:         notesText,
    targetType,
  };
};
