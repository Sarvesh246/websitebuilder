import { emptyValues, type InquiryValues } from "./schema";

export type InquiryDraft = {
  values: InquiryValues;
  step: number;
  reached: number;
  startedAt?: number;
  submissionId?: string;
};

/** Browser storage can contain old versions or malformed data. Never cast it straight into form state. */
export const parseInquiryDraft = (raw: string | null): InquiryDraft | null => {
  try {
    const draft = JSON.parse(raw ?? "null");
    if (!draft || !draft.values || typeof draft.values !== "object" || !Number.isInteger(draft.step)) return null;
    const values = { ...emptyValues, links: [""], features: [] } as InquiryValues;
    for (const key of Object.keys(emptyValues) as (keyof InquiryValues)[]) {
      const value = draft.values[key];
      if (key === "links" || key === "features") {
        if (Array.isArray(value))
          values[key] = value.filter((item): item is string => typeof item === "string").slice(0, 30);
      } else if (typeof value === "string") {
        Object.assign(values, { [key]: value.slice(0, 10000) });
      }
    }
    return {
      values,
      step: draft.step,
      reached: Number.isInteger(draft.reached) ? draft.reached : draft.step,
      startedAt:
        typeof draft.startedAt === "number" && Number.isFinite(draft.startedAt) && draft.startedAt > 0
          ? draft.startedAt
          : undefined,
      submissionId:
        typeof draft.submissionId === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(draft.submissionId)
          ? draft.submissionId
          : undefined,
    };
  } catch {
    return null;
  }
};
