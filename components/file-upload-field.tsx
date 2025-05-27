"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, FileIcon, Trash2, Upload, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileUploadFieldProps {
  label: string
  description?: string
  folder?: string
  entityId?: string
  entityType?: string
  onUploadComplete?: (fileData: {
    filePath: string
    publicUrl: string
    document: any
  }) => void
  onUploadError?: (error: string) => void
  accept?: string
  required?: boolean
  maxSizeMB?: number
}

export function FileUploadField({
  label,
  description,
  folder = "general",
  entityId,
  entityType,
  onUploadComplete,
  onUploadError,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  required = false,
  maxSizeMB = 10,
}: FileUploadFieldProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<{
    filePath: string
    publicUrl: string
    document: any
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check file size
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        setError(`O arquivo excede o tamanho máximo de ${maxSizeMB}MB.`)
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const uploadFile = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 100)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)

      if (entityId) formData.append("entityId", entityId)
      if (entityType) formData.append("entityType", entityType)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao enviar arquivo")
      }

      const data = await response.json()
      setUploadedFile(data)

      if (onUploadComplete) {
        onUploadComplete(data)
      }
    } catch (err: any) {
      setError(err.message || "Erro ao enviar arquivo")
      if (onUploadError) {
        onUploadError(err.message || "Erro ao enviar arquivo")
      }
    } finally {
      setTimeout(() => {
        setUploading(false)
      }, 500)
    }
  }

  const removeFile = () => {
    setFile(null)
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="file-upload">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2">
        <Input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={uploading || !!uploadedFile}
          className="flex-1"
          required={required && !uploadedFile}
        />

        {!uploadedFile && file && !uploading && (
          <Button type="button" onClick={uploadFile} size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Enviar
          </Button>
        )}

        {!uploadedFile && file && (
          <Button type="button" variant="ghost" size="icon" onClick={removeFile} className="h-9 w-9">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Enviando...</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {uploadedFile && (
        <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
          <div className="flex items-center space-x-2 truncate">
            <FileIcon className="h-4 w-4 text-primary" />
            <span className="text-sm truncate">{file?.name}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={removeFile}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
