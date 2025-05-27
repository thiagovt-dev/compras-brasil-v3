"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, FileIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onUpload: (files: string[]) => void
  maxFiles?: number
  acceptedFileTypes?: string[]
  className?: string
}

export function FileUpload({
  onUpload,
  maxFiles = 5,
  acceptedFileTypes = [".pdf", ".doc", ".docx", ".jpg", ".png"],
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      if (files.length + newFiles.length > maxFiles) {
        alert(`Você pode enviar no máximo ${maxFiles} arquivos.`)
        return
      }
      setFiles((prev) => [...prev, ...newFiles])

      // Simulate upload and notify parent
      simulateUpload([...files, ...newFiles])
    }
  }

  const simulateUpload = async (fileList: File[]) => {
    setUploading(true)
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Convert to file names for demo purposes
    const fileNames = fileList.map((file) => file.name)
    onUpload(fileNames)

    setUploading(false)
  }

  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)

    // Update parent with new file list
    simulateUpload(newFiles)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files)
      if (files.length + newFiles.length > maxFiles) {
        alert(`Você pode enviar no máximo ${maxFiles} arquivos.`)
        return
      }
      setFiles((prev) => [...prev, ...newFiles])

      // Simulate upload and notify parent
      simulateUpload([...files, ...newFiles])
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          "hover:border-primary/50",
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept={acceptedFileTypes.join(",")}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm font-medium">
            <span className="text-primary">Clique para enviar</span> ou arraste e solte
          </div>
          <p className="text-xs text-muted-foreground">
            {acceptedFileTypes.join(", ")} (Máx. {maxFiles} arquivos)
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
              <div className="flex items-center space-x-2 truncate">
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(index)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Enviando arquivos...</span>
        </div>
      )}
    </div>
  )
}
