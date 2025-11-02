"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { useFileManagement, FileItem } from '@/hooks/use-file-management'

interface FileDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileItem | null
  onDeleteComplete?: () => void
}

export function FileDeleteDialog({ open, onOpenChange, file, onDeleteComplete }: FileDeleteDialogProps) {
  const { deleteFile, formatFileSize } = useFileManagement()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!file) return

    setDeleting(true)
    try {
      await deleteFile(file.id)
      onDeleteComplete?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting file:', error)
    } finally {
      setDeleting(false)
    }
  }

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Delete File</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this file? This action cannot be undone.
          </p>

          {/* File Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start space-x-3">
              <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{file.original_filename}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Size: {formatFileSize(file.file_size)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Uploaded: {new Date(file.upload_date).toLocaleDateString()}
                </p>
                {file.uploaded_by_name && (
                  <p className="text-xs text-muted-foreground">
                    By: {file.uploaded_by_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              <strong>Warning:</strong> This will permanently delete the file from storage. 
              Any shared links will stop working immediately.
            </p>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete File'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}