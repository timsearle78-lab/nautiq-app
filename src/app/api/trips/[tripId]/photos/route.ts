import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png",
  "image/webp": "webp", "image/heic": "heic", "image/heif": "heif",
};
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PHOTOS = 3;

async function getAuthedTrip(supabase: Awaited<ReturnType<typeof createClient>>, tripId: string, userId: string) {
  const { data } = await supabase
    .from("trips")
    .select("id, user_id, photo_urls")
    .eq("id", tripId)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tripId } = await params;
  const trip = await getAuthedTrip(supabase, tripId, user.id);
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = (trip.photo_urls as string[] | null) ?? [];
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
    const path = `${user.id}/${tripId}/${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("trip-photos")
      .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: false });

    if (uploadError) { console.error("Upload error:", uploadError.message); continue; }

    const { data: { publicUrl } } = supabase.storage.from("trip-photos").getPublicUrl(path);
    uploadedUrls.push(publicUrl);
  }

  if (!uploadedUrls.length) {
    return NextResponse.json({ error: "All uploads failed" }, { status: 500 });
  }

  const { error } = await supabase
    .from("trips")
    .update({ photo_urls: [...existing, ...uploadedUrls] })
    .eq("id", tripId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ urls: uploadedUrls });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tripId } = await params;
  const trip = await getAuthedTrip(supabase, tripId, user.id);
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { url } = await req.json() as { url: string };
  const existing = (trip.photo_urls as string[] | null) ?? [];
  if (!existing.includes(url)) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  const marker = "/trip-photos/";
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    await supabase.storage.from("trip-photos").remove([url.slice(idx + marker.length)]);
  }

  const { error } = await supabase
    .from("trips")
    .update({ photo_urls: existing.filter((u) => u !== url) })
    .eq("id", tripId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
