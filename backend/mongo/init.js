// Run with: mongosh "$MONGO_URI/$MONGO_DB" backend/mongo/init.js
const cats = [
  ['medical-devices','حالات أجهزة طبية','Medical devices','Stethoscope',1],
  ['medication','حالات علاج دوائي','Medication','Pill',2],
  ['debt','حالات سداد ديون','Debt relief','Banknote',3],
  ['marriage','حالات تيسير الزواج','Marriage assistance','Heart',4],
  ['medical-sessions','حالات جلسات طبية','Medical sessions','Activity',5],
  ['prosthetics','حالات أطراف صناعية','Prosthetics','Accessibility',6],
  ['irregular-medical','حالات خدمات طبية غير منتظمة','Irregular medical care','HeartPulse',7],
  ['surgery','حالات عمليات جراحية','Surgery','Scissors',8],
  ['monthly-sponsorship','حالات كفالة شهرية','Monthly sponsorship','CalendarHeart',9],
  ['medical-supplies','حالات مستلزمات طبية','Medical supplies','Package',10],
  ['small-projects','حالات مشاريع صغيرة','Small projects','Briefcase',11],
];

db.case_categories.createIndex({ slug: 1 }, { unique: true });
db.cases.createIndex({ ref_code: 1 }, { unique: true });
db.cases.createIndex({ status: 1 });
db.cases.createIndex({ category_id: 1 });
db.case_updates.createIndex({ case_id: 1 });
db.donations.createIndex({ ref_code: 1 }, { unique: true });
db.donations.createIndex({ donor_id: 1 });
db.donations.createIndex({ case_id: 1 });
db.users.createIndex({ email: 1 }, { unique: true });
db.user_roles.createIndex({ user_id: 1, role: 1 }, { unique: true });

for (const [slug, ar, en, icon, sort] of cats) {
  db.case_categories.updateOne(
    { slug },
    { $setOnInsert: { slug, name_ar: ar, name_en: en, icon, sort_order: sort, active: true, created_at: new Date() } },
    { upsert: true }
  );
}
print('✅ Mongo seeded — categories: ' + db.case_categories.countDocuments());