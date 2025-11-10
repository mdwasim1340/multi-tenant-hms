'use client';

/**
 * Branding Management Page
 * 
 * Complete branding configuration interface for hospitals.
 * Manages logos, colors, and provides preview.
 * 
 * Requirements: Phase 7, Core branding features
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { LogoUpload } from '@/components/branding/logo-upload';
import { ColorPicker, ColorValues } from '@/components/branding/color-picker';
import { PreviewPanel } from '@/components/branding/preview-panel';
import { CSSEditor } from '@/components/branding/css-editor';
import {
  fetchBranding,
  updateBrandingColors,
  uploadLogo,
  deleteLogo,
  updateBranding,
  BrandingConfig,
} from '@/lib/branding-api';

// ============================================================================
// Component
// ============================================================================

export default function BrandingManagementPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [colors, setColors] = useState<ColorValues>({
    primary_color: '#1e40af',
    secondary_color: '#3b82f6',
    accent_color: '#60a5fa',
  });
  const [customCSS, setCustomCSS] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Load branding configuration
   */
  useEffect(() => {
    loadBranding();
  }, [tenantId]);

  const loadBranding = async () => {
    try {
      setLoading(true);
      const data = await fetchBranding(tenantId);
      setBranding(data);
      setColors({
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        accent_color: data.accent_color,
      });
      setCustomCSS(data.custom_css || '');
      setShowAdvanced(!!data.custom_css);
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error loading branding:', error);
      toast.error(error.message || 'Failed to load branding configuration');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle color changes
   */
  const handleColorChange = (newColors: ColorValues) => {
    setColors(newColors);
    setHasChanges(true);
  };

  /**
   * Handle custom CSS changes
   */
  const handleCSSChange = (newCSS: string) => {
    setCustomCSS(newCSS);
    setHasChanges(true);
  };

  /**
   * Handle logo upload
   */
  const handleLogoUpload = async (file: File) => {
    try {
      const result = await uploadLogo(tenantId, file);
      
      // Update branding state with new logo URLs
      setBranding((prev) => prev ? {
        ...prev,
        logo_url: result.logo_url,
        logo_small_url: result.logo_small_url,
        logo_medium_url: result.logo_medium_url,
        logo_large_url: result.logo_large_url,
      } : null);

      toast.success('Logo uploaded successfully!');
    } catch (error: any) {
      throw error; // Re-throw to be handled by LogoUpload component
    }
  };

  /**
   * Handle logo removal
   */
  const handleLogoRemove = async () => {
    try {
      await deleteLogo(tenantId);
      
      // Clear logo URLs from state
      setBranding((prev) => prev ? {
        ...prev,
        logo_url: undefined,
        logo_small_url: undefined,
        logo_medium_url: undefined,
        logo_large_url: undefined,
      } : null);

      toast.success('Logo removed successfully');
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * Save branding changes
   */
  const handleSave = async () => {
    try {
      setSaving(true);

      // Update colors and custom CSS
      await updateBranding(tenantId, {
        ...colors,
        custom_css: customCSS || undefined
      });

      toast.success('Branding updated successfully!');
      setHasChanges(false);
      
      // Reload to get latest data
      await loadBranding();
    } catch (error: any) {
      console.error('Error saving branding:', error);
      toast.error(error.message || 'Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Reset to original values
   */
  const handleReset = () => {
    if (branding) {
      setColors({
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color,
        accent_color: branding.accent_color,
      });
      setCustomCSS(branding.custom_css || '');
      setHasChanges(false);
      toast.info('Changes reset');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading branding configuration...</p>
        </div>
      </div>
    );
  }

  if (!branding) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load branding configuration</p>
          <Button onClick={loadBranding}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/tenants/${tenantId}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenant Details
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Branding Management</h1>
            <p className="text-muted-foreground mt-2">
              Customize your hospital's logo and brand colors
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={saving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Logo and Colors Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Logo */}
          <div>
            <LogoUpload
              currentLogoUrl={branding.logo_url}
              onUpload={handleLogoUpload}
              onRemove={handleLogoRemove}
              disabled={saving}
            />
          </div>

          {/* Right Column - Colors */}
          <div>
            <ColorPicker
              colors={colors}
              onChange={handleColorChange}
              disabled={saving}
            />
          </div>
        </div>

        {/* Preview Panel - Full Width */}
        <PreviewPanel
          logoUrl={branding.logo_url}
          primaryColor={colors.primary_color}
          secondaryColor={colors.secondary_color}
          accentColor={colors.accent_color}
        />

        {/* Advanced Features Toggle */}
        <div className="flex items-center justify-center">
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            disabled={saving}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Button>
        </div>

        {/* Custom CSS Editor - Advanced */}
        {showAdvanced && (
          <CSSEditor
            value={customCSS}
            onChange={handleCSSChange}
            disabled={saving}
          />
        )}
      </div>

      {/* Save Reminder */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-orange-100 dark:bg-orange-900 border-2 border-orange-500 rounded-lg p-4 shadow-lg">
          <p className="text-sm font-medium mb-2">You have unsaved changes</p>
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Now
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
