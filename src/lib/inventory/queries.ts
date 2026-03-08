import { createClient } from "@/lib/supabase/server";

export type InventoryItemRow = {
  id: string;
  user_id: string;
  boat_id: string;
  component_id: string | null;
  name: string;
  category: string | null;
  sku: string | null;
  manufacturer: string | null;
  quantity: number;
  minimum_quantity: number | null;
  unit: string | null;
  storage_location: string | null;
  notes: string | null;
  is_critical: boolean;
  created_at: string;
  updated_at: string;
  component: {
    id: string;
    name: string;
  } | null;
};

type InventoryItemQueryRow = {
  id: string;
  user_id: string;
  boat_id: string;
  component_id: string | null;
  name: string;
  category: string | null;
  sku: string | null;
  manufacturer: string | null;
  quantity: number;
  minimum_quantity: number | null;
  unit: string | null;
  storage_location: string | null;
  notes: string | null;
  is_critical: boolean;
  created_at: string;
  updated_at: string;
  component:
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null;
};

export type MissingCriticalSpareRow = {
  id: string;
  component_id: string | null;
  name: string;
  category: string | null;
  quantity: number;
  unit: string | null;
  storage_location: string | null;
};

export type ActivityFeedRow = {
  id: string;
  user_id: string;
  boat_id: string;
  event_type: string;
  source_table: string;
  source_id: string;
  title: string;
  description: string | null;
  event_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function getInventoryItems(
  boatId: string
): Promise<InventoryItemRow[]> {
  if (!boatId) {
    throw new Error("getInventoryItems requires a boatId");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory_items")
    .select(`
      id,
      user_id,
      boat_id,
      component_id,
      name,
      category,
      sku,
      manufacturer,
      quantity,
      minimum_quantity,
      unit,
      storage_location,
      notes,
      is_critical,
      created_at,
      updated_at,
      component:components (
        id,
        name
      )
    `)
    .eq("boat_id", boatId)
    .order("is_critical", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load inventory: ${error.message}`);
  }

  const rows = (data ?? []) as InventoryItemQueryRow[];

  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    boat_id: row.boat_id,
    component_id: row.component_id,
    name: row.name,
    category: row.category,
    sku: row.sku,
    manufacturer: row.manufacturer,
    quantity: row.quantity,
    minimum_quantity: row.minimum_quantity,
    unit: row.unit,
    storage_location: row.storage_location,
    notes: row.notes,
    is_critical: row.is_critical,
    created_at: row.created_at,
    updated_at: row.updated_at,
    component: Array.isArray(row.component)
      ? row.component[0] ?? null
      : row.component ?? null,
  }));
}

export async function getBoatComponents(boatId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("components")
    .select("id,name")
    .eq("boat_id", boatId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load components: ${error.message}`);
  }

  return data ?? [];
}

export async function getMissingCriticalSpares(boatId: string) {
    if (!boatId) {
      throw new Error("getMissingCriticalSpares requires a boatId");
    }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_missing_critical_spares", {
    p_boat_id: boatId,
  });

  if (error) {
    throw new Error(`Failed to load missing critical spares: ${error.message}`);
  }

  return (data ?? []) as MissingCriticalSpareRow[];
}

export async function getRecentActivity(boatId: string, limit = 8) {
  if (!boatId) {
    throw new Error("getRecentActivity requires a boatId");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_activity_feed", {
    p_boat_id: boatId,
    p_limit: limit,
  });

  if (error) {
    throw new Error(`Failed to load activity feed: ${error.message}`);
  }

  return (data ?? []) as ActivityFeedRow[];
}