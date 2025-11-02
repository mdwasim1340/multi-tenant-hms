"use client"

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Check, Share2, Clock } from 'lucide-react'
import { useFileManagement, FileItem } from '@/hooks/use-file-management'

interface FileShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileItem | null
}

export function FileShareDialog({ open, onOpenChange, file }: FileShareDialogProps) {
  const { shareFile } = useFileManagement()
  const [shareUrl, setShareUrl] = useState('')
  const [expiresIn, setExpiresIn] = useState('86400') // 24 hours default
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const expirationOptions = [
    { value: '3600', label: '1 hour' },
    { value: '21600', label: '6 hours' },
    { value: '86400', label: '24 hours' },
    { value: '259200', label: '3 days' },
    { value: '604800', label: '7 days' },
    { value: '2592000', label: '30 days' },
  ]

  const handleGenerateShareUrl = useCallback(async () => {
    if (!file) return

    setLoading(true)
    try {
      const result = await shareFile(file.id, Number(expiresIn))
      setShareUrl(result.shareUrl)
      setExpiresAt(result.expiresAt)
    } catch (error) {
      console.error('Error generating share URL:', error)
    } finally {
      setLoading(false)
    }
  }, [file, expiresIn, shareFile])

  const handleCopyUrl = useCallback(async () => {
    if (!shareUrl) {
      console.log('No share URL to copy')
      return
    }

    console.log('Attempting to copy URL:', shareUrl.substring(0, 50) + '...')

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        console.log('Using modern clipboard API')
        await navigator.clipboard.writeText(shareUrl)
        console.log('✅ Successfully copied using clipboard API')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        console.log('Clipboard API not available, using fallback')
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea')
        textArea.value = shareUrl
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        try {
          const successful = document.execCommand('copy')
          console.log('execCommand result:', successful)
          if (successful) {
            console.log('✅ Successfully copied using fallback')
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } else {
            console.error('❌ Failed to copy using fallback method')
            alert('Failed to copy. Please copy the URL manually.')
          }
        } catch (err) {
          console.error('❌ Fallback copy failed:', err)
          alert('Failed to copy. Please copy the URL manually.')
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (error) {
      console.error('❌ Failed to copy URL:', error)
      alert('Failed to copy. Please copy the URL manually.')
    }
  }, [shareUrl])

  const formatExpirationDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const handleClose = () => {
    setShareUrl('')
    setExpiresAt('')
    setCopied(false)
    onOpenChange(false)
  }

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Share File</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-1">File to Share</h4>
            <p className="text-sm text-muted-foreground">{file.original_filename}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
            </p>
          </div>

          {/* Expiration Settings */}
          <div className="space-y-2">
            <Label htmlFor="expiration">Link Expiration</Label>
            <Select value={expiresIn} onValueChange={setExpiresIn}>
              <SelectTrigger>
                <SelectValue placeholder="Select expiration time" />
              </SelectTrigger>
              <SelectContent>
                {expirationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Share URL */}
          {!shareUrl && (
            <Button 
              onClick={handleGenerateShareUrl} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Generating...' : 'Generate Share Link'}
            </Button>
          )}

          {/* Share URL Display */}
          {shareUrl && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Share URL</Label>
                <div className="flex space-x-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-xs"
                    onClick={(e) => {
                      e.currentTarget.select()
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    className="shrink-0"
                    title={copied ? "Copied!" : "Copy to clipboard"}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleCopyUrl}
                  className="w-full"
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>

              {/* Expiration Info */}
              {expiresAt && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Expires: {formatExpirationDate(expiresAt)}</span>
                </div>
              )}

              {/* Success Message */}
              {copied && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    Share URL copied to clipboard!
                  </p>
                </div>
              )}

              {/* Security Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Security Notice:</strong> Anyone with this link can download the file until it expires. 
                  Only share with trusted recipients.
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setShareUrl('')
                    setExpiresAt('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Generate New Link
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}