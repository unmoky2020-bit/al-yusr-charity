import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import heroCarton from "@/assets/hero-carton-opened.webp";
import cartonStack from "@/assets/brand-carton-stack.png";
import meatTrays from "@/assets/qurbani-meat-trays.jpg";
import meatChicken from "@/assets/poster-meat.png";
import tableCarton from "@/assets/hero-carton-opened.webp";

const FoodBoxLanding = () => (
  <CampaignLandingShell
    slug="food-box-meat"
    path="/food-box"
    badgeAr="غذاء شهري موثّق"
    badgeEn="Verified monthly food"
    titleAr="غذاء شهري — كرتونة + لحمة لأسر الدقهلية والمنصورة"
    titleEn="Monthly Food Box + Meat — for Dakahlia & Mansoura families"
    taglineAr="كرتونة طعام ٢٥ كيلو + كيلو لحمة من المزرعة الوقفية، تتسلّم على باب البيت كل شهر — في المنصورة، ميت غمر، طلخا، بلقاس وكفر الشيخ. غذاء كريم لأسرة كاملة بأقل تكلفة."
    taglineEn="A 25kg food carton + 1kg of fresh meat from our endowment farm, delivered to the doorstep monthly — in Mansoura, Mit Ghamr, Talkha, Belqas and Kafr El Sheikh."
    metaDescAr="اكفل أسرة بدقهلية بكرتونة غذاء شهرية ٢٥ كيلو + كيلو لحمة طازجة من المزرعة الوقفية لمؤسسة اليسر. توصيل على الباب في المنصورة وميت غمر وطلخا وكفر الشيخ، توثيق بالصور."
    metaDescEn="Sponsor a Dakahlia family with a 25kg monthly food carton + 1kg fresh meat from Al-Yusr endowment farm. Doorstep delivery in Mansoura, Mit Ghamr, Talkha and Kafr El Sheikh."
    heroImage={heroCarton}
    heroAlt="كرتونة غذاء شهرية مع لحمة طازجة من اليسر"
    pricing={[
      { labelAr: "كرتونة شهر واحد", labelEn: "1-month box", amount: 650 },
      { labelAr: "كرتونة + لحمة شهر", labelEn: "Box + meat (1 mo)", amount: 950, tagAr: "الأكثر طلبًا", tagEn: "Most chosen" },
      { labelAr: "كفالة ٣ شهور", labelEn: "3-month sponsorship", amount: 2700 },
      { labelAr: "كفالة ٦ شهور", labelEn: "6-month sponsorship", amount: 5200 },
      { labelAr: "كفالة سنة كاملة", labelEn: "Full-year sponsorship", amount: 9800, tagAr: "الأعلى أثرًا", tagEn: "Highest impact" },
      { labelAr: "أيّ مبلغ", labelEn: "Any amount", amount: 100 },
    ]}
    pillars={[
      { titleAr: "محتويات تكفي شهر", titleEn: "A full month of food", descAr: "أرز، زيت، مكرونة، سكر، عدس، فول، صلصة، شاي، حلاوة، صابون — مكوّنات أساسية تكفي أسرة ٥ أفراد.", descEn: "Rice, oil, pasta, sugar, lentils, fava, sauce, tea, halawa and soap — covering a 5-person family for a month." },
      { titleAr: "لحمة من مزرعتنا", titleEn: "Meat from our farm", descAr: "كيلو لحمة طازجة من المزرعة الوقفية — مذبوحة شرعيًا، مفروزة ومعلّبة بمعايير صحية صارمة.", descEn: "1 kg of fresh halal meat from our endowment farm — slaughtered, portioned and packed to strict standards." },
      { titleAr: "توصيل شهري ثابت", titleEn: "Reliable monthly delivery", descAr: "بنوصّل على الباب في نفس موعدها كل شهر بالدقهلية وكفر الشيخ، بتوثيق بالصور.", descEn: "Same-date doorstep delivery monthly across Dakahlia and Kafr El Sheikh with photo proof." },
    ]}
    steps={[
      { titleAr: "اختر الكفالة", titleEn: "Choose your sponsorship", descAr: "شهر، ٣ شهور، ٦ شهور أو سنة كاملة — مع أو بدون لحمة.", descEn: "1, 3, 6 months or a full year — with or without meat." },
      { titleAr: "نخصّص لك أسرة", titleEn: "We assign a family", descAr: "نختار أسرة متعفّفة من قائمة الانتظار في المنصورة أو ميت غمر أو طلخا.", descEn: "We assign a deserving family from our waitlist in Mansoura, Mit Ghamr or Talkha." },
      { titleAr: "تعبئة وتوصيل", titleEn: "Pack & deliver", descAr: "نعبّي الكرتونة في مخازن اليسر، ونحضّر اللحمة من المزرعة، ونوصّل في موعد ثابت.", descEn: "We pack the carton in our warehouses, prep the meat at the farm, and deliver on a fixed date." },
      { titleAr: "تقرير شهري", titleEn: "Monthly report", descAr: "تستلم صور التسليم وتقرير قصير عن الأسرة كل شهر على الواتس أو الإيميل.", descEn: "Receive delivery photos and a short family report every month via WhatsApp or email." },
    ]}
    gallery={[
      { src: heroCarton, altAr: "كرتونة غذاء اليسر مفتوحة بمحتوياتها", altEn: "Open Al-Yusr food carton showing contents" },
      { src: cartonStack, altAr: "مخزون كرتونات الغذاء قبل التوزيع بالدقهلية", altEn: "Food cartons stock before distribution in Dakahlia" },
      { src: meatTrays, altAr: "صواني لحمة طازجة من المزرعة الوقفية", altEn: "Fresh meat trays from the endowment farm" },
      { src: tableCarton, altAr: "تسليم كرتونة غذاء على باب أسرة بالمنصورة", altEn: "Doorstep food carton delivery in Mansoura" },
    ]}
    relatedLinks={[
      { href: "/farm", ar: "المزرعة الوقفية ومصدر اللحوم", en: "Endowment farm — meat source" },
      { href: "/programs/food-box", ar: "برنامج كرتونة الغذاء", en: "Food box program" },
      { href: "/qurbani", ar: "صك أضحية الدقهلية", en: "Dakahlia Qurbani share" },
      { href: "/zakat", ar: "زكاة المال", en: "Zakat" },
      { href: "/trust", ar: "الشفافية والتقارير", en: "Trust & reports" },
    ]}
    faq={{
      ar: [
        { q: "إيه محتويات الكرتونة بالظبط؟", a: "أرز ٥ كيلو، مكرونة ٢ كيلو، زيت ٢ لتر، سكر ٢ كيلو، عدس، فول، صلصة، شاي، حلاوة، صابون. الإجمالي ٢٥ كيلو تكفي أسرة ٥ أفراد لشهر." },
        { q: "اللحمة منين ومذبوحة فين؟", a: "اللحمة من المزرعة الوقفية لمؤسسة اليسر بالدقهلية، مذبوحة شرعيًا تحت إشراف بيطري، ومعبّأة في نفس يوم التوزيع." },
        { q: "بتوصلوا فين؟", a: "بنوصّل على الباب في كل مدن الدقهلية (المنصورة، طلخا، ميت غمر، بلقاس، السنبلاوين، أجا) وقرى مختارة في كفر الشيخ — مجانًا." },
        { q: "أقدر أكفل أسرة معيّنة؟", a: "نعم، تقدر تطلب كفالة شخصية لأسرة، وبنرسل لك ملف الأسرة (مجهّل البيانات للحفاظ على كرامتها) وتقرير شهري." },
        { q: "إزاي أعرف إن الكرتونة وصلت؟", a: "بتستلم صور التسليم على الواتس أو الإيميل، ورقم تتبّع للتبرّع تقدر تتابعه من /donation-tracking." },
        { q: "هل تقبلون زكاة المال للكفالة؟", a: "نعم — كرتونة الغذاء واللحمة من المصارف الشرعية للزكاة، ونوفّر لك إيصال زكاة موثّق." },
      ],
      en: [
        { q: "What's inside the carton?", a: "5kg rice, 2kg pasta, 2L oil, 2kg sugar, lentils, fava, sauce, tea, halawa, soap. Total 25kg covering a family of 5 for a month." },
        { q: "Where does the meat come from?", a: "From Al-Yusr endowment farm in Dakahlia, halal-slaughtered under vet supervision and packed on distribution day." },
        { q: "Where do you deliver?", a: "Doorstep delivery across all Dakahlia cities (Mansoura, Talkha, Mit Ghamr, Belqas, Sinbillawein, Aga) and selected Kafr El Sheikh villages — free." },
        { q: "Can I sponsor a specific family?", a: "Yes — request personal sponsorship and we send an anonymized family file plus a monthly report." },
        { q: "How do I confirm delivery?", a: "Receive delivery photos via WhatsApp/email and a tracking number to follow on /donation-tracking." },
        { q: "Is Zakat accepted?", a: "Yes — food and meat are eligible Zakat categories. We issue a verified Zakat receipt." },
      ],
    }}
    donateHref="/donate?program=food-box"
    donateLabelAr="ابدأ كفالة شهرية"
    donateLabelEn="Start monthly sponsorship"
    body={
      <div className="grid items-center gap-6 md:grid-cols-2">
        <img src={meatChicken} alt="لحوم وطيور طازجة من مزرعة اليسر الوقفية بالدقهلية" loading="lazy" className="w-full rounded-2xl object-cover shadow-soft" />
        <div className="text-right">
          <h2 className="text-2xl font-black text-primary">من مزارعنا لباب بيتك المستحق</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">سلسلة كاملة موثّقة: المزرعة الوقفية بالدقهلية تربّي وتذبح، مخزن المؤسسة بالمنصورة يعبّي الكراتين، فريق الميدان يوصّل على الباب في طلخا وميت غمر وكفر الشيخ — كل خطوة بصور وفيديو.</p>
          <ul className="mt-4 space-y-2 text-sm text-primary">
            <li>• إشراف بيطري على كل ذبيحة</li>
            <li>• تعبئة في عبوات صحية مفرّغة</li>
            <li>• توصيل بسيارات مبرّدة لقرى الدقهلية</li>
            <li>• تقرير شهري للمتبرّع</li>
          </ul>
        </div>
      </div>
    }
  />
);

export default FoodBoxLanding;