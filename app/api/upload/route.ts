import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "general"
    const entityId = (formData.get("entityId") as string) || ""
    const entityType = (formData.get("entityType") as string) || ""
    const description = (formData.get("description") as string) || ""

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Create a unique file name
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = `${timestamp}-${file.name.replace(/\.[^/.]+$/, "")}.${fileExtension}`
    const filePath = `${folder}/${fileName}`

    // Get file buffer
    const fileBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    const supabase = createRouteHandlerClient({ cookies })
    const { data, error } = await supabase.storage.from("documents").upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error("Error uploading file:", error)
      return NextResponse.json({ error: "Error uploading file" }, { status: 500 })
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(filePath)

    // Save file metadata to the documents table
    const { data: documentData, error: documentError } = await supabase
      .from("documents")
      .insert({
        name: file.name,
        description: description,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        entity_id: entityId || null,
        entity_type: entityType || null,
      })
      .select()
      .single()

    if (documentError) {
      console.error("Error saving document metadata:", documentError)
      // Even if metadata saving fails, we return the file URL
    }

    return NextResponse.json({
      success: true,
      filePath,
      publicUrl: publicUrlData.publicUrl,
      document: documentData || null,
    })
  } catch (error) {
    console.error("Error in upload route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
