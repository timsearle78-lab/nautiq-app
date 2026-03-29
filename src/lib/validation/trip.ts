import { z } from "zod";

const nullableNumberInput = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === "") return null;
    const num = typeof value === "number" ? value : Number(value);
    return Number.isFinite(num) ? num : NaN;
  })
  .refine((value) => value === null || !Number.isNaN(value), {
    message: "Must be a valid number",
  });

export const tripSourceSchema = z.enum([
  "manual",
  "ai_quick_log",
  "voice_transcribed",
  "panel_photo_assisted",
]);

export const saveTripSchema = z
  .object({
    boatId: z.string().uuid("Invalid boat ID"),
    startedAt: z.string().min(1, "Start time is required"),
    endedAt: z.string().optional().nullable(),
    engineHoursDelta: nullableNumberInput,
    engineHoursStart: nullableNumberInput,
    engineHoursEnd: nullableNumberInput,
    fuelAddedLitres: nullableNumberInput,
    notes: z.string().optional().nullable(),
    rawInput: z.string().optional().nullable(),
    source: tripSourceSchema.default("manual"),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startedAt);
    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startedAt"],
        message: "Start time is invalid",
      });
    }

    if (data.endedAt) {
      const end = new Date(data.endedAt);
      if (Number.isNaN(end.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endedAt"],
          message: "End time is invalid",
        });
      } else if (!Number.isNaN(start.getTime()) && end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endedAt"],
          message: "End time cannot be before start time",
        });
      }
    }

    if (data.engineHoursDelta !== null && data.engineHoursDelta < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["engineHoursDelta"],
        message: "Engine hours delta cannot be negative",
      });
    }

    if (data.engineHoursStart !== null && data.engineHoursStart < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["engineHoursStart"],
        message: "Engine hours start cannot be negative",
      });
    }

    if (data.engineHoursEnd !== null && data.engineHoursEnd < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["engineHoursEnd"],
        message: "Engine hours end cannot be negative",
      });
    }

    if (
      data.engineHoursStart !== null &&
      data.engineHoursEnd !== null &&
      data.engineHoursEnd < data.engineHoursStart
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["engineHoursEnd"],
        message: "Engine hours end cannot be less than start",
      });
    }

    if (data.fuelAddedLitres !== null && data.fuelAddedLitres < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fuelAddedLitres"],
        message: "Fuel added cannot be negative",
      });
    }

    const hasDelta = data.engineHoursDelta !== null;
    const hasStartEnd =
      data.engineHoursStart !== null && data.engineHoursEnd !== null;

    if (!hasDelta && !hasStartEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["engineHoursDelta"],
        message:
          "Provide engine hours used, or both engine start and end readings",
      });
    }
  });

export type SaveTripInput = z.infer<typeof saveTripSchema>;