#!/bin/bash
# Manual deployment script for n8n chat fix
# Run this on the production server

echo "🚀 Deploying n8n Chat Fix"
echo "=========================="
echo ""

# Check if we're on the production server
if [ ! -d "/home/bitnami/hospital-frontend" ]; then
    echo "❌ Error: Not on production server or hospital-frontend not found"
    exit 1
fi

cd /home/bitnami/hospital-frontend

echo "📋 Current directory: $(pwd)"
echo ""

# Backup current .next directory
echo "📦 Creating backup..."
if [ -d ".next" ]; then
    cp -r .next .next.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created"
else
    echo "⚠️  No .next directory found"
fi

echo ""
echo "🔍 Checking for source files..."

# Check if we have source files
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "This appears to be a built app without source files"
    echo ""
    echo "📝 Manual fix required:"
    echo "1. The chat widget is compiled in .next/static/chunks/"
    echo "2. You need to either:"
    echo "   a) Upload full source code and rebuild"
    echo "   b) Manually edit the compiled JavaScript (not recommended)"
    echo ""
    exit 1
fi

# If we have source, check for components directory
if [ -d "components" ]; then
    echo "✅ Source files found"
    echo ""
    echo "📝 To apply the fix:"
    echo "1. Edit components/chat-widget.tsx"
    echo "2. Add after line ~42: const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'"
    echo "3. Change line ~100 from:"
    echo "   const response = await fetch(\"http://localhost:3000/api/n8n/chat\", {"
    echo "   to:"
    echo "   const response = await fetch(\`\${API_URL}/api/n8n/chat\`, {"
    echo "4. Run: npm run build"
    echo "5. Run: pm2 restart hospital-frontend"
else
    echo "❌ No components directory found"
    echo "Source files need to be uploaded first"
fi

echo ""
echo "=========================="
