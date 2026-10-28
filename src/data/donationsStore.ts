export type DonationStatus = "pending" | "processing" | "completed" | "failed";
/**
 * Methods are now driven by the public.payment_methods table (key column),
 * so we accept any string here. Common keys: paymob_card, paymob_wallet,
 * vodafone_cash, instapay, cib, adib, bank_misr.
 */
export type DonationMethod = string;

export interface DonationRecord {
  ref: string;
  donor: { name: string; email: string; phone: string };
  amount: number;
  program: string;
  programLabel: string;
  method: DonationMethod;
  status: DonationStatus;
  createdAt: string;
  updatedAt: string;
  note?: string;
  notes?: string;
  items?: Array<{
    title: string;
    category?: string;
    quantity?: number;
    amount: number;
    unit_price?: number;
  }>;
  targetType?: string;
  targetDetails?: Record<string, any>;
  /** Data URL of the uploaded transfer receipt (manual methods) */
  receiptDataUrl?: string;
  /** Filename of the uploaded receipt (manual methods) */
  receiptFilename?: string;
}

const KEY = "alyusr_donations";

const read = (): DonationRecord[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};

const write = (list: DonationRecord[]) => {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("alyusr_donations_change"));
};

export const donationsStore = {
  all: read,
  byRef: (ref: string) => read().find((d) => d.ref === ref),
  byDonor: (email: string) => read().filter((d) => d.donor.email.toLowerCase() === email.toLowerCase()),
  create: (rec: Omit<DonationRecord, "ref" | "createdAt" | "updatedAt" | "status"> & { ref?: string; status?: DonationStatus }): DonationRecord => {
    const now = new Date().toISOString();
    const ref = rec.ref || ("ALY-" + Date.now().toString(36).toUpperCase());
    const full: DonationRecord = { ref, status: rec.status ?? "pending", createdAt: now, updatedAt: now, ...rec } as DonationRecord;
    write([full, ...read().filter((x) => x.ref !== ref)]);
    return full;
  },
  add: (rec: any): DonationRecord => {
    return donationsStore.create(rec);
  },
  update: (ref: string, patch: Partial<DonationRecord>) => {
    const list = read().map((d) => (d.ref === ref ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d));
    write(list);
    return list.find((d) => d.ref === ref);
  },
  remove: (ref: string) => write(read().filter((d) => d.ref !== ref)),
};

/** Subscribe to changes; returns unsubscribe function */
export const subscribeDonations = (cb: () => void) => {
  const h = () => cb();
  window.addEventListener("alyusr_donations_change", h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener("alyusr_donations_change", h);
    window.removeEventListener("storage", h);
  };
};
