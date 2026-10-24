import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ boatId: string }> }
) {
  const { boatId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }

  const ext = ALLOWED_TYPES[file.type] ??
    (file.name.match(/\.(jpg|jpeg|png|webp|heic|heif)$/i)?.[1]?.toLowerCase());
  if (!ext) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }
  const path = `${user.id}/${boatId}.${ext as string}`;

  const { error: uploadError } = await supabase.storage
    .from("boat-images")
    .upload(path, file, { upsert: true, contentType: ALLOWED_TYPES[file.type] ? file.type : `image/${ext}` });

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
