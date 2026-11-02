import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import qurbaniMeatQuality from "@/assets/qurbani-meat-quality.webp";
import qurbaniTrustedSource from "@/assets/qurbani-trusted-source.webp";
import qurbaniCowSheep from "@/assets/qurbani-cow-sheep.webp";
import meatTrays from "@/assets/qurbani-meat-trays.jpg";

const QurbaniGuaranteeLanding = () => (
  <CampaignLandingShell
    slug="qurbani-guarantee"
    path="/qurbani-guarantee"
    badgeAr="الوحيدون في مصر بضمان جودة"
    badgeEn="Egypt's only quality-guaranteed Qurbani"
    titleAr="صك الأضحية المضمون — الوحيدون في مصر بضمان جودة الأضحية"
    titleEn="Guaranteed Qurbani Receipt — Egypt's only verified quality guarantee"
    taglineAr="معاينة بيطرية قبل الذبح، توثيق بالصور والفيديو لكل صك، وتعويض كامل لو ظهر أيّ عيب. صك أضحية الدقهلية من اليسر — من المزرعة الوقفية لباب بيت الأسرة المستحقة."
    taglineEn="Pre-slaughter veterinary inspection, photo and video proof for every receipt, and a full refund if any defect appears. Al-Yusr Dakahlia Qurbani — from our endowment farm to a deserving family's door."
    metaDescAr="احجز صك أضحية مضمون الجودة مع مؤسسة اليسر بالدقهلية. ضمان كتابي على الأضحية، توثيق بالصور والفيديو، توزيع نفس يوم العيد على الأسر المستحقة في المنصورة وميت غمر وطلخا وكفر الشيخ."
    metaDescEn="Reserve a quality-guaranteed Qurbani receipt with Al-Yusr in Dakahlia. Written guarantee, photo/video proof, same-day Eid distribution across Mansoura, Mit Ghamr, Talkha and Kafr El Sheikh."
    heroImage={qurbaniMeatQuality}
    heroAlt="ضمان جودة لحم الأضحية - مؤسسة اليسر الدقهلية"
    pricing={[
      { labelAr: "سُبع بقرة", labelEn: "1/7 cow share", amount: 1400, tagAr: "الأكثر طلبًا", tagEn: "Most chosen" },
      { labelAr: "خروف كامل", labelEn: "Whole sheep", amount: 4500 },
      { labelAr: "بقرة كاملة", labelEn: "Whole cow", amount: 9800 },
      { labelAr: "عقيقة", labelEn: "Aqeeqa", amount: 4500 },
      { labelAr: "نذر / كفّارة", labelEn: "Vow / Kaffara", amount: 4500 },
      { labelAr: "أيّ مبلغ", labelEn: "Any amount", amount: 100 },
    ]}
    pillars={[
      { titleAr: "ضمان كتابي على الجودة", titleEn: "Written quality guarantee", descAr: "الوحيدون في مصر بنوقّع لك ضمان كتابي على وزن وجودة الأضحية، مع تعويض كامل لو ظهر أيّ عيب صحي.", descEn: "We are the only foundation in Egypt issuing a written guarantee on weight and quality, with full refund on any health defect." },
        { titleAr: "معاينة بيطرية قبل الذبح", titleEn: "Pre-slaughter vet inspection", descAr: "كل ذبيحة تمر بفحص بيطري معتمد ومعاينة نظر للمضحّي عبر فيديو لايف من مزرعة اليسر بالدقهلية.", descEn: "Every animal is vet-inspected and you can watch a live video from our Dakahlia farm before slaughter." },
      { titleAr: "توزيع نفس يوم العيد", titleEn: "Same-day Eid distribution", descAr: "اللحمة بتوصل لأسر المنصورة وميت غمر وطلخا وكفر الشيخ في نفس يوم العيد — طازجة وموثّقة.", descEn: "Meat reaches families in Mansoura, Mit Ghamr, Talkha and Kafr El Sheikh on Eid day itself — fresh and documented." },
    ]}
    steps={[
      { titleAr: "احجز صكّك", titleEn: "Reserve your receipt", descAr: "اختار سُبع بقرة أو خروف كامل وادفع أونلاين بأمان (Kashier / Vodafone Cash / InstaPay).", descEn: "Pick a 1/7 cow or full sheep and pay securely (Kashier / Vodafone Cash / InstaPay)." },
      { titleAr: "معاينة قبل الذبح", titleEn: "Pre-slaughter check", descAr: "نرسل لك صورة الحيوان ووزنه وفيديو معاينة، مع إيصال صك يحمل رقم تتبّع.", descEn: "We send you the animal photo, weight, inspection video and a receipt with a tracking number." },
      { titleAr: "ذبح وتوثيق", titleEn: "Slaughter & document", descAr: "الذبح شرعيًا فجر يوم العيد، مع تصوير كامل وعدّاد رقمي على كل ذبيحة.", descEn: "Halal slaughter at Eid dawn with full filming and a digital counter per animal." },
      { titleAr: "توزيع وضمان", titleEn: "Distribute & guarantee", descAr: "توزيع اللحمة على الأسر المستحقة بالدقهلية وكفر الشيخ، وتقرير ضمان جودة لكل متبرّع.", descEn: "Distribution to deserving families across Dakahlia & Kafr El Sheikh, with a quality-guarantee report for each donor." },
    ]}
    gallery={[
      { src: qurbaniCowSheep, altAr: "بقرة وخروف الأضحية في مزرعة اليسر الوقفية بالدقهلية", altEn: "Qurbani cow and sheep at Al-Yusr Dakahlia endowment farm" },
      { src: qurbaniMeatQuality, altAr: "ضمان جودة لحوم الأضحية بالمنصورة", altEn: "Qurbani meat quality guarantee in Mansoura" },
      { src: qurbaniTrustedSource, altAr: "مصدر موثوق للحوم الأضحية في الدقهلية الشرقية", altEn: "Trusted Qurbani meat source in East Dakahlia" },
      { src: meatTrays, altAr: "صواني لحم أضحية معبّأة قبل التوزيع بكفر الشيخ", altEn: "Packed Qurbani meat trays before delivery in Kafr El Sheikh" },
    ]}
    relatedLinks={[
      { href: "/qurbani", ar: "صك أضحية الدقهلية", en: "Dakahlia Qurbani" },
      { href: "/qurbani/mansoura", ar: "أضحية المنصورة", en: "Mansoura Qurbani" },
      { href: "/qurbani/mit-ghamr", ar: "أضحية ميت غمر", en: "Mit Ghamr Qurbani" },
      { href: "/qurbani/talkha", ar: "أضحية طلخا", en: "Talkha Qurbani" },
      { href: "/farm", ar: "المزرعة الوقفية", en: "Endowment farm" },
      { href: "/trust", ar: "الشفافية والتقارير", en: "Trust & reports" },
    ]}
    faq={{
      ar: [
        { q: "إيه يعني ضمان جودة الأضحية؟", a: "اليسر هي المؤسسة الوحيدة في مصر اللي بتوقّع للمتبرّع ضمان كتابي على وزن وصحة الأضحية. لو ظهر أيّ عيب صحي بعد الذبح، بنعوّضك بأضحية بديلة كاملة." },
        { q: "إيه أسعار صك الأضحية ٢٠٢٦؟", a: "سُبع البقرة بـ١٤٠٠ جنيه، الخروف الكامل بـ٤٥٠٠ جنيه، البقرة الكاملة بـ٩٨٠٠ جنيه. الأسعار شاملة كل الخدمات." },
        { q: "أقدر أحضر الذبح بنفسي؟", a: "نعم، تقدر تزور المزرعة الوقفية بالدقهلية بحجز مسبق، أو نبعت لك فيديو لايف لذبيحتك من غير ما تتنقل." },
        { q: "اللحمة بتوصل لمين بالظبط؟", a: "بنوزّع على الأسر المستحقة في المنصورة وميت غمر وطلخا وبلقاس وأجا والسنبلاوين، إضافة لقرى مختارة بكفر الشيخ — بقوائم مدروسة من فريق العمل الاجتماعي." },
        { q: "إزاي أحجز من خارج مصر؟", a: "تقدر تحجز أونلاين من أيّ دولة عبر Kashier أو InstaPay، وتستلم رقم التتبّع والصور على الواتس أو الإيميل." },
        { q: "هل في إيصال أو صك ورقي؟", a: "نعم، بنرسل صك الأضحية موثّق برقم تسلسلي ورقم تتبّع، وتقدر تتابعه من /donation-tracking." },
      ],
      en: [
        { q: "What is the quality guarantee?", a: "Al-Yusr is the only foundation in Egypt issuing a written guarantee on weight and health. Any defect after slaughter triggers a full replacement Qurbani." },
        { q: "What are Qurbani prices?", a: "1/7 cow: EGP 1,400 — Whole sheep: EGP 4,500 — Whole cow: EGP 9,800. All services included." },
        { q: "Can I attend the slaughter?", a: "Yes — visit our Dakahlia endowment farm by appointment, or receive a live video of your specific animal." },
        { q: "Who exactly receives the meat?", a: "Vetted families in Mansoura, Mit Ghamr, Talkha, Belqas, Aga, Sinbillawein and selected Kafr El Sheikh villages — via our social-work team's lists." },
        { q: "Can I reserve from abroad?", a: "Yes — book online from any country via Kashier or InstaPay; you receive a tracking number, photos and video on WhatsApp/email." },
        { q: "Is there a paper receipt?", a: "Yes — a serialized Qurbani receipt with tracking number, viewable on /donation-tracking." },
      ],
    }}
    donateHref="/donate?program=odhya"
    donateLabelAr="احجز صكّك بضمان"
    donateLabelEn="Reserve guaranteed receipt"
  />
);

export default QurbaniGuaranteeLanding;