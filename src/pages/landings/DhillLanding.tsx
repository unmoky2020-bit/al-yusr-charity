import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import markounFurniture from "@/assets/markoun-poster-furniture.png";
import yusrWater from "@/assets/yusr-water.png";
import yusrDistribution from "@/assets/yusr-distribution-1.jpg";
import yusrMeals from "@/assets/yusr-meals.jpg";
import posterWater from "@/assets/poster-water.png";

const DhillLanding = () => (
  <CampaignLandingShell
    slug="dhill"
    path="/dhill"
    badgeAr="حملة ظِلّ — صدقة جارية وسقيا ماء"
    badgeEn="Dhill Campaign — Ongoing Charity & Water"
    titleAr="حملة ظِلّ — «نُظِلّهم اليوم عسى أن يُظِلّنا الله يوم القيامة»"
    titleEn="Dhill Campaign — 'Provide shade today, that Allah may shade us on the Day of Resurrection'"
    taglineAr="كيف ننجو من حرّ يوم القيامة؟ إذا كنا لا نتحمل حرارة الصيف في الدنيا، فكيف ننجو في الآخرة؟ جاءت حملة ظِلّ لتكون ظلاً وبرداً لأهالينا المستحقين من الفقراء والمساكين، وصدقة جارية وظلاً لك يوم القيامة."
    taglineEn="How do we find shade on the Day of Judgment? The Dhill campaign provides roofing, clean water taps, fans and cold drinks for needy families in Egypt — an ongoing charity and shade for your hereafter."
    metaDescAr="شارك في حملة ظِل مع مؤسسة اليسر: أسقف منازل خشبية معزولة، وصلات مياه نقية للمنازل (سهم 500 ج)، خطوط مياه للقرى، أبواب وشبابيك، ومراوح تبريد بالدقهلية وكفر الشيخ والشرقية وكل مصر."
    metaDescEn="Join Al-Yusr's Dhill Campaign: insulated wooden roofs, clean water connections (EGP 500 share), village water lines, doors & windows, and cooling fans across Dakahlia, Kafr El Sheikh and Egypt."
    heroImage={yusrWater}
    heroAlt="حملة ظل — وصلات مياه وأسقف خشبية ومراوح للأسر المستحقة"
    pricing={[
      { labelAr: "سهم سقف خشب معزول", labelEn: "Roofing Share", amount: 500, tagAr: "سهم الخير", tagEn: "Share" },
      { labelAr: "سهم وصلة مياه نقية", labelEn: "Water Tap Share", amount: 500, tagAr: "صدقة جارية", tagEn: "Ongoing" },
      { labelAr: "مروحة سقف / حائط للتهوية", labelEn: "Cooling Fan", amount: 950, tagAr: "تبريد بيت", tagEn: "Cooling" },
      { labelAr: "وصلة مياه منزلية كاملة", labelEn: "Full Water Connection", amount: 7500, tagAr: "شامل الموتور والخزان", tagEn: "Complete" },
      { labelAr: "سقف منزل متكامل ومعزول", labelEn: "Complete Insulated Roof", amount: 16000, tagAr: "حماية 10 سنوات", tagEn: "10-year roof" },
      { labelAr: "أيّ مبلغ تجود به", labelEn: "Any custom amount", amount: 100 },
    ]}
    pillars={[
      {
        titleAr: "1. أسقف المنازل الخشبية المعزولة",
        titleEn: "1. Insulated Wooden Roofs",
        descAr: "حماية العائلات من حرارة الصيف الشديدة والأمطار: عروق خشبية وألواح متينة معزولة بمشمع بلاستيكي وطبقة خرسانية قوية. عمر افتراضي 8–10 أعوام، بتكلفة 15,000 إلى 20,000 ج (أو سهم بـ 500 ج).",
        descEn: "Protecting families from scorching heat and rain: solid timber, plastic insulation, and reinforced concrete. 8–10 year lifespan, EGP 15,000–20,000 total or EGP 500 share.",
      },
      {
        titleAr: "2. وصلات المياه النقية للمنازل",
        titleEn: "2. Pure Home Water Connections",
        descAr: "شريان الحياة داخل المنزل: مواسير مياه، موتور رفع، خزان مياه، حوض مطبخ، حنفيات، دش، مع التركيب بالكامل (تكلفة 7,000–8,000 ج أو سهم 500 ج). تجوز كصدقة جارية عن المتوفين أو الأحياء.",
        descEn: "Direct life connection: pipes, booster pump, water tank, kitchen sink, faucets, and shower with full installation (EGP 7,000–8,000 or EGP 500 share). Valid as ongoing charity for the living or deceased.",
      },
      {
        titleAr: "3. خطوط المياه لقرى كاملة",
        titleEn: "3. Village Water Supply Lines",
        descAr: "مد شبكات مياه نقية لقرى بأكملها تعاني من انعدام المياه الصالحة للشرب بالتنسيق الكامل مع شركة مياه الشرب والصرف الصحي. عمر افتراضي 10 سنوات فأكثر.",
        descEn: "Extending pure water main lines to entire underserved villages in coordination with official water authorities. 10+ year lifespan.",
      },
      {
        titleAr: "4. دعم البيوت (أبواب وشبابيك)",
        titleEn: "4. Home Support (Doors & Windows)",
        descAr: "توفير وتركيب الأبواب والنوافذ المتينة لحماية الأسر المستورة وسترهم، وتأمينهم من حرارة الصيف القاتلة ورياح الشتاء الباردة.",
        descEn: "Fabrication and installation of sturdy wooden doors and windows to preserve privacy and block outdoor heat and winter winds.",
      },
      {
        titleAr: "5. وسائل التهوية والتبريد (مراوح)",
        titleEn: "5. Ventilation & Cooling Fans",
        descAr: "توفير وتركيب مراوح السقف والحوائط للأسر الأشد احتياجاً لتخفيف وطأة درجات الحرارة المرتفعة وإعانتهم على تحمل لهيب الصيف.",
        descEn: "Providing and installing ceiling and wall fans for underprivileged homes to ease harsh summer heatwaves.",
      },
    ]}
    steps={[
      {
        titleAr: "أين نترك أثراً؟ (مناطق التنفيذ)",
        titleEn: "Where We Leave an Impact",
        descAr: "معيارنا الأول هو أولوية المستحقين وليس المكان. تم التنفيذ هذا العام في الدقهلية، كفر الشيخ، والشرقية. وعلى مدار مسيرتنا نفذنا في: الدقهلية، الفيوم، الإسماعيلية، الشرقية، كفر الشيخ، الوادي الجديد، سوهاج، وقنا.",
        descEn: "Our criterion is need priority: this year we focused on Dakahlia, Kafr El Sheikh, and Sharqia. Across our history: Dakahlia, Fayoum, Ismailia, Sharqia, New Valley, Sohag, and Qena.",
      },
      {
        titleAr: "كيف يتم التنفيذ ميدانياً؟",
        titleEn: "How We Execute in the Field",
        descAr: "لضمان وصول كل جنيه إلى مكانه الصحيح وبأعلى جودة، يعتمد التنفيذ ميدانياً على فريق متطوعي اليسر يداً بيد مع فنيين محترفين من نجارين وسباكين وبنائين لضمان الدقة والسرعة.",
        descEn: "Executed by Al-Yusr volunteers working alongside certified carpenters, plumbers and masons for maximum quality and speed.",
      },
      {
        titleAr: "التوثيق ورقم التتبع",
        titleEn: "Proof & Tracking",
        descAr: "يتم توثيق كل سقف وكل وصلة مياه ومروحة بالصور والفيديو مع رقم تتبع فوري لتقرير التبرع يُرسل لك مباشرة.",
        descEn: "Every roof, water tap and fan is documented with photo/video proof and an instant tracking number sent to you.",
      },
    ]}
    gallery={[
      { src: yusrWater, altAr: "وصلة مياه نقية مع موتور وخزان لأسرة مستحقة", altEn: "Pure water connection with pump and tank" },
      { src: posterWater, altAr: "تسقيف خشبي معزول لبيت يحميه من حرارة الصيف", altEn: "Insulated wooden roof installation" },
      { src: yusrDistribution, altAr: "توزيع مراوح ووسائل تبريد لبيوت القرى", altEn: "Distribution of cooling fans" },
      { src: yusrMeals, altAr: "قوافل السقيا والمساعدات الميدانية في قرى مصر", altEn: "Field water and aid convoys" },
    ]}
    relatedLinks={[
      { href: "/setr", ar: "حملة سِتر (تسقيف الشتاء والكسوة)", en: "Setr Campaign (Winter aid)" },
      { href: "/markoun", ar: "حملة مَرْكون (الأثاث والأجهزة)", en: "Markoun campaign" },
      { href: "/khabia", ar: "الخبيئة — صدقة جارية", en: "Khabia — ongoing charity" },
      { href: "/food-box", ar: "كرتونة الغذاء الشهرية", en: "Monthly food box" },
      { href: "/trust", ar: "الشفافية والتقارير الميدانية", en: "Trust & reports" },
    ]}
    faq={{
      ar: [
        { q: "هل يمكن تنفيذ وصلة المياه كصدقة جارية عن المتوفين أو الأحياء؟", a: "نعم، بالتأكيد! يمكنك نية الوصلة أو السهم كصدقة جارية عن أحد المتوفين من أسرتك أو عن الأحياء (مثل والديك معاً)؛ فسُقيا الماء من أحب الأعمال إلى الله ومن أفضل الصدقات الجارية." },
        { q: "ما هي مواصفات سقف المنزل في حملة ظل؟", a: "يتضمن عروقاً خشبية وألواحاً متينة، يتم عزلها بمشمع بلاستيكي قوي ثم تغطى بطبقة خرسانية محكمة لحماية الأسرة من الشمس والأمطار بعمر افتراضي 8–10 أعوام." },
        { q: "ما هي مشتملات وصلة المياه المنزلية؟", a: "تشمل مواسير المياه، موتور رفع، خزان مياه، حوض مطبخ، حنفيات، دش، بالإضافة إلى مصاريف وتكاليف التركيب بالكامل، ويتم اختيار أفضل المواصفات لضمان أطول عمر تشغيلي." },
        { q: "هل يمكنني المساهمة بسهم فقط وليس التكلفة كاملة؟", a: "نعم، يمكنك شراء سهم في السقف بقيمة 500 جنيه، أو سهم في وصلة المياه بقيمة 500 جنيه، ويشترك عدة متبرعين لإتمام الحالة وتسليمها." },
        { q: "ما هي المحافظات التي تنفذ فيها حملة ظل؟", a: "نركز في الدقهلية، كفر الشيخ، والشرقية، بالإضافة للقرى الأشد احتياجاً في محافظات الصعيد (الفيوم، قنا، سوهاج، الوادي الجديد)." },
      ],
      en: [
        { q: "Can water taps be dedicated as Sadaqah Jariyah for living or deceased?", a: "Yes, absolutely. You can dedicate water connections on behalf of deceased relatives or living parents as lasting continuous charity." },
        { q: "What are the wooden roof specifications?", a: "Treated wooden beams and sturdy boards, insulated with heavy plastic sheeting and topped with a reinforced concrete layer, lasting 8–10 years." },
        { q: "What is included in a home water connection?", a: "Complete piping, water pump, water tank, kitchen sink, faucets, shower fixtures, and full installation labor." },
        { q: "Can I contribute with a share rather than the full cost?", a: "Yes, you can buy a roof share for EGP 500 or a water connection share for EGP 500." },
      ],
    }}
    donateHref="/donate?program=water"
    donateLabelAr="تبرّع لحملة ظِلّ"
    donateLabelEn="Donate to Dhill"
    bottomCtaAr="اكسب ظِلاً يوم القيامة — تبرع لسقف أو وصلة مياه الآن"
    bottomCtaEn="Earn shade on the Day of Judgment — support a roof or water tap"
  />
);

export default DhillLanding;