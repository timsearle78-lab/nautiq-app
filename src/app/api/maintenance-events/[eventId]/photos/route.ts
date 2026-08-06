import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${user.id}/${eventId}/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("maintenance-photos")
      .upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

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
