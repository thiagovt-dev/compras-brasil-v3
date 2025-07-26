"use server";

import { createClient } from "@supabase/supabase-js";
import { ServerActionError } from "./errorAction";

function createServerActionClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.SUPABASE_S3_BUCKET
  ) {
    throw new Error("Missing Supabase configuration");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const supabase = createServerActionClient();

export async function uploadFileToSupabaseStorage(
  fileBuffer: ArrayBuffer,
  path: string,
  contentType: string
): Promise<{ filePath: string; publicUrl: string }> {
  const bucket = process.env.SUPABASE_S3_BUCKET!;
  const { data, error } = await supabase.storage.from(bucket).upload(path, fileBuffer, {
    contentType,
    upsert: true,
  });


  if (error) {
    throw new ServerActionError(`Erro ao fazer upload: ${error.message}`, 500);
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
  console.log("File uploaded successfully", {
    filePath: data.path,
    publicUrl: publicUrlData.publicUrl,
  });
  return {
    filePath: data.path,
    publicUrl: publicUrlData.publicUrl,
  };
}
