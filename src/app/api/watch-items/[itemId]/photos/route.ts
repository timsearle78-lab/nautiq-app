import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png",
  "image/webp": "webp", "image/heic": "heic", "image/heif": "heif",
};
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PHOTOS = 3;

async function getAuthedItem(supabase: Awaited<ReturnType<typeof createClient>>, itemId: string, userId: string) {
  const { data } = await supabase
    .from("maintenance_watch_items")
    .select("id, user_id, photo_urls")
    .eq("id", itemId)
    .eq("user_id", userId)
    .single();
  return data;
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
    const ext = ALLOWED_TYPES[file.type];
    if (!ext || file.size > MAX_FILE_SIZE) continue;

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${user.id}/${itemId}/${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("watch-item-photos")
      .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: false });

    if (uploadError) { console.error("Upload error:", uploadError.message); continue; }

    const { data: { publicUrl } } = supabase.storage.from("watch-item-photos").getPublicUrl(path);
    uploadedUrls.push(publicUrl);
  }

  if (!uploadedUrls.length) {
    return NextResponse.json({ error: "All uploads failed" }, { status: 500 });
  }

  const { error } = await supabase
    .from("maintenance_watch_items")
    .update({ photo_urls: [...existing, ...uploadedUrls] })
    .eq("id", itemId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
  const existing = (item.photo_urls as string[] | null) ?? [];
  if (!existing.includes(url)) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  const marker = "/watch-item-photos/";
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    await supabase.storage.from("watch-item-photos").remove([url.slice(idx + marker.length)]);
  }

  const { error } = await supabase
    .from("maintenance_watch_items")
    .update({ photo_urls: existing.filter((u) => u !== url) })
    .eq("id", itemId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
