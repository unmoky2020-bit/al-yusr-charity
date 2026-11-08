import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import qurbaniMeatQuality from "@/assets/qurbani-meat-quality.webp";
import qurbaniTrustedSource from "@/assets/qurbani-trusted-source.webp";
import qurbaniCowSheep from "@/assets/qurbani-cow-sheep.webp";
import meatTrays from "@/assets/qurbani-meat-trays.jpg";

const QurbaniGuaranteeLanding = () => (
  <CampaignLandingShell
    slug="qurbani-guarantee"
    path="/qurbani-guarantee"
    badgeAr="الوحيدون في مصر بضمان الجودة"
    badgeEn="Egypt's only quality-guaranteed Qurbani"
    titleAr="صك الأضحية المضمون — الوحيدون في مصر بضمان جودة الأضحية"
    titleEn="Guaranteed Qurbani Receipt — Egypt's only verified quality guarantee"
    taglineAr="معاينة بيطرية قبل الذبح، وتوثيق بالصور والفيديو لكل صك، وتعويض كامل إن ظهر أي عيب. صك أضحية الدقهلية من اليسر: من المزرعة الوقفية حتى باب بيت الأسرة المستحقة."
    taglineEn="Pre-slaughter veterinary inspection, photo and video proof for every receipt, and a full refund if any defect appears. Al-Yusr Dakahlia Qurbani — from our endowment farm to a deserving family's door."
    metaDescAr="احجز صك أضحية مضمون الجودة مع مؤسسة اليسر بالدقهلية. ضمان كتابي على الأضحية، وتوثيق بالصور والفيديو، وتوزيع في يوم العيد نفسه على الأسر المستحقة في المنصورة وميت غمر وطلخا وكفر الشيخ."
    metaDescEn="Reserve a quality-guaranteed Qurbani receipt with Al-Yusr in Dakahlia. Written guarantee, photo/video proof, same-day Eid distribution across Mansoura, Mit Ghamr, Talkha and Kafr El Sheikh."
    heroImage={qurbaniMeatQuality}
    heroAlt="ضمان جودة لحم الأضحية - مؤسسة اليسر الدقهلية"
    pricing={[
      { labelAr: "صك سُبع بقري", labelEn: "1/7 cow share", amount: 16000, tagAr: "الأكثر طلبًا", tagEn: "Most chosen" },
      { labelAr: "صك سُبع جاموسي", labelEn: "1/7 buffalo share", amount: 14000 },
      { labelAr: "خروف كامل", labelEn: "Whole sheep", amount: 14500 },
      { labelAr: "عقيقة", labelEn: "Aqeeqa", amount: 4500 },
      { labelAr: "نذر / كفّارة", labelEn: "Vow / Kaffara", amount: 4500 },
      { labelAr: "أي مبلغ", labelEn: "Any amount", amount: 100 },
    ]}
    pillars={[
      { titleAr: "ضمان كتابي على الجودة", titleEn: "Written quality guarantee", descAr: "نحن الوحيدون في مصر الذين نوقّع لك ضمانًا كتابيًا على وزن الأضحية وجودتها، مع تعويض كامل إن ظهر أي عيب صحي.", descEn: "We are the only foundation in Egypt issuing a written guarantee on weight and quality, with full refund on any health defect." },
        { titleAr: "معاينة بيطرية قبل الذبح", titleEn: "Pre-slaughter vet inspection", descAr: "تخضع كل ذبيحة لفحص بيطري معتمد، ويعاينها المضحّي بنفسه عبر بث مباشر بالفيديو من مزرعة اليسر بالدقهلية.", descEn: "Every animal is vet-inspected and you can watch a live video from our Dakahlia farm before slaughter." },
      { titleAr: "التوزيع في يوم العيد نفسه", titleEn: "Same-day Eid distribution", descAr: "يصل اللحم إلى أسر المنصورة وميت غمر وطلخا وكفر الشيخ في يوم العيد نفسه، طازجًا وموثّقًا.", descEn: "Meat reaches families in Mansoura, Mit Ghamr, Talkha and Kafr El Sheikh on Eid day itself — fresh and documented." },
    ]}
    steps={[
      { titleAr: "احجز صكّك", titleEn: "Reserve your receipt", descAr: "اختر صك سُبع (بقري أو جاموسي) أو خروفًا كاملًا، وادفع إلكترونيًا بأمان (Kashier / Vodafone Cash / InstaPay).", descEn: "Pick a 1/7 share (cow or buffalo) or a whole sheep and pay securely (Kashier / Vodafone Cash / InstaPay)." },
      { titleAr: "معاينة قبل الذبح", titleEn: "Pre-slaughter check", descAr: "نرسل إليك صورة الذبيحة ووزنها وفيديو المعاينة، مع إيصال صك يحمل رقم تتبّع.", descEn: "We send you the animal photo, weight, inspection video and a receipt with a tracking number." },
      { titleAr: "ذبح وتوثيق", titleEn: "Slaughter & document", descAr: "ذبح شرعي صباح يوم العيد، مع تصوير كامل وعدّاد رقمي لكل ذبيحة.", descEn: "Halal slaughter at Eid dawn with full filming and a digital counter per animal." },
      { titleAr: "توزيع وضمان", titleEn: "Distribute & guarantee", descAr: "توزيع اللحوم على الأسر المستحقة في الدقهلية وكفر الشيخ، وتقرير ضمان جودة لكل متبرّع.", descEn: "Distribution to deserving families across Dakahlia & Kafr El Sheikh, with a quality-guarantee report for each donor." },
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
        { q: "ما المقصود بضمان جودة الأضحية؟", a: "اليسر هي المؤسسة الوحيدة في مصر التي توقّع للمتبرّع ضمانًا كتابيًا على وزن الأضحية وسلامتها. وإن ظهر أي عيب صحي بعد الذبح، نعوّضك بأضحية بديلة كاملة." },
        { q: "ما أسعار صك الأضحية ٢٠٢٦؟", a: "صك سُبع بقري بـ١٦٬٠٠٠ جنيه، وصك سُبع جاموسي بـ١٤٬٠٠٠ جنيه، والخروف الكامل بـ١٤٬٥٠٠ جنيه. ويمكنك حجز أكثر من صك؛ فالعجل الكامل = 7 صكوك. والأسعار شاملة جميع الخدمات." },
        { q: "هل يمكنني حضور الذبح بنفسي؟", a: "نعم، يمكنك زيارة المزرعة الوقفية بالدقهلية بحجز مسبق، أو نرسل إليك بثًا مباشرًا لذبيحتك دون أن تضطر إلى الانتقال." },
        { q: "لمن يصل اللحم تحديدًا؟", a: "نوزّعه على الأسر المستحقة في المنصورة وميت غمر وطلخا وبلقاس وأجا والسنبلاوين، إضافة إلى قرى مختارة في كفر الشيخ، وفق قوائم يعدّها فريق البحث الاجتماعي." },
        { q: "كيف أحجز من خارج مصر؟", a: "يمكنك الحجز إلكترونيًا من أي دولة عبر Kashier أو InstaPay، وستصلك الصور ورقم التتبّع عبر واتساب أو البريد الإلكتروني." },
        { q: "هل يوجد إيصال أو صك ورقي؟", a: "نعم، نرسل إليك صك الأضحية موثّقًا برقم تسلسلي ورقم تتبّع، ويمكنك متابعته من /donation-tracking." },
      ],
      en: [
        { q: "What is the quality guarantee?", a: "Al-Yusr is the only foundation in Egypt issuing a written guarantee on weight and health. Any defect after slaughter triggers a full replacement Qurbani." },
        { q: "What are Qurbani prices?", a: "1/7 cow share: EGP 16,000 — 1/7 buffalo share: EGP 14,000 — Whole sheep: EGP 14,500. You can book more than one share (a whole animal = 7 shares). All services included." },
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