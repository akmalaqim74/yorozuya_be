import supabaseAdmin from "../config/supabase";
import { throwServerError } from "../utils/error.util";

export const uploadPhotoToStorage = async (
  bucket: "exposure-photos" | "avatars",
  path: string,
  buffer: Buffer,
  mimetype: string
): Promise<string> => {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: mimetype,
      upsert: true,
    });

  if (error) {
    throwServerError(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};
