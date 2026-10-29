// Create the cases embedded in src/data/donationEntities.ts as TEST cases on the live API, each linked
// to its real program / project / campaign. Every title starts with "[تجريبية]"; ids are logged so
// `node testCases.js --delete` removes exactly these rows.
const fs = require("fs");
const { call } = require("./api");

const LOG = "C:/Users/eldak/Al-Yusr/backend-handoff/test-cases-2026-10-29.json";
const PREFIX = "[تجريبية] ";

// static entity id -> backend link + case category id (4 medical, 5 food, 6 education, 7 housing,
// 8 bride, 9 orphans, 10 water, 11 debts, 12 emergency)
const LINKS = {
  general: { program_id: 43, category_id: 12 },
  orphans: { program_id: 41, category_id: 9 },
  water: { program_id: 37, category_id: 10 },
  waqf: { project_id: 26, category_id: 10 },
  medical: { project_id: 27, category_id: 4 },
  markoun: { donation_campaign_id: 19, category_id: 7 },
  dhill: { donation_campaign_id: 17, category_id: 10 },
  shelter: { donation_campaign_id: 18, category_id: 7 },
  athar: { donation_campaign_id: 21, category_id: 6 },
  ramadan: { donation_campaign_id: 20, category_id: 5 },
  odhya: { program_id: 35, category_id: 5 },
};

async function create() {
  const entities = require("./entities.json");
  const created = [];
  for (const e of entities) {
    const link = LINKS[e.id];
    if (!link) continue; // entity no longer exists on the backend
    for (const c of e.cases) {
      const r = await call("POST", "/cases", {
        code: c.ref,
        title: PREFIX + c.t,
        beneficiary_name: c.b,
        governorate: "الدقهلية",
        city: c.city || null,
        target_amount: c.need,
        priority: c.urgent ? "high" : "medium",
        status: "approved",
        description:
          `${c.t}.\n\nالمستفيد: ${c.b}${c.city ? ` — ${c.city}، الدقهلية` : ""}. المبلغ المطلوب ${c.need} جنيه.\n\n` +
          "⚠️ حالة تجريبية لاختبار ربط الحالات بالبرامج والمشاريع والحملات — هتتمسح قبل الإطلاق.",
        ...link,
      });
      const d = r.json?.data;
      console.log(r.status, d ? `${d.id} ${d.code} -> ${Object.keys(link).find((k) => k !== "category_id")}=${Object.values(link)[0]}` : JSON.stringify(r.json).slice(0, 180));
      if (d) created.push({ id: d.id, code: d.code, entity: e.id });
    }
  }
  fs.writeFileSync(LOG, JSON.stringify({ created_at: new Date().toISOString(), note: "test cases — delete with: node testCases.js --delete", cases: created }, null, 1));
  console.log(`created ${created.length} test cases, log: ${LOG}`);
}

async function remove() {
  const { cases } = JSON.parse(fs.readFileSync(LOG, "utf8"));
  for (const c of cases) {
    const r = await call("DELETE", `/cases/${c.id}`);
    console.log("delete", c.id, c.code, r.status);
  }
}

(process.argv.includes("--delete") ? remove() : create()).catch((e) => console.error(e));
