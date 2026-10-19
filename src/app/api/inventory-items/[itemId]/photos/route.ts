import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PHOTOS = 3;

function resolveFileInfo(file: File): { ext: string; contentType: string } | null {
  const BY_TYPE: Record<string, { ext: string; contentType: string }> = {
    "image/jpeg": { ext: "jpg", contentType: "image/jpeg" },
    "image/png":  { ext: "png", contentType: "image/png" },
    "image/webp": { ext: "webp", contentType: "image/webp" },
    "image/heic": { ext: "heic", contentType: "image/heic" },
    "image/heif": { ext: "heif", contentType: "image/heif" },
  };
  if (BY_TYPE[file.type]) return BY_TYPE[file.type];
  const n = file.name.toLowerCase();
  if (n.endsWith(".heic")) return { ext: "heic", contentType: "image/heic" };
  if (n.endsWith(".heif")) return { ext: "heif", contentType: "image/heif" };
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return { ext: "jpg", contentType: "image/jpeg" };
  if (n.endsWith(".png"))  return { ext: "png",  contentType: "image/png" };
  if (n.endsWith(".webp")) return { ext: "webp", contentType: "image/webp" };
  return null;
}

async function getAuthedItem(supabase: Awaited<ReturnType<typeof createClient>>, itemId: string, userId: string) {
  const { data: item } = await supabase
    .from("inventory_items")
    .select("id, user_id, boat_id, photo_urls")
    .eq("id", itemId)
    .single();

  if (!item) return null;
  if (item.user_id === userId) return item;

  // Check co-owner access
  const { data: membership } = await supabase
    .from("boat_members")
    .select("id")
    .eq("boat_id", item.boat_id)
    .eq("user_id", userId)
    .maybeSingle();

  return membership ? item : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  const item = await getAuthedItem(supabase, itemId, user.id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = (item.photo_urls as string[] | null) ?? [];
  if (existing.length >= MAX_PHOTOS) {
    return NextResponse.json({ error: `Maximum ${MAX_PHOTOS} photos allowed` }, { status: 400 });
  }

  const formData = await req.formData();
  const files = formData.getAll("photos") as File[];
  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

  const uploadedUrls: string[] = [];
  const slots = MAX_PHOTOS - existing.length;

  for (const file of files.slice(0, slots)) {
    const info = resolveFileInfo(file);
    if (!info) { console.warn("Rejected unrecognised file:", file.name, file.type); continue; }
    if (file.size > MAX_FILE_SIZE) { console.warn("Rejected oversized file:", file.size); continue; }
    const { ext, contentType } = info;

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${user.id}/${itemId}/${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("inventory-photos")
      .upload(path, buffer, { contentType, upsert: false });

    if (uploadError) { console.error("Upload error:", uploadError.message); continue; }

    const { data: { publicUrl } } = supabase.storage.from("inventory-photos").getPublicUrl(path);
    uploadedUrls.push(publicUrl);
  }

  if (!uploadedUrls.length) {
    return NextResponse.json({ error: "All uploads failed" }, { status: 500 });
  }

  const merged = [...existing, ...uploadedUrls];
  const { error: updateError } = await supabase
    .from("inventory_items")
    .update({ photo_urls: merged })
    .eq("id", itemId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ urls: uploadedUrls });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  const item = await getAuthedItem(supabase, itemId, user.id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { url } = await req.json() as { url: string };
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const existing = (item.photo_urls as string[] | null) ?? [];
  if (!existing.includes(url)) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  // Extract storage path from public URL: everything after /inventory-photos/
  const marker = "/inventory-photos/";
  const markerIdx = url.indexOf(marker);
  if (markerIdx !== -1) {
    const storagePath = url.slice(markerIdx + marker.length);
    await supabase.storage.from("inventory-photos").remove([storagePath]);
  }

  const updated = existing.filter((u) => u !== url);
  const { error: updateError } = await supabase
    .from("inventory_items")
    .update({ photo_urls: updated })
    .eq("id", itemId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
