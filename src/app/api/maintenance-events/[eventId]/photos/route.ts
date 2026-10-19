import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;

  // Verify the event belongs to this user
  const { data: event } = await supabase
    .from("maintenance_events")
    .select("id, photo_urls")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single();

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const files = formData.getAll("photos") as File[];
  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

  const uploadedUrls: string[] = [];

  for (const file of files.slice(0, 3)) {
    const info = resolveFileInfo(file);
    if (!info) { console.warn("Rejected unrecognised file:", file.name, file.type); continue; }
    if (file.size > MAX_FILE_SIZE) { console.warn("Rejected oversized file:", file.size); continue; }
    const { ext, contentType } = info;

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${user.id}/${eventId}/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("maintenance-photos")
      .upload(path, buffer, { contentType, upsert: false });

    if (uploadError) {
      console.error("Photo upload error:", uploadError.message);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("maintenance-photos")
      .getPublicUrl(path);

    uploadedUrls.push(publicUrl);
  }

  if (!uploadedUrls.length) {
    return NextResponse.json({ error: "All uploads failed" }, { status: 500 });
  }

  const existing = (event.photo_urls as string[] | null) ?? [];
  const merged = [...existing, ...uploadedUrls];

  const { error: updateError } = await supabase
    .from("maintenance_events")
    .update({ photo_urls: merged })
    .eq("id", eventId)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ urls: uploadedUrls });
}
