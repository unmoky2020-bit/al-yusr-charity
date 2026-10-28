import ExcelJS from "exceljs";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  align?: "center" | "right" | "left";
  numFmt?: string;
  isAmount?: boolean;
}

export interface ExcelReportOptions {
  fileName: string;
  sheetName: string;
  reportTitle: string;
  categoryName?: string;
  metaItems?: { label: string; value: string | number }[];
  columns: ExcelColumn[];
  data: Record<string, any>[];
  summary?: {
    labelColumnKey?: string;
    label?: string;
    sumKeys?: string[];
    customSummaryValues?: Record<string, string | number>;
  };
}

/**
 * دالة مساعدة لتنزيل ملف إكسل منسق بهوية مؤسسة اليسر الرسمية
 * تدعم RTL العربية، ترويسة أنيقة، وتنسيق ألوان الجداول والخلايا وتنسيق المبالغ
 */
export async function exportStyledExcel({
  fileName,
  sheetName,
  reportTitle,
  categoryName = "تقرير رسمي",
  metaItems = [],
  columns,
  data,
  summary,
}: ExcelReportOptions): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "مؤسسة اليسر الخيرية";
  workbook.lastModifiedBy = "بوابة إدارة مؤسسة اليسر";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet(sheetName.slice(0, 31), {
    views: [{ rightToLeft: true }], // محاذاة من اليمين لليسار للعربية
    pageSetup: {
      orientation: "landscape",
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
    properties: {
      defaultRowHeight: 22,
    },
  });

  const totalCols = columns.length;
  if (totalCols === 0) return;

  // 1. ترويسة رئيسية عريضة باللون الأخضر الزمردي الداكن (هوية اليسر)
  const headerRow1 = worksheet.addRow(["مؤسسة اليسر الخيرية — Al-Yusr Charity Foundation"]);
  worksheet.mergeCells(1, 1, 1, totalCols);
  headerRow1.height = 36;
  const cellR1 = worksheet.getCell(1, 1);
  cellR1.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  cellR1.alignment = { vertical: "middle", horizontal: "center" };
  cellR1.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF064E3B" }, // Deep Emerald #064E3B
  };

  // 2. سطر الإشهار والرقم الوزاري
  const headerRow2 = worksheet.addRow(["مشهرة برقم 2665 لسنة 2019 — وزارة التضامن الاجتماعي جمهورية مصر العربية"]);
  worksheet.mergeCells(2, 1, 2, totalCols);
  headerRow2.height = 22;
  const cellR2 = worksheet.getCell(2, 1);
  cellR2.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFECFDF5" } };
  cellR2.alignment = { vertical: "middle", horizontal: "center" };
  cellR2.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF047857" }, // Medium Emerald #047857
  };

  // 3. عنوان التقرير والتصنيف
  const headerRow3 = worksheet.addRow([`📋 ${reportTitle} — [ ${categoryName} ]`]);
  worksheet.mergeCells(3, 1, 3, totalCols);
  headerRow3.height = 30;
  const cellR3 = worksheet.getCell(3, 1);
  cellR3.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FF064E3B" } };
  cellR3.alignment = { vertical: "middle", horizontal: "center" };
  cellR3.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE6F4EA" }, // Light Emerald Tint
  };
  cellR3.border = {
    top: { style: "thin", color: { argb: "FFA7F3D0" } },
    bottom: { style: "thin", color: { argb: "FFA7F3D0" } },
    left: { style: "thin", color: { argb: "FFA7F3D0" } },
    right: { style: "thin", color: { argb: "FFA7F3D0" } },
  };

  // 4. شريط البيانات الوصفية (تاريخ الاستخراج، عدد السجلات، إلخ)
  const dateStr = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const defaultMeta = [
    `تاريخ الإصدار: ${dateStr}`,
    `إجمالي السجلات: ${data.length}`,
    `الحالة: معتمد ومطابق للسجلات الرسمية`,
    ...metaItems.map((m) => `${m.label}: ${m.value}`),
  ];

  const metaRow = worksheet.addRow([defaultMeta.join("   |   ")]);
  worksheet.mergeCells(4, 1, 4, totalCols);
  metaRow.height = 22;
  const cellR4 = worksheet.getCell(4, 1);
  cellR4.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF475569" } };
  cellR4.alignment = { vertical: "middle", horizontal: "center" };
  cellR4.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8FAFC" },
  };
  cellR4.border = {
    bottom: { style: "medium", color: { argb: "FF059669" } },
  };

  // 5. سطر فاصل فارغ
  const spacerRow = worksheet.addRow([]);
  spacerRow.height = 8;

  // 6. ترويسة الجدول (أعمدة التقرير)
  const tableHeaderRowIndex = 6;
  const headerValues = columns.map((col) => col.header);
  const headerRow = worksheet.addRow(headerValues);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF065F46" }, // Emerald 800
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF047857" } },
      bottom: { style: "medium", color: { argb: "FF047857" } },
      left: { style: "thin", color: { argb: "FF047857" } },
      right: { style: "thin", color: { argb: "FF047857" } },
    };
  });

  // 7. صفوف البيانات مع تنسيق الخلايا ومحاذاتها والتناوب بالألوان (Zebra Striping)
  data.forEach((item, rowIdx) => {
    const rowValues = columns.map((col) => {
      const val = item[col.key];
      return val !== undefined && val !== null ? val : "—";
    });

    const dataRow = worksheet.addRow(rowValues);
    dataRow.height = 24;

    const isEven = rowIdx % 2 === 0;
    const bgColor = isEven ? "FFFFFFFF" : "FFF8FAFC"; // تناوب أبيض ورمادي/أخضر هادئ

    dataRow.eachCell((cell, colNumber) => {
      const colDef = columns[colNumber - 1];
      const align = colDef?.align || "center";

      cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF0F172A" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: align,
        wrapText: true,
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };

      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      // تنسيق المبالغ والأرقام إذا تم تحديدها
      if (colDef?.isAmount) {
        const numVal = parseFloat(String(cell.value).replace(/[^0-9.-]+/g, ""));
        if (!isNaN(numVal)) {
          cell.value = numVal;
          cell.numFmt = '#,##0.00 "ج.م"';
        }
      } else if (colDef?.numFmt) {
        cell.numFmt = colDef.numFmt;
      }

      // تلوين خاص لحالات الاعتماد والنجاح
      const strVal = String(cell.value).trim();
      if (strVal === "مكتمل" || strVal === "معتمد" || strVal === "100%" || strVal === "ناجح") {
        cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF047857" } };
      } else if (strVal === "نشطة" || strVal === "قيد التنفيذ") {
        cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0284C7" } };
      } else if (strVal === "معلق" || strVal === "قيد المراجعة") {
        cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFD97706" } };
      }
    });
  });

  // 8. سطر الإجمالي الكلي (Summary Row) إن وجد
  if (summary) {
    const summaryValues: any[] = new Array(totalCols).fill("");
    const labelKey = summary.labelColumnKey || columns[0]?.key;
    const labelColIndex = columns.findIndex((c) => c.key === labelKey);
    const labelColPos = labelColIndex !== -1 ? labelColIndex : 0;

    summaryValues[labelColPos] = summary.label || "المجموع الكلي المعتمد";

    // حساب المجاميع للأعمدة المطلوبة
    if (summary.sumKeys) {
      summary.sumKeys.forEach((key) => {
        const cIdx = columns.findIndex((c) => c.key === key);
        if (cIdx !== -1) {
          const sum = data.reduce((acc, row) => {
            const rawVal = row[key];
            const num = parseFloat(String(rawVal).replace(/[^0-9.-]+/g, ""));
            return acc + (isNaN(num) ? 0 : num);
          }, 0);
          summaryValues[cIdx] = sum;
        }
      });
    }

    // قيم مخصصة للسطر الإجمالي
    if (summary.customSummaryValues) {
      Object.entries(summary.customSummaryValues).forEach(([key, val]) => {
        const cIdx = columns.findIndex((c) => c.key === key);
        if (cIdx !== -1) {
          summaryValues[cIdx] = val;
        }
      });
    }

    const summaryRow = worksheet.addRow(summaryValues);
    summaryRow.height = 28;

    summaryRow.eachCell((cell, colNumber) => {
      const colDef = columns[colNumber - 1];
      cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FF064E3B" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: colDef?.align || "center",
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD1FAE5" }, // Soft Mint
      };
      cell.border = {
        top: { style: "medium", color: { argb: "FF059669" } },
        bottom: { style: "double", color: { argb: "FF059669" } },
        left: { style: "thin", color: { argb: "FFA7F3D0" } },
        right: { style: "thin", color: { argb: "FFA7F3D0" } },
      };

      if (colDef?.isAmount && typeof cell.value === "number") {
        cell.numFmt = '#,##0.00 "ج.م"';
      }
    });
  }

  // 9. تذييل التقرير الرسمي في الأسفل
  const footerSpacer = worksheet.addRow([]);
  footerSpacer.height = 10;

  const footerRow = worksheet.addRow([
    "مؤسسة اليسر الخيرية — تقرير معتمد صادر من لوحة الإدارة — الدقهلية، مصر | https://elyusr.org | info@elyusr.org | هاتف: 01015699781",
  ]);
  const footerRowIdx = worksheet.rowCount;
  worksheet.mergeCells(footerRowIdx, 1, footerRowIdx, totalCols);
  footerRow.height = 20;
  const footerCell = worksheet.getCell(footerRowIdx, 1);
  footerCell.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF64748B" } };
  footerCell.alignment = { vertical: "middle", horizontal: "center" };

  // 10. تحديد وتوسيع أبعاد الأعمدة تلقائياً لمنع أي اقتطاع أو ظهور "###"
  columns.forEach((col, idx) => {
    const wsCol = worksheet.getColumn(idx + 1);
    if (col.width) {
      wsCol.width = col.width;
    } else {
      let maxLen = (col.header || "").length;
      data.forEach((row) => {
        const valStr = String(row[col.key] || "");
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      // ضبط حد أدنى مريح ومناسب للغة العربية
      wsCol.width = Math.max(maxLen + 4, 16);
    }
  });

  // 11. توليد Buffer وتنزيل الملف في المتصفح
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const cleanDate = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}_${cleanDate}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
