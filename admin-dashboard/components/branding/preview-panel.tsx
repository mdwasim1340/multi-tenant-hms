'use client';

/**
 * PreviewPanel Component
 * 
 * Live preview of branding changes showing how colors and logos appear in the UI.
 * Features: Sample UI elements, logo display, color application.
 * 
 * Requirements: Phase 7, Task 7.5
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  Users, 
  Calendar, 
  Activity,
  Bell,
  Settings,
  CheckCircle,
  Info
} from 'lucide-react';
import Image from 'next/image';

// ============================================================================
// Types
// ============================================================================

interface PreviewPanelProps {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

// ============================================================================
// Component
// ============================================================================

export function PreviewPanel({
  logoUrl,
  primaryColor,
  secondaryColor,
  accentColor
}: PreviewPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
        <p className="text-sm text-muted-foreground">
          See how your branding will appear in the hospital management system
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header Preview */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Header</p>
          <div 
            className="rounded-lg p-4 shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {logoUrl ? (
                  <div className="bg-white rounded p-1">
                    <Image
                      src={logoUrl}
                      alt="Logo preview"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded p-2">
                    <Building2 className="h-6 w-6" style={{ color: primaryColor }} />
                  </div>
                )}
                <span className="text-white font-semibold text-lg">
                  Hospital Management System
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-white" />
                <Settings className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons Preview */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Buttons</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              style={{ 
                backgroundColor: primaryColor,
                borderColor: primaryColor 
              }}
              className="text-white"
              disabled
            >
              Primary Button
            </Button>
            <Button
              variant="outline"
              style={{ 
                borderColor: secondaryColor,
                color: secondaryColor 
              }}
              disabled
            >
              Secondary Button
            </Button>
            <Button
              variant="ghost"
              style={{ color: accentColor }}
              disabled
            >
              Accent Button
            </Button>
          </div>
        </div>

        {/* Badges Preview */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Badges & Tags</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge 
              style={{ backgroundColor: primaryColor }}
              className="text-white"
            >
              Active
            </Badge>
            <Badge 
              style={{ backgroundColor: secondaryColor }}
              className="text-white"
            >
              Pending
            </Badge>
            <Badge 
              style={{ backgroundColor: accentColor }}
              className="text-white"
            >
              New
            </Badge>
          </div>
        </div>

        {/* Cards Preview */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Dashboard Cards</p>
          <div className="grid grid-cols-2 gap-3">
            <div 
              className="rounded-lg p-3 shadow-sm"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: primaryColor }}>
                    Total Patients
                  </p>
                  <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                    1,234
                  </p>
                </div>
                <Users className="h-8 w-8" style={{ color: primaryColor }} />
              </div>
            </div>

            <div 
              className="rounded-lg p-3 shadow-sm"
              style={{ backgroundColor: `${secondaryColor}15` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: secondaryColor }}>
                    Appointments
                  </p>
                  <p className="text-2xl font-bold" style={{ color: secondaryColor }}>
                    56
                  </p>
                </div>
                <Calendar className="h-8 w-8" style={{ color: secondaryColor }} />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Preview */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Alerts & Notifications</p>
          <div className="space-y-2">
            <Alert style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}10` }}>
              <CheckCircle className="h-4 w-4" style={{ color: primaryColor }} />
              <AlertDescription style={{ color: primaryColor }}>
                <strong>Success:</strong> Patient record updated successfully
              </AlertDescription>
            </Alert>

            <Alert style={{ borderColor: accentColor, backgroundColor: `${accentColor}10` }}>
              <Info className="h-4 w-4" style={{ color: accentColor }} />
              <AlertDescription style={{ color: accentColor }}>
                <strong>Info:</strong> New appointment scheduled for tomorrow
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Links Preview */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Links & Text</p>
          <div className="space-y-2 text-sm">
            <p>
              Regular text with{' '}
              <a href="#" style={{ color: accentColor }} className="underline">
                accent colored link
              </a>
            </p>
            <p>
              Navigation item with{' '}
              <a href="#" style={{ color: primaryColor }} className="font-medium">
                primary color
              </a>
            </p>
          </div>
        </div>

        {/* Logo Sizes Preview */}
        {logoUrl && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Logo Sizes</p>
            <div className="flex items-end space-x-4 bg-muted/50 rounded-lg p-4">
              <div className="text-center">
                <div className="bg-white rounded p-1 inline-block mb-1">
                  <Image
                    src={logoUrl}
                    alt="Small logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Small (32px)</p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded p-2 inline-block mb-1">
                  <Image
                    src={logoUrl}
                    alt="Medium logo"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Medium (64px)</p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded p-2 inline-block mb-1">
                  <Image
                    src={logoUrl}
                    alt="Large logo"
                    width={96}
                    height={96}
                    className="object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Large (96px)</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> This preview shows how your branding will appear across the hospital management system. 
            Changes are applied immediately after saving.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
