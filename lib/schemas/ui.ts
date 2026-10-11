import { z } from "zod";

const dict = z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/), z.string());

/** Firestore `settings/ui`: short interface strings per locale. */
export const uiLabelsSchema = z.object({
  en: dict,
  bn: dict.default({}),
});

export type UiLabels = z.infer<typeof uiLabelsSchema>;
