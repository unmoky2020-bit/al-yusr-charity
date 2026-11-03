import { Children, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { NiceSelect, fromNice, toNice, type NiceOption } from "@/components/common/NiceSelect";
import { useLang } from "@/i18n/LangContext";

type SelectEvent = { target: { value: string }; currentTarget: { value: string } };

/** Text of an <option>'s children ("الحالة: ", s → "الحالة: paid"). */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

function optionsOf(children: ReactNode): NiceOption[] {
  const out: NiceOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>;
    if (el.type === "option") {
      const label = textOf(el.props.children);
      const value = el.props.value !== undefined ? String(el.props.value) : label;
      out.push({ value: toNice(value), label: label || " ", disabled: el.props.disabled });
    } else if (el.props.children) {
      out.push(...optionsOf(el.props.children)); // fragments / groups
    }
  });
  return out;
}

/**
 * Drop-in for a native <select>/<option> list, drawn with the site's dropdown (NiceSelect):
 * same `value` / `onChange={(e) => … e.target.value}` / <option> children, branded open list.
 */
export function UiSelect({
  value,
  defaultValue,
  onChange,
  children,
  className = "",
  disabled,
  id,
  "aria-label": ariaLabel,
}: {
  value?: string | number | null;
  /** uncontrolled, like a native select */
  defaultValue?: string | number | null;
  onChange?: (e: SelectEvent) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  const { lang } = useLang();
  const options = optionsOf(children);
  const [own, setOwn] = useState(defaultValue === null || defaultValue === undefined ? "" : String(defaultValue));
  const controlled = value !== undefined;
  const current = toNice(controlled ? (value === null ? "" : String(value)) : own);
  return (
    <NiceSelect
      id={id}
      value={options.some((o) => o.value === current) ? current : options[0]?.value ?? current}
      onChange={(v) => {
        const val = fromNice(v);
        if (!controlled) setOwn(val);
        onChange?.({ target: { value: val }, currentTarget: { value: val } });
      }}
      options={options}
      ariaLabel={ariaLabel || options[0]?.label || "select"}
      dir={lang === "ar" ? "rtl" : "ltr"}
      disabled={disabled}
      size="sm"
      // A native select is as wide as its text unless told otherwise; keep that.
      className={/(^|\s)(w-|flex-1|min-w-)/.test(className) ? className : `w-auto min-w-[9rem] ${className}`}
    />
  );
}
