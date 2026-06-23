"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type MaintenanceActionState = {
  error?: string;
  success?: string;
};

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function logMaintenance(
  _prevState: MaintenanceActionState,
  formData: FormData
): Promise<MaintenanceActionState> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "You must be signed in." };
    }

    const componentId = String(formData.get("component_id") ?? "").trim();
    const boatId = String(formData.get("boat_id") ?? "").trim();
    const performedAt = String(formData.get("performed_at") ?? "").trim();
    const workDone = String(formData.get("work_done") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim() || null;
    const vendor = String(formData.get("vendor") ?? "").trim() || null;
    const engineHoursAtService = parseOptionalNumber(
      formData.get("engine_hours_at_service")
    );

    const inventoryItemId =
      String(formData.get("inventory_item_id") ?? "").trim() || null;
    const consumeInventory = !!inventoryItemId;
    const inventoryQuantityUsed = parseOptionalNumber(
      formData.get("inventory_quantity_used")
    );

    if (!componentId) return { error: "Component is required." };
    if (!boatId) return { error: "Boat is required." };
    if (!performedAt) return { error: "Performed date is required." };
    if (!workDone) return { error: "Work done is required." };

    const { error: insertError } = await supabase
      .from("maintenance_events")
      .insert({
        user_id: user.id,
        boat_id: boatId,
        component_id: componentId,
        performed_at: performedAt,
        work_done: workDone,
        notes,
        vendor,
        engine_hours_at_service: engineHoursAtService,
      });

    if (insertError) {
      return { error: `Failed to log maintenance: ${insertError.message}` };
    }

    const componentUpdatePayload: {
      last_serviced_at: string;
      last_serviced_hours?: number | null;
    } = {
      last_serviced_at: performedAt,
    };

    if (engineHoursAtService != null) {
      componentUpdatePayload.last_serviced_hours = engineHoursAtService;
    }

    const { error: componentUpdateError } = await supabase
      .from("components")
      .update(componentUpdatePayload)
      .eq("id", componentId)
      .eq("boat_id", boatId)
      .eq("user_id", user.id);

    if (componentUpdateError) {
      return {
        error: `Maintenance logged, but component update failed: ${componentUpdateError.message}`,
      };
    }

    if (consumeInventory) {
      if (inventoryQuantityUsed == null || inventoryQuantityUsed <= 0) {
        return { error: "Inventory quantity used must be greater than zero." };
      }

      const { error: consumeError } = await supabase.rpc(
        "adjust_inventory_stock",
        {
          p_inventory_item_id: inventoryItemId,
          p_transaction_type: "consume",
          p_quantity_delta: inventoryQuantityUsed,
          p_notes: `Used during maintenance: ${workDone}`,
        }
      );

      if (consumeError) {
        return {
          error: `Maintenance logged, but inventory update failed: ${consumeError.message}`,
        };
      }
    }

    revalidatePath(`/components/${componentId}`);
    revalidatePath(`/components/${componentId}#log-maintenance`);
    revalidatePath(`/components?boat=${boatId}`);
    revalidatePath("/components");
    revalidatePath(`/maintenance?boat=${boatId}`);
    revalidatePath("/maintenance");
    revalidatePath(`/inventory?boat=${boatId}`);
    revalidatePath("/inventory");

    return { success: "Maintenance logged." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to log maintenance.",
    };
  }
}

export type ComponentActionState = { error?: string; success?: string };

export async function updateComponent(
  _prev: ComponentActionState,
  formData: FormData
): Promise<ComponentActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const system_id = String(formData.get("system_id") ?? "").trim() || null;
  const install_date = String(formData.get("install_date") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  function parseOpt(val: FormDataEntryValue | null): number | null {
    const t = String(val ?? "").trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }

  const service_interval_years = parseOpt(formData.get("service_interval_years"));
  const service_interval_months = parseOpt(formData.get("service_interval_months"));
  const service_interval_days = parseOpt(formData.get("service_interval_days"));
  const service_interval_engine_hours = parseOpt(formData.get("service_interval_engine_hours"));

  if (!name) return { error: "Component name is required." };

  const { error } = await supabase
    .from("components")
    .update({ name, system_id, install_date, notes, service_interval_years, service_interval_months, service_interval_days, service_interval_engine_hours })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/components/${id}`);
  revalidatePath("/components");
  revalidatePath("/maintenance");
  return { success: "Component updated." };
}

export async function deleteComponent(
  _prev: ComponentActionState,
  formData: FormData
): Promise<ComponentActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const id = String(formData.get("id") ?? "").trim();

  const { error } = await supabase
    .from("components")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/components");
  revalidatePath("/maintenance");
  redirect("/components");
}