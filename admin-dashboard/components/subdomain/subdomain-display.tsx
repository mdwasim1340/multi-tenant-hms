'use client';

/**
 * SubdomainDisplay Component
 * 
 * Reusable component for displaying subdomain URLs with optional copy-to-clipboard functionality.
 * Used across tenant list views and tenant detail pages.
 * 
 * Features:
 * - Display full subdomain URL
 * - Copy to clipboard with visual feedback
 * - Handle missing subdomains gracefully
 * - Responsive design
 * 
 * Requirements: Phase 6, Task 6.5
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, Globe, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { generateSubdomainUrl } from '@/lib/subdomain-validator';

// ============================================================================
// Types
// ============================================================================

interface SubdomainDisplayProps {
  subdomain: string | null | undefined;
  showCopyButton?: boolean;
  showExternalLink?: boolean;
  variant?: 'inline' | 'badge' | 'card';
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Display subdomain with optional copy and external link buttons
 * 
 * @param subdomain - The subdomain to display
 * @param showCopyButton - Whether to show copy button (default: true)
 * @param showExternalLink - Whether to show external link button (default: false)
 * @param variant - Display variant: 'inline', 'badge', or 'card' (default: 'inline')
 * @param className - Additional CSS classes
 * 
 * @example
 * // Simple display with copy button
 * <SubdomainDisplay subdomain="cityhospital" />
 * 
 * @example
 * // Badge variant without copy button
 * <SubdomainDisplay subdomain="cityhospital" variant="badge" showCopyButton={false} />
 * 
 * @example
 * // Card variant with external link
 * <SubdomainDisplay subdomain="cityhospital" variant="card" showExternalLink />
 */
export function SubdomainDisplay({
  subdomain,
  showCopyButton = true,
  showExternalLink = false,
  variant = 'inline',
  className = '',
}: SubdomainDisplayProps) {
  const [copied, setCopied] = useState(false);

  // Handle missing subdomain
  if (!subdomain || subdomain.trim().length === 0) {
    return (
      <span className={`text-sm text-muted-foreground italic ${className}`}>
        No subdomain set
      </span>
    );
  }

  const fullUrl = generateSubdomainUrl(subdomain);
  const displayUrl = subdomain + '.yourhospitalsystem.com';

  /**
   * Copy subdomain URL to clipboard
   */
  const handleCopy = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = fullUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      // Visual feedback
      setCopied(true);
      toast.success('URL copied to clipboard!', {
        description: fullUrl,
      });

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy URL', {
        description: 'Please try again',
      });
    }
  };

  /**
   * Open subdomain URL in new tab
   */
  const handleExternalLink = () => {
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  // ============================================================================
  // Render Variants
  // ============================================================================

  // Badge Variant - Compact display with optional copy
  if (variant === 'badge') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge variant="outline" className="flex items-center space-x-1 font-mono text-xs">
          <Globe className="h-3 w-3" />
          <span>{subdomain}</span>
        </Badge>
        
        {showCopyButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 w-6 p-0"
            title="Copy URL"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
        
        {showExternalLink && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExternalLink}
            className="h-6 w-6 p-0"
            title="Open in new tab"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  // Card Variant - Full display with highlighted URL
  if (variant === 'card') {
    return (
      <div className={`bg-muted/50 border rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Subdomain URL</p>
            <p className="text-sm font-mono text-foreground truncate" title={fullUrl}>
              {fullUrl}
            </p>
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {showCopyButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            )}
            
            {showExternalLink && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExternalLink}
                className="h-8"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Inline Variant (default) - Simple text with copy button
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1 min-w-0">
        <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="text-sm font-mono text-foreground truncate" title={fullUrl}>
          {displayUrl}
        </span>
      </div>
      
      {showCopyButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 w-7 p-0 flex-shrink-0"
          title="Copy full URL"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      )}
      
      {showExternalLink && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExternalLink}
          className="h-7 w-7 p-0 flex-shrink-0"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Utility Components
// ============================================================================

/**
 * Simple subdomain text display without any buttons
 * Useful for read-only contexts
 */
export function SubdomainText({ 
  subdomain, 
  className = '' 
}: { 
  subdomain: string | null | undefined; 
  className?: string;
}) {
  if (!subdomain) {
    return <span className={`text-sm text-muted-foreground ${className}`}>-</span>;
  }

  return (
    <span className={`text-sm font-mono ${className}`}>
      {subdomain}.yourhospitalsystem.com
    </span>
  );
}

/**
 * Subdomain badge for compact display in lists
 * Shows only the subdomain name without the full domain
 */
export function SubdomainBadge({ 
  subdomain,
  className = '' 
}: { 
  subdomain: string | null | undefined;
  className?: string;
}) {
  if (!subdomain) {
    return null;
  }

  return (
    <Badge variant="secondary" className={`font-mono text-xs ${className}`}>
      <Globe className="h-3 w-3 mr-1" />
      {subdomain}
    </Badge>
  );
}
