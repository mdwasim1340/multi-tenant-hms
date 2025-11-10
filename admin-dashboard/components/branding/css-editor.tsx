'use client';

/**
 * CSSEditor Component
 * 
 * Advanced custom CSS editor for hospital branding.
 * Features: Syntax highlighting, validation, preview.
 * 
 * Requirements: Phase 7, Task 7.6 (Advanced Feature)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  AlertTriangle, 
  Info,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface CSSEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function CSSEditor({ value, onChange, disabled = false }: CSSEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  /**
   * Basic CSS validation
   */
  const validateCSS = (css: string): string[] => {
    const warnings: string[] = [];

    // Check for potentially dangerous patterns
    if (css.includes('javascript:')) {
      warnings.push('JavaScript URLs are not allowed for security reasons');
    }
    if (css.includes('<script')) {
      warnings.push('Script tags are not allowed');
    }
    if (css.includes('expression(')) {
      warnings.push('CSS expressions are not allowed');
    }
    if (css.includes('@import')) {
      warnings.push('CSS imports may not work as expected');
    }

    // Check for unclosed braces
    const openBraces = (css.match(/{/g) || []).length;
    const closeBraces = (css.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      warnings.push('Unmatched curly braces detected');
    }

    return warnings;
  };

  /**
   * Handle CSS change with validation
   */
  const handleChange = (newValue: string) => {
    onChange(newValue);
    const warnings = validateCSS(newValue);
    setValidationWarnings(warnings);
  };

  /**
   * Clear CSS
   */
  const handleClear = () => {
    onChange('');
    setValidationWarnings([]);
  };

  /**
   * Insert example CSS
   */
  const insertExample = () => {
    const example = `/* Custom CSS for Hospital Branding */

/* Customize header */
.header {
  border-bottom: 3px solid var(--primary);
}

/* Customize cards */
.card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Customize buttons */
.btn-primary {
  border-radius: 8px;
  font-weight: 600;
}

/* Add custom animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.3s ease-in;
}`;
    
    onChange(example);
    setValidationWarnings(validateCSS(example));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <CardTitle>Custom CSS (Advanced)</CardTitle>
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Show Preview
                </>
              )}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Add custom CSS to further customize your hospital's appearance
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning Alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Advanced Feature:</strong> Custom CSS requires knowledge of CSS. 
            Incorrect CSS may affect the appearance of your hospital system.
          </AlertDescription>
        </Alert>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={insertExample}
            disabled={disabled}
          >
            Insert Example
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={disabled || !value}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        {/* CSS Editor */}
        <div className="space-y-2">
          <Textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="/* Enter your custom CSS here */&#10;.header {&#10;  background-color: #1e40af;&#10;}"
            className="font-mono text-sm min-h-[300px]"
            disabled={disabled}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{value.length} characters</span>
            <span>{value.split('\n').length} lines</span>
          </div>
        </div>

        {/* Validation Warnings */}
        {validationWarnings.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">CSS Validation Warnings:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validationWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Preview */}
        {showPreview && value && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <p className="text-sm font-medium mb-2">CSS Preview:</p>
            <div className="bg-white dark:bg-gray-900 rounded p-4 max-h-[200px] overflow-auto">
              <style dangerouslySetInnerHTML={{ __html: value }} />
              <div className="space-y-2">
                <div className="header p-3 bg-blue-100 rounded">
                  Sample Header
                </div>
                <div className="card p-3 border rounded">
                  Sample Card
                </div>
                <button className="btn-primary px-4 py-2 bg-blue-500 text-white rounded">
                  Sample Button
                </button>
                <div className="fade-in p-2 bg-gray-100 rounded">
                  Sample Animated Element
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guidelines */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <p className="font-medium">CSS Guidelines:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Use CSS variables for colors: var(--primary), var(--secondary), var(--accent)</li>
                <li>Target specific classes to avoid affecting the entire system</li>
                <li>Test your CSS thoroughly before applying to production</li>
                <li>Avoid using !important unless absolutely necessary</li>
                <li>Keep CSS concise and well-commented</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            <strong>Security Note:</strong> Custom CSS is sanitized on the server to prevent security issues. 
            JavaScript, external imports, and potentially harmful code will be removed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
