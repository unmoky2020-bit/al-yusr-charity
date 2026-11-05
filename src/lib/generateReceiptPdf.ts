import logoImg from "@/assets/logo-circle.png";

export interface ReceiptItem {
  title: string;
  category?: string;
  quantity?: number;
  amount: number;
  unitPrice?: number;
}

export interface ReceiptData {
  ref: string;
  amount: number;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  programTitle: string;
  paymentMethod: string;
  status: string;
  createdAt: string | Date;
  notes?: string;
  items?: ReceiptItem[];
  targetType?: string;
}

/** Escape HTML special chars so user-supplied text can never inject markup into the receipt template */
const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * حماية وتنسيق النصوص ثنائية الاتجاه لتجنب انعكاس الأقواس (Parentheses) في النصوص العربية والإنجليزية
 * (يُستدعى على نص مُهرَّب مسبقًا عبر esc)
 */
function sanitizeBidiText(text?: string): string {
  if (!text) return "";
  let clean = String(text).trim();

  // فحص وإصلاح الأقواس وتغليفها بعنصر عزل اتجاهي يمنع المتصفح والكانفاس من عكسها
  return clean.replace(/\(([^)]+)\)/g, '<span dir="ltr" style="unicode-bidi: isolate; display: inline-block;">($1)</span>');
}

/**
 * تحويل الأرقام إلى تفقيط عربي هادئ ودقيق للجنيه المصري
 */
export function tafqeetEGP(num: number): string {
  const integerPart = Math.floor(Math.abs(num || 0));
  if (integerPart === 0) return "صفر جنيه مصري";

  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
  const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const teens = [
    "عشرة",
    "أحد عشر",
    "اثنا عشر",
    "ثلاثة عشر",
    "أربعة عشر",
    "خمسة عشر",
    "ستة عشر",
    "سبعة عشر",
    "ثمانية عشر",
    "تسعة عشر",
  ];
  const hundreds = [
    "",
    "مائة",
    "مائتان",
    "ثلاثمائة",
    "أربعمائة",
    "خمسمائة",
    "ستمائة",
    "سبعمائة",
    "ثمانمائة",
    "تسعمائة",
  ];

  function convertGroup(n: number): string {
    let res = "";
    const h = Math.floor(n / 100);
    const rem = n % 100;
    const t = Math.floor(rem / 10);
    const o = rem % 10;

    if (h > 0) res += hundreds[h];

    if (rem > 0) {
      if (res) res += " و";
      if (rem >= 10 && rem <= 19) {
        res += teens[rem - 10];
      } else {
        if (o > 0) {
          res += ones[o];
          if (t > 0) res += " و" + tens[t];
        } else if (t > 0) {
          res += tens[t];
        }
      }
    }
    return res;
  }

  const millions = Math.floor(integerPart / 1_000_000);
  const thousands = Math.floor((integerPart % 1_000_000) / 1000);
  const remainder = integerPart % 1000;

  const parts: string[] = [];

  if (millions > 0) {
    if (millions === 1) parts.push("مليون");
    else if (millions === 2) parts.push("مليونان");
    else if (millions >= 3 && millions <= 10) parts.push(convertGroup(millions) + " ملايين");
    else parts.push(convertGroup(millions) + " مليون");
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push("ألف");
    else if (thousands === 2) parts.push("ألفان");
    else if (thousands >= 3 && thousands <= 10) parts.push(convertGroup(thousands) + " آلاف");
    else parts.push(convertGroup(thousands) + " ألف");
  }

  if (remainder > 0) {
    parts.push(convertGroup(remainder));
  }

  return `فقط ${parts.join(" و")} جنيهًا مصريًا لا غير`;
}

/**
 * تحويل رابط الصورة بأمان إلى Base64 مع حماية تامة ضد التعليق و Tainted Canvas
 */
async function loadLogoDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string" && reader.result.startsWith("data:")) {
          resolve(reader.result);
        } else {
          resolve(url);
        }
      };
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

/**
 * توليد وتنزيل إيصال PDF فائق الرقي والجمال مطابق تماماً لإيصال المعاينة بهوية مؤسسة اليسر الرسمية
 */
export async function downloadReceiptPdf(data: ReceiptData): Promise<void> {
  // ~180 KB (gzip) of PDF tooling: loaded only when a donor actually downloads a receipt.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  // 1. انتظار الخطوط بأمان
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 400)),
      ]);
    } catch {}
  }

  // 2. تحضير الشعار المعتمد بصيغة DataURL
  let logoDataUrl = logoImg;
  try {
    logoDataUrl = await Promise.race([
      loadLogoDataUrl(logoImg),
      new Promise<string>((resolve) => setTimeout(() => resolve(logoImg), 500)),
    ]);
  } catch {
    logoDataUrl = logoImg;
  }

  // 3. إنشاء حاوية مخفية تماماً خارج الشاشة في الـ DOM الحقيقي لتجنب ظهور أي وميض أو ظل
  const container = document.createElement("div");
  container.id = "alyusr-pdf-voucher-container";
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "-10000px";
  container.style.width = "794px";
  container.style.height = "1123px";
  container.style.zIndex = "-999999";
  container.style.opacity = "0"; // مخفي 100% في الشاشة الحقيقية للمستخدم
  container.style.pointerEvents = "none";
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#0f172a";
  container.style.fontFamily = "'DIN Next Arabic', 'Droid Arabic Kufi', 'TWK Lausanne', system-ui, -apple-system, sans-serif";
  container.style.boxSizing = "border-box";
  container.style.padding = "0";
  container.style.margin = "0";

  const dateObj = new Date(data.createdAt || Date.now());
  const formattedDateAr = dateObj.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTimeAr = dateObj.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const amountNumberStr = Number(data.amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const amountWords = tafqeetEGP(data.amount || 0);

  const rawStatus = String(data.status || "").toLowerCase();
  const isCompleted =
    rawStatus === "paid" ||
    rawStatus === "completed" ||
    rawStatus === "succeeded" ||
    rawStatus === "success" ||
    rawStatus === "approved";

  const itemsList: ReceiptItem[] = Array.isArray(data.items) && data.items.length > 0
    ? data.items
    : [
        {
          title: data.programTitle || "كفالة البرامج العامة والمساعدات",
          category: data.targetType || "برنامج خيري معتمد",
          quantity: 1,
          amount: Number(data.amount || 0),
        },
      ];

  const itemsRowsHtml = itemsList
    .map((it, idx) => {
      const itemTitle =
        it.title ||
        (it as any).name ||
        (it as any).name_ar ||
        (it as any).title_ar ||
        (it as any).program_name ||
        (it as any).item_name ||
        (it as any).description ||
        data.programTitle ||
        "كفالة البرامج العامة والمساعدات";

      const itemCategory =
        it.category ||
        (it as any).type ||
        (it as any).targetType ||
        data.targetType ||
        "برنامج خيري معتمد";

      const itemQty = it.quantity || (it as any).qty || 1;
      const itemAmount = Number(it.amount || (it as any).total || data.amount || 0);

      return `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 9px 8px; text-align: center; color: #64748b; font-weight: 800; font-family: 'DIN Next Arabic', 'Droid Arabic Kufi', sans-serif;">${idx + 1}</td>
      <td style="padding: 9px 12px; font-weight: 900; color: #0f172a; direction: rtl; text-align: right; font-family: 'DIN Next Arabic', 'Droid Arabic Kufi', sans-serif;">${esc(itemTitle)}</td>
      <td style="padding: 9px 12px; text-align: center;">
        <span style="display: inline-block; background: #ecfdf5; border: 1.5px solid #a7f3d0; color: #047857; font-weight: 800; font-size: 11px; padding: 3px 12px; border-radius: 6px; font-family: 'DIN Next Arabic', 'Droid Arabic Kufi', sans-serif;">
          ${esc(itemCategory)}
        </span>
      </td>
      <td style="padding: 9px 8px; text-align: center; font-weight: 800; color: #334155; font-family: 'DIN Next Arabic', 'Droid Arabic Kufi', sans-serif;">${esc(itemQty)}</td>
      <td style="padding: 9px 12px; text-align: left; direction: ltr; font-weight: 900; color: #064e3b; font-family: 'DIN Next Arabic', 'Droid Arabic Kufi', sans-serif;">${itemAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ج.م</td>
    </tr>
  `;
    })
    .join("");

  const notesHtml = data.notes
    ? `
    <div style="background: #f8fafc; padding: 9px 14px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #475569; direction: rtl; text-align: right;">
      <strong style="color: #064e3b; font-weight: 900;">ملاحظات وتوجيهات المتبرع:</strong>
      <span style="display: inline-block; unicode-bidi: isolate; margin-right: 6px; font-weight: 700;">${sanitizeBidiText(esc(data.notes))}</span>
    </div>
  `
    : "";

  // تصميم متناسق وموزع بدقة على قياس A4 (794x1123px) بدون أي فراغ شاذ في الأسفل وبنفس خطوط وهوية مؤسسة اليسر
  container.innerHTML = `
    <style>
      @font-face {
        font-family: 'DIN Next Arabic';
        src: url('/fonts/DINNextLTArabic-Bold.woff2') format('woff2');
        font-weight: 700 900;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Droid Arabic Kufi';
        src: url('/fonts/DroidArabicKufi.woff2') format('woff2');
        font-weight: 600 900;
        font-display: swap;
      }
      @font-face {
        font-family: 'TWK Lausanne';
        src: url('/fonts/TWKLausanne-650.woff2') format('woff2');
        font-weight: 600 700;
        font-style: normal;
        font-display: swap;
      }

      #alyusr-pdf-root, #alyusr-pdf-root * {
        box-sizing: border-box !important;
        letter-spacing: normal !important;
        font-family: 'DIN Next Arabic', 'Droid Arabic Kufi', 'TWK Lausanne', system-ui, -apple-system, sans-serif !important;
      }
      .card-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 8px 14px;
        box-sizing: border-box;
      }
      .card-title-ar {
        font-size: 11px;
        font-weight: 800;
        color: #64748b;
        text-align: right;
        direction: rtl;
      }
      .card-title-en {
        font-size: 8.5px;
        font-weight: 800;
        color: #94a3b8;
        text-align: left;
        direction: ltr;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .card-value {
        font-size: 13.5px;
        font-weight: 900;
        color: #0f172a;
        margin-top: 3px;
      }
    </style>

    <div id="alyusr-pdf-root" style="width: 794px; height: 1123px; padding: 18px; background: #ffffff; box-sizing: border-box; overflow: hidden; margin: 0 auto;">
      
      <!-- الإطار الخارجي المزدوج الفاخر باللون الأخضر الزمردي المتناسق مع هوية المؤسسة -->
      <div style="border: 2px solid #059669; border-radius: 18px; padding: 5px; height: 1087px; box-sizing: border-box; background: #ffffff;">
        
        <!-- الإطار الداخلي الناعم الموزع بانتظام تام -->
        <div style="border: 1px solid #a7f3d0; border-radius: 14px; padding: 22px 24px 18px 24px; height: 1075px; box-sizing: border-box; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between;">
          
          <!-- القسم الأول: الهيدر الرسمي وشارة الاعتماد ورقم الإيصال -->
          <div style="margin-bottom: 14px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <!-- اليمين: الشعار واسم المؤسسة -->
                <td style="vertical-align: middle; text-align: right; direction: rtl; width: 62%;">
                  <table style="border-collapse: collapse; display: inline-table;">
                    <tr>
                      <td style="vertical-align: middle; padding-left: 14px;">
                        <img src="${logoDataUrl}" alt="Al-Yusr" style="width: 60px; height: 60px; object-fit: contain; border-radius: 50%; border: 1.5px solid #a7f3d0; padding: 1px; background: #ffffff;" />
                      </td>
                      <td style="vertical-align: middle; text-align: right; direction: rtl;">
                        <div style="font-size: 21px; font-weight: 900; color: #064e3b; line-height: 1.2;">مؤسسة اليسر الخيرية</div>
                        <div style="font-size: 11px; color: #64748b; font-weight: 700; margin-top: 3px;">
                          مشهرة برقم 2665 لسنة 2019 — وزارة التضامن الاجتماعي
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>

                <!-- اليسار: شارة إيصال رسمي معتمد ورقم الإيصال -->
                <td style="vertical-align: middle; text-align: left; direction: ltr; width: 38%;">
                  <div style="display: inline-block; background: #ecfdf5; border: 1.5px solid #a7f3d0; color: #047857; padding: 5px 16px; border-radius: 20px; font-size: 11.5px; font-weight: 900; text-align: center; white-space: nowrap;">
                    إيصال رسمي معتمد
                  </div>
                  <div style="margin-top: 5px;">
                    <div style="font-size: 9.5px; color: #64748b; font-weight: 800;">رقم الإيصال / Receipt No:</div>
                    <div style="font-size: 14px; font-weight: 900; color: #064e3b; letter-spacing: 0.5px; margin-top: 1px;">${esc(data.ref)}</div>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <!-- القسم الثاني: عنوان الإيصال التوثيقي -->
          <div style="text-align: center; margin-bottom: 14px; padding: 6px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
            <div style="font-size: 18px; font-weight: 900; color: #064e3b; line-height: 1.3;">
              إيصال التبرع الإلكتروني المعتمد
            </div>
            <div style="font-size: 10.5px; color: #64748b; font-weight: 700; margin-top: 2px; direction: ltr;">
              Electronic Proof of Donation — Verified Document
            </div>
          </div>

          <!-- القسم الثالث: بطاقة المبلغ الرئيسية الفاخرة (الجرين كارد الزمردي) -->
          <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%); border-radius: 16px; padding: 16px 20px; margin-bottom: 14px; color: #ffffff;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <!-- تفاصيل المبلغ والأرقام والتفقيط -->
                <td style="text-align: right; direction: rtl; vertical-align: middle;">
                  <div style="font-size: 11.5px; font-weight: 800; color: #d1fae5; margin-bottom: 2px;">
                    إجمالي مبلغ التبرع
                  </div>
                  <div style="margin-top: 2px; direction: rtl; text-align: right;">
                    <span style="font-size: 30px; font-weight: 900; color: #ffffff; line-height: 1;">${amountNumberStr}</span>
                    <span style="font-size: 14.5px; font-weight: 800; color: #a7f3d0; margin-right: 8px;">جنيه مصري</span>
                  </div>
                  <div style="font-size: 11.5px; font-weight: 800; color: #ecfdf5; margin-top: 4px; line-height: 1.4;">
                    ${amountWords}
                  </div>
                </td>

                <!-- بطاقة حالة العملية المعتمدة في الجهة المقابلة -->
                <td style="text-align: left; vertical-align: middle; width: 160px;">
                  <div style="background: rgba(255, 255, 255, 0.15); border: 1.5px solid rgba(255, 255, 255, 0.35); border-radius: 12px; padding: 10px 14px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 800; color: #d1fae5; margin-bottom: 2px;">حالة العملية</div>
                    <div style="font-size: 13px; font-weight: 900; color: #6ee7b7; margin-top: 2px;">
                      ${isCompleted ? "معتمد ومكتمل" : "قيد المراجعة"}
                    </div>
                    <div style="font-size: 8.5px; font-weight: 800; color: #ffffff; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.8px;">
                      ${isCompleted ? "COMPLETED" : "PENDING"}
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <!-- القسم الرابع: شبكة البطاقات الستة المنظمة 3x2 المطابقة تماماً للمعاينة على الشاشة -->
          <div style="margin-bottom: 14px;">
            <table style="width: 100%; border-collapse: separate; border-spacing: 8px;">
              <!-- 1. اسم المتبرع ورقم الهاتف -->
              <tr>
                <td style="width: 50%; padding: 0; vertical-align: top;">
                  <div class="card-box">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td class="card-title-ar">اسم المتبرع الكريم</td>
                        <td class="card-title-en">Donor Name</td>
                      </tr>
                    </table>
                    <div class="card-value" style="direction: rtl; text-align: right;">${esc(data.donorName || "متبرع كريم")}</div>
                  </div>
                </td>
                <td style="width: 50%; padding: 0; vertical-align: top;">
                  <div class="card-box">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td class="card-title-ar">رقم الهاتف</td>
                        <td class="card-title-en">Phone</td>
                      </tr>
                    </table>
                    <div class="card-value" style="direction: ltr; text-align: right; font-family: 'DIN Next Arabic', sans-serif;">${esc(data.donorPhone || "—")}</div>
                  </div>
                </td>
              </tr>

              <!-- 2. البرنامج المستهدف ووسيلة الدفع -->
              <tr>
                <td style="width: 50%; padding: 0; vertical-align: top;">
                  <div class="card-box">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td class="card-title-ar">البرنامج / المبادرة المستهدفة</td>
                        <td class="card-title-en">Target Program</td>
                      </tr>
                    </table>
                    <div class="card-value" style="color: #047857; direction: rtl; text-align: right;">${esc(data.programTitle || "كفالة البرامج العامة والمساعدات")}</div>
                  </div>
                </td>
                <td style="width: 50%; padding: 0; vertical-align: top;">
                  <div class="card-box">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td class="card-title-ar">وسيلة الدفع المعتمدة</td>
                        <td class="card-title-en">Payment Method</td>
                      </tr>
                    </table>
                    <div class="card-value" style="text-transform: uppercase; direction: rtl; text-align: right;">${esc(data.paymentMethod || "دفع إلكتروني")}</div>
                  </div>
                </td>
              </tr>

              <!-- 3. البريد الإلكتروني وتاريخ ووقت الإصدار -->
              <tr>
                <td style="width: 50%; padding: 0; vertical-align: top;">
                  <div class="card-box">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td class="card-title-ar">البريد الإلكتروني</td>
                        <td class="card-title-en">Email</td>
                      </tr>
                    </table>
                    <div class="card-value" style="font-size: 11.5px; direction: ltr; text-align: right; font-family: 'DIN Next Arabic', sans-serif;">${esc(data.donorEmail || "—")}</div>
                  </div>
                </td>
                <td style="width: 50%; padding: 0; vertical-align: top;">
                  <div class="card-box">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td class="card-title-ar">تاريخ ووقت الإصدار</td>
                        <td class="card-title-en">Issue Date</td>
                      </tr>
                    </table>
                    <div class="card-value" style="font-size: 11.5px; direction: rtl; text-align: right;">${formattedDateAr} — ${formattedTimeAr}</div>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <!-- القسم الخامس: جدول بنود وتفاصيل التبرع والبرامج بالتفصيل الكامل -->
          <div style="margin-bottom: 14px; border: 1.5px solid #cbd5e1; border-radius: 14px; overflow: hidden; background: #ffffff;">
            <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <tr>
                <td style="padding: 7px 14px; font-size: 11.5px; font-weight: 900; color: #064e3b; direction: rtl; text-align: right;">
                  تفاصيل وبنود التبرع المعتمدة
                </td>
                <td style="padding: 7px 14px; font-size: 9px; font-weight: 800; color: #64748b; direction: ltr; text-align: left; text-transform: uppercase;">
                  Itemized Allocation Details
                </td>
              </tr>
            </table>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; direction: rtl; text-align: right;">
              <thead>
                <tr style="background: #f1f5f9; border-bottom: 1.5px solid #cbd5e1; color: #475569; font-weight: 800; font-size: 10px;">
                  <th style="padding: 7px 8px; width: 34px; text-align: center;">#</th>
                  <th style="padding: 7px 12px; text-align: right;">البند / البرنامج المستهدف</th>
                  <th style="padding: 7px 12px; width: 150px; text-align: center;">التصنيف</th>
                  <th style="padding: 7px 8px; width: 50px; text-align: center;">العدد</th>
                  <th style="padding: 7px 12px; width: 125px; text-align: left; direction: ltr;">المبلغ</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
              <tfoot>
                <tr style="background: #ecfdf5; border-top: 1.5px solid #a7f3d0; font-weight: 900; color: #064e3b;">
                  <td colspan="4" style="padding: 8px 12px; text-align: right;">إجمالي التبرع المعتمد بالجنيه المصري:</td>
                  <td style="padding: 8px 12px; text-align: left; direction: ltr; font-size: 12.5px;">${amountNumberStr} ج.م</td>
                </tr>
              </tfoot>
            </table>
            ${notesHtml}
          </div>

          <!-- القسم السادس: التوثيق الرسمي والختم المعتمد -->
          <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 14px; padding: 12px 18px; margin-bottom: 14px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <!-- النص القانوني المعتمد -->
                <td style="vertical-align: middle; text-align: right; direction: rtl; padding-left: 14px;">
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 12px; font-weight: 900; color: #064e3b;">توثيق رسمي وقانوني</span>
                  </div>
                  <div style="font-size: 10px; color: #334155; line-height: 1.6; font-weight: 700;">
                    هذا الإيصال معتمد إلكترونيًا من مؤسسة اليسر الخيرية ولا يحتاج إلى توقيع خطي، وهو مسجل رسميًا في السجلات المالية للمؤسسة بموجب ترخيص وزارة التضامن الاجتماعي رقم 2665 لسنة 2019.
                  </div>
                </td>

                <!-- الختم الإلكتروني الرسمي المعتمد لمؤسسة اليسر بنفس خط وهوية الموقع عبر SVG المدعوم 100% -->
                <td style="vertical-align: middle; text-align: center; width: 85px;">
                  <svg width="84" height="84" viewBox="0 0 100 100" style="display: block; margin: 0 auto;">
                    <!-- الإطار الخارجي المنقط -->
                    <circle cx="50" cy="50" r="46" fill="#ffffff" stroke="#047857" stroke-width="2" stroke-dasharray="4 2" />
                    <!-- الإطار الداخلي الناعم -->
                    <circle cx="50" cy="50" r="41" fill="#ecfdf5" stroke="#059669" stroke-width="1.2" />
                    <!-- نصوص الختم الرسمية المعتمدة -->
                    <text x="50" y="27" text-anchor="middle" font-family="'DIN Next Arabic', 'Droid Arabic Kufi', sans-serif" font-size="8.5" font-weight="900" fill="#047857">مؤسسة اليسر</text>
                    <line x1="24" y1="32" x2="76" y2="32" stroke="#10b981" stroke-width="0.8" />
                    <text x="50" y="53" text-anchor="middle" font-family="'DIN Next Arabic', 'Droid Arabic Kufi', sans-serif" font-size="14.5" font-weight="900" fill="#064e3b">مُعْتَمَدْ</text>
                    <line x1="24" y1="59" x2="76" y2="59" stroke="#10b981" stroke-width="0.8" />
                    <text x="50" y="71" text-anchor="middle" font-family="'DIN Next Arabic', 'Droid Arabic Kufi', sans-serif" font-size="8.5" font-weight="900" fill="#047857">2019 / 2665</text>
                    <text x="50" y="82" text-anchor="middle" font-family="'DIN Next Arabic', 'Droid Arabic Kufi', sans-serif" font-size="6.5" font-weight="800" fill="#059669">وزارة التضامن</text>
                  </svg>
                </td>
              </tr>
            </table>
          </div>

          <!-- القسم السابع والأخير: الفوتر الرسمي المتناسق في أسفل الإيصال -->
          <div style="border-top: 1.5px solid #e2e8f0; padding-top: 10px; text-align: center;">
            <div style="font-size: 11px; font-weight: 900; color: #064e3b; margin-bottom: 2px;">
              مؤسسة اليسر الخيرية — معًا نوصل صدقتك إلى من يستحقها
            </div>
            <div style="font-size: 9px; font-weight: 700; color: #64748b;">
              المقر الرئيسي: المنصورة، الدقهلية، جمهورية مصر العربية | هاتف: 01097000137 | https://elyusr.org
            </div>
            <div style="font-size: 8px; color: #94a3b8; margin-top: 3px; direction: ltr; font-weight: 600;">
              Transaction ID: ${esc(data.ref)} • Electronic Proof of Donation • Al-Yusr Financial Core System
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // إعطاء مهلة آمنة للمتصفح لتصيير الحاوية المعزولة
  await new Promise((resolve) => setTimeout(resolve, 150));

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // جودة طباعة نقية
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc, clonedEl) => {
        // في النسخة المستنسخة الخاصة بـ html2canvas فقط: نضعها في (0, 0) بظهور كامل
        clonedEl.style.position = "static";
        clonedEl.style.left = "0px";
        clonedEl.style.top = "0px";
        clonedEl.style.opacity = "1";
        clonedEl.style.visibility = "visible";

        // حماية تامة ضد التمرير: تصفير كل إزاحات التمرير في الصفحة المستنسخة حتى لا ينتج ملف أبيض أو فارغ
        clonedDoc.defaultView?.scrollTo(0, 0);
        if (clonedDoc.documentElement) {
          clonedDoc.documentElement.scrollTop = 0;
          clonedDoc.documentElement.scrollLeft = 0;
        }
        if (clonedDoc.body) {
          clonedDoc.body.scrollTop = 0;
          clonedDoc.body.scrollLeft = 0;
        }
      },
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    // رسم صورة الإيصال المعتمدة على صفحة الـ PDF بدقة A4 كاملة
    pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);

    // استخراج ملف PDF بصيغة Blob مع تحديد النوع الدقيق application/pdf
    const pdfBlob = pdf.output("blob");
    const blobUrl = URL.createObjectURL(
      new Blob([pdfBlob], { type: "application/pdf" })
    );

    // تنظيف كود الإيصال لضمان تسمية ملف نظامية تنتهي بامتداد .pdf دائماً
    const cleanRef = String(data.ref || "receipt")
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `alyusr-receipt-${cleanRef}.pdf`;

    // إنشاء الرابط وإضافته صراحة إلى document.body للتحميل النظيف
    const downloadLink = document.createElement("a");
    downloadLink.style.display = "none";
    downloadLink.href = blobUrl;
    downloadLink.setAttribute("download", fileName);
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);

    downloadLink.click();

    setTimeout(() => {
      if (downloadLink.parentNode) {
        downloadLink.parentNode.removeChild(downloadLink);
      }
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}
