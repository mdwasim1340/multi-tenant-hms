# TypeScript Error Fix - Billing Page

## Error
```
'percent' is of type 'unknown'.
Line 719, Column 78-85
File: hospital-management-system/app/billing/page.tsx
```

## Root Cause
The Recharts `Pie` component's `label` prop was using destructured parameters `{ name, percent }` without proper typing, and TypeScript couldn't infer the type of `percent`.

## Solution

### Before:
```typescript
label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
```

### After:
```typescript
label={(entry: any) => {
  const percent = entry.percent || 0
  return `${entry.name}: ${(percent * 100).toFixed(0)}%`
}}
```

## Changes Made

1. **Changed parameter type** from destructured `{ name, percent }` to `entry: any`
2. **Added null safety** with `entry.percent || 0` to handle undefined values
3. **Expanded to multi-line** for better readability and error handling

## Why This Works

- Using `entry: any` allows TypeScript to accept the Recharts label props
- Extracting `percent` with a fallback value prevents runtime errors
- The function still returns the same formatted string

## Testing

✅ TypeScript compilation passes
✅ No type errors
✅ Chart labels still display correctly
✅ Percentage calculation works as expected

## Status
✅ **FIXED** - TypeScript error resolved, no diagnostics found
