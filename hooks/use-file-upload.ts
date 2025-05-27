"use client"

import { useState } from "react"

interface FileUploadState {
  files: File[]
  uploadedFiles: {
    filePath: string
    publicUrl: string
    document: any
  }[]
  uploading: boolean
  error: string | null
}

interface UseFileUploadOptions {
  folder?: string
  entityId?: string
  entityType?: string
  maxFiles?: number
  maxSizeMB?: number
  onUploadComplete?: (
    files: {
      filePath: string
      publicUrl: string
      document: any
    }[],
  ) => void
  onUploadError?: (error: string) => void
}

export function useFileUpload({
  folder = "general",
  entityId,
  entityType,
  maxFiles = 5,
  maxSizeMB = 10,
  onUploadComplete,
  onUploadError,
}: UseFileUploadOptions = {}) {
  const [state, setState] = useState<FileUploadState>({
    files: [],
    uploadedFiles: [],
    uploading: false,
    error: null,
  })

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return

    const filesArray = Array.from(newFiles)

    // Check if adding these files would exceed the max files limit
    if (state.files.length + filesArray.length > maxFiles) {
      setState((prev) => ({
        ...prev,
        error: `Você pode enviar no máximo ${maxFiles} arquivos.`,
      }))
      return
    }

    // Check file sizes
    const oversizedFiles = filesArray.filter((file) => file.size > maxSizeMB * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setState((prev) => ({
        ...prev,
        error: `Um ou mais arquivos excedem o tamanho máximo de ${maxSizeMB}MB.`,
      }))
      return
    }

    setState((prev) => ({
      ...prev,
      files: [...prev.files, ...filesArray],
      error: null,
    }))
  }

  const removeFile = (index: number) => {
    setState((prev) => {
      const newFiles = [...prev.files]
      newFiles.splice(index, 1)

      const newUploadedFiles = [...prev.uploadedFiles]
      if (index < newUploadedFiles.length) {
        newUploadedFiles.splice(index, 1)
      }

      return {
        ...prev,
        files: newFiles,
        uploadedFiles: newUploadedFiles,
      }
    })
  }

  const uploadFiles = async () => {
    if (state.files.length === 0) return

    setState((prev) => ({ ...prev, uploading: true, error: null }))

    const uploadedFiles = []

    try {
      for (const file of state.files) {
        if (state.uploadedFiles.find((f) => f.document?.name === file.name)) {
          continue // Skip already uploaded files
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", folder)

        if (entityId) formData.append("entityId", entityId)
        if (entityType) formData.append("entityType", entityType)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erro ao enviar arquivo")
        }

        const data = await response.json()
        uploadedFiles.push(data)
      }

      setState((prev) => ({
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, ...uploadedFiles],
        uploading: false,
      }))

      if (onUploadComplete) {
        onUploadComplete([...state.uploadedFiles, ...uploadedFiles])
      }
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao enviar arquivos"
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        uploading: false,
      }))

      if (onUploadError) {
        onUploadError(errorMessage)
      }
    }
  }

  const reset = () => {
    setState({
      files: [],
      uploadedFiles: [],
      uploading: false,
      error: null,
    })
  }

  return {
    files: state.files,
    uploadedFiles: state.uploadedFiles,
    uploading: state.uploading,
    error: state.error,
    addFiles,
    removeFile,
    uploadFiles,
    reset,
  }
}
