import { createClient } from "@/lib/supabase/server";

export type ComponentDetail = {
  id: string;
  user_id: string;
  boat_id: string;
  system_id: string | null;
  name: string;
  notes: string | null;
  interval_months: number | null;
  interval_hours: number | null;
  created_at: string;
  system: {
    id: string;
    name: string;
  } | null;
  boat: {
    id: string;
    name: string;
    type: string | null;
  } | null;
};

export type MaintenanceHistoryRow = {
  id: string;
  performed_at: string | null;
  work_done: string | null;
  cost: number | null;
  currency: string | null;
  vendor: string | null;
  invoice_ref: string | null;
  created_at: string;
};

export type LinkedInventoryRow = {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  minimum_quantity: number | null;
  unit: string | null;
  storage_location: string | null;
  is_critical: boolean;
};

export async function getComponentDetail(componentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("components")
    .select(`
      id,
      user_id,
      boat_id,
      system_id,
      name,
      notes,
      interval_months,
      interval_hours,
      created_at,
      system:systems (
        id,
        name
      ),
      boat:boats (
        id,
        name,
        type
      )
    `)
    .eq("id", componentId)
    .single();

  if (error) {
    throw new Error(`Failed to load component: ${error.message}`);
  }

  return data as ComponentDetail;
}

export async function getComponentMaintenanceHistory(componentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("maintenance_events")
    .select(`
      id,
      performed_at,
      work_done,
      cost,
      currency,
      vendor,
      invoice_ref,
      created_at
    `)
    .eq("component_id", componentId)
    .order("performed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load maintenance history: ${error.message}`);
  }

  return (data ?? []) as MaintenanceHistoryRow[];
}

export async function getLinkedInventory(componentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory_items")
    .select(`
      id,
      name,
      category,
      quantity,
      minimum_quantity,
      unit,
      storage_location,
      is_critical
    `)
    .eq("component_id", componentId)
    .order("is_critical", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load linked inventory: ${error.message}`);
  }

  return (data ?? []) as LinkedInventoryRow[];
}

export async function getLatestBoatEngineHours(boatId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trips")
    .select("engine_hours_delta, ended_at, created_at")
    .eq("boat_id", boatId)
    .not("engine_hours_delta", "is", null)
    .order("ended_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load latest engine hours: ${error.message}`);
  }

  return data?.total_engine_hours ?? null;
}