import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: boatId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${boatId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("boat-images")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from("boat-images")
    .getPublicUrl(path);

  // Append cache-bust so the browser picks up the new image immediately
  const imageUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("boats")
    .update({ image_url: imageUrl })
    .eq("id", boatId)
    .eq("user_id", user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ imageUrl });
}
