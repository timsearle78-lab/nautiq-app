"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AddComponentActionState = {
  error?: string;
  success?: string;
  componentId?: string;
};

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createComponent(
  _prevState: AddComponentActionState,
  formData: FormData
): Promise<AddComponentActionState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "You must be signed in." };
  }

  const boatId = String(formData.get("boat_id") ?? "").trim();
  const systemId = String(formData.get("system_id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const installDate = String(formData.get("install_date") ?? "").trim() || null;
  const serviceIntervalYears = parseOptionalNumber(formData.get("service_interval_years"));
  const serviceIntervalMonths = parseOptionalNumber(formData.get("service_interval_months"));
  const serviceIntervalDays = parseOptionalNumber(formData.get("service_interval_days"));
  const serviceIntervalEngineHours = parseOptionalNumber(formData.get("service_interval_engine_hours"));

  if (!boatId) {
    return { error: "Boat is required." };
  }

  if (!name) {
    return { error: "Component name is required." };
  }

  if (!systemId) {
    return { error: "Please select a system for this component." };
  }

  const { data, error } = await supabase
    .from("components")
    .insert({
      user_id: user.id,
      boat_id: boatId,
      system_id: systemId,
      name,
      notes,
      install_date: installDate,
      service_interval_years: serviceIntervalYears,
      service_interval_months: serviceIntervalMonths,
      service_interval_days: serviceIntervalDays,
      service_interval_engine_hours: serviceIntervalEngineHours,
    })
    .select("id")
    .single();

  if (error || !data) {
    const msg = error?.message ?? "";
    if (msg.includes("system_id")) return { error: "Please select a system for this component." };
    if (msg.includes("unique") || msg.includes("duplicate")) return { error: "A component with this name already exists." };
    return { error: "Something went wrong saving the component — please try again." };
  }

  const noRedirect = formData.get("no_redirect") === "1";
  if (noRedirect) {
    return { success: "Component created", componentId: data.id };
  }
  redirect(`/components/${data.id}`);
}