import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "general";
    const entityId = (formData.get("entityId") as string) || "";
    const entityType = (formData.get("entityType") as string) || "";
    const description = (formData.get("description") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Create a unique file name
    const timestamp = Date.now();
    const fileName = file.name.replace(/\s+/g, "-");
    const safeFileName = `${timestamp}-${fileName}`;
    
    // Create the folder structure if it doesn't exist
    const publicFolderPath = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(publicFolderPath, { recursive: true });
    
    // Path where the file will be saved
    const filePath = path.join(publicFolderPath, safeFileName);
    
    // Convert file to buffer and save it
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);
    
    // Path for public access
    const publicPath = `/uploads/${folder}/${safeFileName}`;
    
    // REMOVA OU COMENTE ESTE BLOCO INTEIRO
    /*
    // Save file metadata to the documents table (if using Supabase)
    const supabase = createRouteHandlerClient({ cookies });
    let documentData = null;
    
    try {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          name: file.name,
          description: description,
          file_path: publicPath,
          file_type: file.type,
          file_size: file.size,
          entity_id: entityId || null,
          entity_type: entityType || null,
        })
        .select()
        .single();
        
      if (error) {
        console.error("Database error:", error);
      } else {
        documentData = data;
      }
    } catch (dbError) {
      console.error("Failed to save to database:", dbError);
    }
    */

    // Apenas retorne os dados do arquivo sem tentar salvar no banco
    return NextResponse.json({
      success: true,
      filePath: publicPath,
      publicUrl: publicPath,
      document: {
        id: `local-${timestamp}`, // ID temporário local
        name: file.name,
        file_path: publicPath,
        file_type: file.type,
        file_size: file.size,
      },
    });
  } catch (error) {
    console.error("Error in local upload:", error);
    return NextResponse.json({ 
      error: "Upload failed", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}