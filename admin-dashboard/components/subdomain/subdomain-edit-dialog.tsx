'use client';

/**
 * SubdomainEditDialog Component
 * 
 * Dialog for editing tenant subdomain with validation and warnings.
 * Features: Real-time validation, availability checking, impact warnings.
 * 
 * Requirements: Phase 6, Task 6.5
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  validateSubdomainFormat, 
  sanitizeSubdomain,
  generateSubdomainUrl 
} from '@/lib/subdomain-validator';
import { checkSubdomainAvailability } from '@/lib/subdomain-api';
import api from '@/lib/api';

// ============================================================================
// Types
// ============================================================================

interface SubdomainEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  tenantName: string;
  currentSubdomain: string | null;
  onSuccess?: () => void;
}

type ValidationStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

// ============================================================================
// Component
// ============================================================================

export function SubdomainEditDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  currentSubdomain,
  onSuccess
}: SubdomainEditDialogProps) {
  const [subdomain, setSubdomain] = useState(currentSubdomain || '');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSubdomain(currentSubdomain || '');
      setValidationStatus('idle');
      setValidationError(null);
    }
  }, [open, currentSubdomain]);

  /**
   * Handle subdomain input change with sanitization
   */
  const handleSubdomainChange = (value: string) => {
    const sanitized = sanitizeSubdomain(value);
    setSubdomain(sanitized);
    checkSubdomainDebounced(sanitized);
  };

  /**
   * Check subdomain availability with debouncing (500ms delay)
   */
  const checkSubdomainDebounced = useCallback((value: string) => {
    // Clear previous timeout
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    // Reset status
    setValidationStatus('idle');
    setValidationError(null);

    // Don't check if empty or same as current
    if (!value || value.trim().length === 0) {
      return;
    }

    if (value === currentSubdomain) {
      setValidationStatus('idle');
      return;
    }

    // First, validate format client-side
    const validation = validateSubdomainFormat(value);
    if (!validation.isValid) {
      setValidationStatus('invalid');
      setValidationError(validation.error || 'Invalid subdomain');
      return;
    }

    // Set checking status
    setValidationStatus('checking');

    // Debounce the API call
    const timeout = setTimeout(async () => {
      try {
        const result = await checkSubdomainAvailability(value);
        if (result.available) {
          setValidationStatus('available');
          setValidationError(null);
        } else {
          setValidationStatus('taken');
          setValidationError(result.message || 'Subdomain is already taken');
        }
      } catch (error: any) {
        setValidationStatus('invalid');
        setValidationError(error.message || 'Failed to check subdomain availability');
      }
    }, 500);

    setCheckTimeout(timeout);
  }, [checkTimeout, currentSubdomain]);

  /**
   * Save subdomain changes
   */
  const handleSave = async () => {
    // Validate before saving
    if (!subdomain || subdomain.trim().length === 0) {
      toast.error('Subdomain cannot be empty');
      return;
    }

    if (subdomain === currentSubdomain) {
      toast.info('No changes to save');
      onOpenChange(false);
      return;
    }

    const validation = validateSubdomainFormat(subdomain);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid subdomain');
      return;
    }

    if (validationStatus === 'taken') {
      toast.error('This subdomain is already taken');
      return;
    }

    if (validationStatus === 'checking') {
      toast.error('Please wait while we check subdomain availability');
      return;
    }

    if (validationStatus !== 'available' && subdomain !== currentSubdomain) {
      toast.error('Please enter a valid and available subdomain');
      return;
    }

    try {
      setSaving(true);

      // Update tenant subdomain via API
      await api.put(`/api/tenants/${tenantId}`, {
        subdomain: subdomain
      });

      toast.success('Subdomain updated successfully!', {
        description: `New URL: ${generateSubdomainUrl(subdomain)}`
      });

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close dialog
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating subdomain:', error);
      toast.error(error.response?.data?.message || 'Failed to update subdomain');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Remove subdomain
   */
  const handleRemove = async () => {
    if (!currentSubdomain) {
      return;
    }

    try {
      setSaving(true);

      // Remove subdomain by setting it to null
      await api.put(`/api/tenants/${tenantId}`, {
        subdomain: null
      });

      toast.success('Subdomain removed successfully');

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close dialog
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error removing subdomain:', error);
      toast.error(error.response?.data?.message || 'Failed to remove subdomain');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = subdomain !== currentSubdomain;
  const canSave = hasChanges && (validationStatus === 'available' || subdomain === '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Edit Subdomain</span>
          </DialogTitle>
          <DialogDescription>
            Update the subdomain URL for {tenantName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Alert */}
          {currentSubdomain && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Important:</strong> Changing the subdomain will affect how users access this hospital.
                Make sure to notify all users about the new URL.
              </AlertDescription>
            </Alert>
          )}

          {/* Current Subdomain */}
          {currentSubdomain && (
            <div className="bg-muted/50 border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Current URL:</p>
              <p className="text-sm font-mono text-foreground">
                {generateSubdomainUrl(currentSubdomain)}
              </p>
            </div>
          )}

          {/* Subdomain Input */}
          <div className="space-y-2">
            <Label htmlFor="subdomain">New Subdomain</Label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Input
                  id="subdomain"
                  value={subdomain}
                  onChange={(e) => handleSubdomainChange(e.target.value)}
                  placeholder="e.g., cityhospital"
                  className={`pr-10 ${
                    validationStatus === 'available' ? 'border-green-500 focus:border-green-500' :
                    validationStatus === 'taken' || validationStatus === 'invalid' ? 'border-red-500 focus:border-red-500' :
                    ''
                  }`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {validationStatus === 'checking' && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {validationStatus === 'available' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {(validationStatus === 'taken' || validationStatus === 'invalid') && (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                .yourhospitalsystem.com
              </span>
            </div>

            {/* Status Messages */}
            {validationStatus === 'checking' && (
              <p className="text-xs text-gray-500 flex items-center space-x-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Checking availability...</span>
              </p>
            )}
            {validationStatus === 'available' && hasChanges && (
              <p className="text-xs text-green-600 flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Subdomain is available!</span>
              </p>
            )}
            {(validationStatus === 'taken' || validationStatus === 'invalid') && validationError && (
              <p className="text-xs text-red-600 flex items-center space-x-1">
                <XCircle className="h-3 w-3" />
                <span>{validationError}</span>
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Must be 3-63 characters. Only lowercase letters, numbers, and hyphens allowed.
            </p>
          </div>

          {/* New URL Preview */}
          {subdomain && validationStatus === 'available' && hasChanges && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">New Hospital URL:</p>
              <p className="text-sm font-mono text-blue-700 dark:text-blue-300 break-all">
                {generateSubdomainUrl(subdomain)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div>
            {currentSubdomain && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={saving}
              >
                Remove Subdomain
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
