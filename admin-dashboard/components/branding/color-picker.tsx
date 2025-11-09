'use client';

/**
 * ColorPicker Component
 * 
 * Color selection interface for branding management.
 * Features: Hex input, preset schemes, live preview.
 * 
 * Requirements: Phase 7, Core branding features
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Check } from 'lucide-react';
import { COLOR_SCHEMES, ColorScheme, isValidHexColor } from '@/lib/branding-api';

// ============================================================================
// Types
// ============================================================================

export interface ColorValues {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

interface ColorPickerProps {
  colors: ColorValues;
  onChange: (colors: ColorValues) => void;
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function ColorPicker({ colors, onChange, disabled = false }: ColorPickerProps) {
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null);

  /**
   * Handle individual color change
   */
  const handleColorChange = (field: keyof ColorValues, value: string) => {
    // Ensure value starts with #
    const hexValue = value.startsWith('#') ? value : `#${value}`;
    
    onChange({
      ...colors,
      [field]: hexValue,
    });
    
    // Clear selected scheme when manually changing colors
    setSelectedScheme(null);
  };

  /**
   * Apply preset color scheme
   */
  const applyScheme = (scheme: ColorScheme) => {
    onChange({
      primary_color: scheme.primary,
      secondary_color: scheme.secondary,
      accent_color: scheme.accent,
    });
    setSelectedScheme(scheme.name);
  };

  /**
   * Validate color format
   */
  const isValid = (color: string): boolean => {
    return isValidHexColor(color);
  };

  return (
    <div className="space-y-6">
      {/* Color Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Brand Colors</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Color */}
          <div className="space-y-2">
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-lg border-2 border-gray-300 flex-shrink-0"
                style={{ backgroundColor: colors.primary_color }}
              />
              <Input
                id="primary_color"
                type="text"
                value={colors.primary_color}
                onChange={(e) => handleColorChange('primary_color', e.target.value)}
                placeholder="#1e40af"
                maxLength={7}
                disabled={disabled}
                className={`font-mono ${
                  isValid(colors.primary_color) ? '' : 'border-red-500'
                }`}
              />
              <Input
                type="color"
                value={colors.primary_color}
                onChange={(e) => handleColorChange('primary_color', e.target.value)}
                disabled={disabled}
                className="w-16 h-10 cursor-pointer"
              />
            </div>
            {!isValid(colors.primary_color) && (
              <p className="text-xs text-red-600">Invalid hex color format</p>
            )}
            <p className="text-xs text-muted-foreground">
              Main brand color used for headers, buttons, and primary elements
            </p>
          </div>

          {/* Secondary Color */}
          <div className="space-y-2">
            <Label htmlFor="secondary_color">Secondary Color</Label>
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-lg border-2 border-gray-300 flex-shrink-0"
                style={{ backgroundColor: colors.secondary_color }}
              />
              <Input
                id="secondary_color"
                type="text"
                value={colors.secondary_color}
                onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                placeholder="#3b82f6"
                maxLength={7}
                disabled={disabled}
                className={`font-mono ${
                  isValid(colors.secondary_color) ? '' : 'border-red-500'
                }`}
              />
              <Input
                type="color"
                value={colors.secondary_color}
                onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                disabled={disabled}
                className="w-16 h-10 cursor-pointer"
              />
            </div>
            {!isValid(colors.secondary_color) && (
              <p className="text-xs text-red-600">Invalid hex color format</p>
            )}
            <p className="text-xs text-muted-foreground">
              Supporting color for secondary UI elements and highlights
            </p>
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <Label htmlFor="accent_color">Accent Color</Label>
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-lg border-2 border-gray-300 flex-shrink-0"
                style={{ backgroundColor: colors.accent_color }}
              />
              <Input
                id="accent_color"
                type="text"
                value={colors.accent_color}
                onChange={(e) => handleColorChange('accent_color', e.target.value)}
                placeholder="#60a5fa"
                maxLength={7}
                disabled={disabled}
                className={`font-mono ${
                  isValid(colors.accent_color) ? '' : 'border-red-500'
                }`}
              />
              <Input
                type="color"
                value={colors.accent_color}
                onChange={(e) => handleColorChange('accent_color', e.target.value)}
                disabled={disabled}
                className="w-16 h-10 cursor-pointer"
              />
            </div>
            {!isValid(colors.accent_color) && (
              <p className="text-xs text-red-600">Invalid hex color format</p>
            )}
            <p className="text-xs text-muted-foreground">
              Accent color for links, badges, and special highlights
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preset Color Schemes */}
      <Card>
        <CardHeader>
          <CardTitle>Preset Color Schemes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose from professionally designed color palettes
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {COLOR_SCHEMES.map((scheme) => (
              <button
                key={scheme.name}
                onClick={() => applyScheme(scheme)}
                disabled={disabled}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                  selectedScheme === scheme.name
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{scheme.name}</h4>
                  {selectedScheme === scheme.name && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {scheme.description}
                </p>
                <div className="flex space-x-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: scheme.primary }}
                    title={`Primary: ${scheme.primary}`}
                  />
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: scheme.secondary }}
                    title={`Secondary: ${scheme.secondary}`}
                  />
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: scheme.accent }}
                    title={`Accent: ${scheme.accent}`}
                  />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Button
              style={{ backgroundColor: colors.primary_color, borderColor: colors.primary_color }}
              className="text-white"
              disabled
            >
              Primary Button
            </Button>
            <Button
              variant="outline"
              style={{ 
                borderColor: colors.secondary_color,
                color: colors.secondary_color 
              }}
              disabled
            >
              Secondary Button
            </Button>
            <Badge style={{ backgroundColor: colors.accent_color }} className="text-white">
              Accent Badge
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Preview of how your brand colors will appear in the interface
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
