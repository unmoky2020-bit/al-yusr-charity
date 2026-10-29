/**
 * FAQ shown on a program page = the questions of ONE category from the FAQ screen:
 *   1. the category linked in the dashboard (program → «الأسئلة الشائعة» tab, column faq_category_id)
 *   2. else the category whose slug matches the program (PROGRAM_FAQ_CATEGORY below for the exceptions)
 *   3. else the general "programs" category
 * The same list feeds the visible FAQ section and the FAQPage JSON-LD.
 */
import { useEffect, useState } from "react";
import { fetchFaqs, type FaqItem } from "@/data/faqsApi";
import type { ProgramContent } from "@/data/programs";

export type QA = { q: string; a: string };

/** Program slug → FAQ category slug, where they differ. Any other program uses a category with its own slug. */
export const PROGRAM_FAQ_CATEGORY: Record<string, string> = {
  odhya: "qurbani",
  qurbani: "qurbani",
  zakat: "zakat",
  markoun: "markoun",
};

export const GENERAL_PROGRAMS_FAQ_CATEGORY = "programs";

export const faqCategoryForProgram = (slug: string): string => PROGRAM_FAQ_CATEGORY[slug] ?? slug;

const MAX_FAQS = 8;

const toQA = (items: FaqItem[], isRTL: boolean): QA[] =>
  items
    .filter((f) => f.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((f) => ({
      q: (isRTL ? f.question_ar : f.question_en || f.question_ar) || "",
      a: (isRTL ? f.answer_ar : f.answer_en || f.answer_ar) || "",
    }))
    .filter((f) => f.q && f.a);

/** Keeps the first occurrence of each question (case/space-insensitive). */
export function dedupeFaqs(list: QA[]): QA[] {
  const seen = new Set<string>();
  return list.filter((f) => {
    const k = f.q.replace(/\s+/g, " ").trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function useProgramFaqs(program: ProgramContent | undefined, isRTL: boolean, fallback: QA[]): QA[] {
  const [linked, setLinked] = useState<QA[] | null>(null);
  const slug = program?.slug;
  const linkedCategory = program?.faqCategory;

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    setLinked(null);
    (async () => {
      const category = linkedCategory || faqCategoryForProgram(slug);
      // fetchFaqs falls back to the curated static FAQs when the API is unreachable.
      let items = await fetchFaqs({ categorySlug: category });
      if (!items.length) {
        items = await fetchFaqs({ categorySlug: GENERAL_PROGRAMS_FAQ_CATEGORY });
      }
      if (alive) setLinked(toQA(items, isRTL));
    })().catch(() => alive && setLinked([]));
    return () => {
      alive = false;
    };
  }, [slug, linkedCategory, isRTL]);

  const merged = dedupeFaqs(linked ?? []).slice(0, MAX_FAQS);
  return merged.length ? merged : fallback;
}
