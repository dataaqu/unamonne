"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type VariantRowValue = {
  label: string;
  sku: string;
  stock: number;
  isMadeToOrder: boolean;
};

export type SpecRowValue = { label: string; value: string };

/**
 * Repeatable rows of plain inputs. The row index is only used to key the React
 * list and to tag the made-to-order checkbox — the server reads the columns as
 * parallel arrays, so adding and removing rows needs no ids and no JSON blob.
 */
export function VariantRows({ initial }: { initial: VariantRowValue[] }) {
  const t = useTranslations("Admin.form");
  const [rows, setRows] = useState<VariantRowValue[]>(
    initial.length > 0 ? initial : [],
  );

  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-medium">{t("variants")}</legend>
      <p className="text-xs text-muted-foreground">{t("variantsHelp")}</p>

      {rows.map((row, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_1fr_90px_auto_auto] items-end gap-2"
        >
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">
              {t("variantLabel")}
            </span>
            <Input name="variantLabel" defaultValue={row.label} required />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">{t("sku")}</span>
            <Input name="variantSku" defaultValue={row.sku} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">{t("stock")}</span>
            <Input
              name="variantStock"
              type="number"
              min={0}
              defaultValue={row.stock}
            />
          </label>
          <label className="flex items-center gap-2 pb-1.5 text-xs">
            <input
              type="checkbox"
              name="variantMadeToOrder"
              value={index}
              defaultChecked={row.isMadeToOrder}
              className="size-4"
            />
            {t("madeToOrder")}
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRows(rows.filter((_, i) => i !== index))}
          >
            {t("delete")}
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          setRows([
            ...rows,
            { label: "", sku: "", stock: 0, isMadeToOrder: false },
          ])
        }
      >
        {t("addVariant")}
      </Button>
    </fieldset>
  );
}

export function SpecRows({
  locale,
  initial,
}: {
  locale: "ka" | "en";
  initial: SpecRowValue[];
}) {
  const t = useTranslations("Admin.form");
  const [rows, setRows] = useState<SpecRowValue[]>(initial);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{t("specs")}</p>

      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input
            name={`specLabel_${locale}`}
            defaultValue={row.label}
            placeholder={t("specLabel")}
          />
          <Input
            name={`specValue_${locale}`}
            defaultValue={row.value}
            placeholder={t("specValue")}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRows(rows.filter((_, i) => i !== index))}
          >
            {t("delete")}
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setRows([...rows, { label: "", value: "" }])}
      >
        {t("addSpec")}
      </Button>
    </div>
  );
}
