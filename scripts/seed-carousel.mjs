/**
 * seed-carousel.mjs
 * Populates the Laravel backend carousel with correct donate_url per entity.
 * Usage: node scripts/seed-carousel.mjs [--clear] [--dry-run]
 */

const API_BASE =
  process.env.VITE_API_BASE_URL ||
  process.env.API_BASE_URL ||
  'https://api.elyusr.org/api/v1';

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@alyusr.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const DRY_RUN = process.argv.includes('--dry-run');
const CLEAR   = process.argv.includes('--clear');

const CAROUSEL_ITEMS = [
  // PROGRAMS
  { source_type: 'program',  source_slug: 'general',  title_ar: 'تبرع عام',                              title_en: 'General Donation',                     description_ar: 'صدقة عامة توجه للأشد احتياجاً والأكثر إلحاحاً',                          description_en: 'General charity for the most needy',                              donate_url: '/donate?program=general',           details_url: '/programs',          image: 'src/assets/brand-poster-frame.jpg', price_from: 50,   sort_order: 1,  is_active: true },
  { source_type: 'program',  source_slug: 'inqadh',   title_ar: 'إنقاذ — حالات الطوارئ العاجلة',          title_en: 'Inqadh — Emergency Response',          description_ar: 'استجابة فورية للحالات الإنسانية العاجلة التي لا تحتمل التأخير',       description_en: 'Immediate response to urgent humanitarian cases',                  donate_url: '/donate?program=inqadh',            details_url: '/programs/inqadh',   image: 'src/assets/brand-poster-frame.jpg', price_from: 100,  sort_order: 2,  is_active: true },
  { source_type: 'program',  source_slug: 'orphans',  title_ar: 'كفالة الأيتام',                          title_en: 'Orphan Sponsorship',                   description_ar: 'كن رفيق النبي صلى الله عليه وسلم في الجنة بكفالة يتيم شاملة',        description_en: "Be the Prophet's companion — full orphan sponsorship",            donate_url: '/donate?program=orphans&amount=150', details_url: '/programs/orphans',  image: 'src/assets/program-orphans.jpg',    price_from: 150,  sort_order: 3,  is_active: true },
  { source_type: 'program',  source_slug: 'box',      title_ar: 'كفالة شهرية — رعاية أسرية مستدامة',     title_en: 'Monthly Family Care',                  description_ar: 'كفالة منتظمة للأسر المحتاجة توفر الغذاء والدواء والستر بشكل شهري', description_en: 'Regular sponsorship providing food, medicine and shelter monthly', donate_url: '/donate?program=box&amount=200',     details_url: '/programs/box',      image: 'src/assets/program-food-new.jpg',   price_from: 200,  sort_order: 4,  is_active: true },
  { source_type: 'program',  source_slug: 'shelter',  title_ar: 'برنامج ستر — تسقيف وترميم المنازل',     title_en: 'Sitr Shelter Program',                 description_ar: 'من ستر مسلماً ستره الله — برنامج حماية الأسرة من البرد والحر',      description_en: 'Whoever shields a Muslim, Allah will shield him',                  donate_url: '/donate?program=shelter&amount=500', details_url: '/programs/shelter',  image: 'src/assets/brand-poster-frame.jpg', price_from: 500,  sort_order: 5,  is_active: true },
  { source_type: 'program',  source_slug: 'water',    title_ar: 'وصلة المياة — مياه نقية لكل بيت',       title_en: 'Water Connection',                     description_ar: 'أفضل الصدقة سقي الماء — إيصال المياه النقية لبيوت المحرومين',      description_en: 'Best charity is giving water — clean water to deprived homes',    donate_url: '/donate?program=water&amount=300',   details_url: '/programs/water',    image: 'src/assets/program-water-new.jpg',  price_from: 300,  sort_order: 6,  is_active: true },
  { source_type: 'program',  source_slug: 'box',      title_ar: 'ذبائح شهرية — لحوم طازجة لكل أسرة',     title_en: 'Monthly Meat',                         description_ar: 'توزيع لحوم طازجة شهريا للأسر المحتاجة التي لا تقدر على اللحم',    description_en: 'Monthly distribution of fresh meat to needy families',            donate_url: '/donate?program=box&amount=200',     details_url: '/programs/box',      image: 'src/assets/program-food.jpg',       price_from: 200,  sort_order: 7,  is_active: true },
  { source_type: 'program',  source_slug: 'education',title_ar: 'تحفيظ القرآن الكريم',                   title_en: 'Quran Memorization',                   description_ar: 'رعاية حلقات التحفيظ ودعم المعلمين والطلاب لحفظ كتاب الله',         description_en: 'Supporting Quran memorization circles and teachers',               donate_url: '/donate?program=education&amount=100',details_url: '/programs/education',image: 'src/assets/poster-education.png',   price_from: 100,  sort_order: 8,  is_active: true },
  { source_type: 'program',  source_slug: 'treatment', title_ar: 'سيارات تكريم الإنسان',                 title_en: 'Dignity Transport',                    description_ar: 'نقل الموتى وتكريم الإنسان مجاناً لوجه الله لغير القادرين',          description_en: 'Free transport of deceased for Allah\'s sake',                    donate_url: '/donate?program=treatment&amount=100',details_url: '/programs/treatment',image: 'src/assets/program-health.png',     price_from: 100,  sort_order: 9,  is_active: true },
  // PROJECTS
  { source_type: 'project',  source_slug: 'waqf',     title_ar: 'المزرعة الوقفية — وقف إنتاجي',          title_en: 'Endowment Farm — Productive Waqf',     description_ar: 'صدقة جارية مستدامة تدر أثراً وتمويلاً خيرياً دائماً',               description_en: 'Sustainable ongoing charity generating perpetual impact',          donate_url: '/donate?project=waqf&amount=500',   details_url: '/projects/waqf',     image: 'src/assets/brand-poster-frame.jpg', price_from: 500,  sort_order: 10, is_active: true },
  { source_type: 'project',  source_slug: 'medical',  title_ar: 'المجمعات الطبية — رعاية صحية شاملة',    title_en: 'Medical Complexes',                    description_ar: 'كشوفات طبية وأدوية شهرية وعمليات وأطراف صناعية لغير القادرين',    description_en: 'Checkups, medications, surgeries and prosthetics for the unable', donate_url: '/donate?project=medical&amount=200', details_url: '/projects/medical',  image: 'src/assets/program-health.png',     price_from: 200,  sort_order: 11, is_active: true },
  // CAMPAIGNS
  { source_type: 'campaign', source_slug: 'markoun',  title_ar: 'حملة مركون — كنزك المركون حياة لغيرك', title_en: 'Markoun — Your Items Build a Life',    description_ar: 'تبرع بأثاثك وأجهزتك القديمة وملابسك وكتبك لنوزعها على المحتاجين', description_en: 'Donate old furniture, appliances, clothes and books',             donate_url: '/donate?campaign=markoun&amount=100',details_url: '/campaigns/markoun', image: 'src/assets/markoun-poster-furniture.png', price_from: 100, sort_order: 12, is_active: true },
  { source_type: 'campaign', source_slug: 'dhill',    title_ar: 'حملة ظل — بنية تحتية ومياه للمحرومين', title_en: 'Dhill — Infrastructure & Water',       description_ar: 'وصلات مياه وأسقف وخطوط مياه وسقيا ماء وبنية أساسية للأسر المحرومة',description_en: 'Water connections, roofing and infrastructure for deprived families',donate_url: '/donate?campaign=dhill&amount=300',  details_url: '/campaigns/dhill',   image: 'src/assets/program-water-new.jpg',  price_from: 300,  sort_order: 13, is_active: true },
  { source_type: 'campaign', source_slug: 'shelter',  title_ar: 'حملة ستر — تسقيف وأثاث ومراتب وإيواء', title_en: 'Sitr — Roofing, Furniture & Shelter', description_ar: 'أسقف منازل وتوفير مراتب ولحاف وأثاث منزلي للأسر الأكثر حرماناً',  description_en: 'Home roofing, mattresses, blankets, and furniture for the deprived',donate_url: '/donate?campaign=shelter&amount=200', details_url: '/campaigns/shelter', image: 'src/assets/brand-poster-frame.jpg', price_from: 200,  sort_order: 14, is_active: true },
  { source_type: 'campaign', source_slug: 'athar',    title_ar: 'حملة أثر — كفالة تعليمية للطلاب',      title_en: 'Athar — Educational Sponsorship',      description_ar: 'زي مدرسي وشنطة وأدوات مدرسية ومصاريف دراسية للطلاب العاجزين',     description_en: 'School uniforms, bags, supplies and fees for students in need',   donate_url: '/donate?campaign=athar&amount=100',  details_url: '/campaigns/athar',   image: 'src/assets/poster-education.png',   price_from: 100,  sort_order: 15, is_active: true },
  { source_type: 'campaign', source_slug: 'ramadan',  title_ar: 'موسم رمضان — إفطار وخير وزكاة',        title_en: 'Ramadan Season',                       description_ar: 'من فطر صائماً كان له مثل أجره — إفطار وكرتونة الخير وزكاة الفطر', description_en: 'Whoever feeds a faster gets the same reward',                      donate_url: '/donate?campaign=ramadan&amount=40', details_url: '/campaigns/ramadan', image: 'src/assets/poster-bride.png',       price_from: 40,   sort_order: 16, is_active: true },
  { source_type: 'program',  source_slug: 'odhya',    title_ar: 'موسم الأضاحي — صك الأضحية',            title_en: 'Eid Al-Adha — Qurbani Voucher',        description_ar: 'الوحيدون في مصر بضمان جودة اللحم والتوزيع الموثق لمستحقيه',        description_en: 'Only ones in Egypt guaranteeing Qurbani quality',                 donate_url: '/donate?program=odhya',             details_url: '/programs/odhya',    image: 'src/assets/poster-odhya.png',       price_from: 1400, sort_order: 17, is_active: true },
];

async function apiCall(method, path, body, token) {
  const url = `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch {}
  if (!res.ok) throw new Error(`[${method} ${path}] HTTP ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

(async () => {
  console.log('\n🚀  Al-Yusr Carousel Seeder | API:', API_BASE);
  console.log('    Mode:', DRY_RUN ? 'DRY-RUN' : 'LIVE', '| Clear:', CLEAR ? 'YES' : 'NO');

  if (DRY_RUN) {
    CAROUSEL_ITEMS.forEach((item, i) => console.log(`  ${i + 1}. [${item.source_type}] ${item.title_ar} => ${item.donate_url}`));
    console.log('\n✅  Dry-run complete.\n'); return;
  }

  if (!ADMIN_PASSWORD) {
    console.log('ℹ️  ADMIN_PASSWORD not set. Running in dry-run mode by default:');
    CAROUSEL_ITEMS.forEach((item, i) => console.log(`  ${i + 1}. [${item.source_type}] ${item.title_ar} => ${item.donate_url}`));
    return;
  }

  const loginRes = await apiCall('POST', '/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  const token = loginRes?.data?.token || loginRes?.token;
  if (!token) { console.error('❌  No token in response:', JSON.stringify(loginRes)); process.exit(1); }
  console.log('✅  Logged in\n');

  let existing = [];
  try { existing = (await apiCall('GET', '/admin/homepage/carousel', null, token))?.data?.items || []; } catch {}

  if (CLEAR) {
    for (const item of existing) {
      try {
        await apiCall('DELETE', `/admin/homepage/carousel/items/${item.id}`, null, token);
        console.log(`  🗑  Deleted #${item.id}`);
      } catch (e) {
        console.warn(`  ⚠️  Delete #${item.id} failed:`, e.message);
      }
    }
    existing = [];
  }

  let ok = 0, fail = 0;
  for (const item of CAROUSEL_ITEMS) {
    const payload = {
      title_ar: item.title_ar,
      title_en: item.title_en,
      description_ar: item.description_ar,
      description_en: item.description_en,
      image: item.image,
      link_url: item.details_url,
      sort_order: item.sort_order,
      is_active: item.is_active,
    };
    try {
      await apiCall('POST', '/admin/homepage/carousel/items', payload, token);
      console.log(`  ✅  Added: ${item.title_ar}`);
      ok++;
    } catch (e) {
      console.error(`  ❌  Failed: ${item.title_ar} -`, e.message);
      fail++;
    }
  }

  console.log(`\n🎉  Finished: ${ok} added, ${fail} failed.\n`);
})();
