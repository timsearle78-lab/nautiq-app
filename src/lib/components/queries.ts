import { createClient } from "@/lib/supabase/server";

export type ComponentDetail = {
  id: string;
  user_id: string;
  boat_id: string;
  system_id: string | null;
  name: string;
  notes: string | null;
  service_interval_days: number | null;
  service_interval_engine_hours: number | null;
  install_date: string | null;
  created_at: string;
  updated_at: string;
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

type ComponentDetailRow = {
  id: string;
  user_id: string;
  boat_id: string;
  system_id: string | null;
  name: string;
  notes: string | null;
  service_interval_days: number | null;
  service_interval_engine_hours: number | null;
  install_date: string | null;
  created_at: string;
  updated_at: string;
  system: { id: string; name: string }[] | null;
  boat: { id: string; name: string; type: string | null }[] | null;
};

export type MaintenanceHistoryRow = {
  id: string;
  performed_at: string | null;
  work_done: string | null;
  notes: string | null;
  cost: number | null;
  currency: string | null;
  vendor: string | null;
  invoice_ref: string | null;
  engine_hours_at_service: number | null;
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

export async function getComponentDetail(
  componentId: string
): Promise<ComponentDetail> {
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
      service_interval_days,
      service_interval_engine_hours,
      install_date,
      created_at,
      updated_at,
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

  const row = data as ComponentDetailRow;

  return {
    id: row.id,
    user_id: row.user_id,
    boat_id: row.boat_id,
    system_id: row.system_id,
    name: row.name,
    notes: row.notes,
    service_interval_days: row.service_interval_days,
    service_interval_engine_hours: row.service_interval_engine_hours,
    install_date: row.install_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    system: row.system?.[0] ?? null,
    boat: row.boat?.[0] ?? null,
  };
}

export async function getComponentMaintenanceHistory(componentId: string): Promise<MaintenanceHistoryRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("maintenance_events")
    .select(`
      id,
      performed_at,
      work_done,
      notes,
      cost,
      currency,
      vendor,
      invoice_ref,
      engine_hours_at_service,
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

export async function getLinkedInventory(componentId: string): Promise<LinkedInventoryRow[]> {
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

  return data?.engine_hours_delta ?? null;
}