#!/bin/bash
# ============================================================
# Deploy Edge Functions to Supabase
# Bool Sinuca Premiere
# ============================================================

set -e

PROJECT_REF="fjgpfovrwtdgcydgezdh"
FUNCTIONS_DIR="supabase/functions"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing via npm..."
    npm install -g supabase
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Not logged in to Supabase. Please run:"
    echo "   supabase login"
    echo "   Then rerun this script."
    exit 1
fi

# Link project if not already linked
if [ ! -f "supabase/config.toml" ]; then
    echo "🔗 Linking project $PROJECT_REF..."
    supabase link --project-ref "$PROJECT_REF"
fi

echo "🚀 Deploying all Edge Functions..."
supabase functions deploy --all --project-ref "$PROJECT_REF"

echo ""
echo "✅ All Edge Functions deployed!"
echo ""
echo "Deployed functions:"
for fn in "$FUNCTIONS_DIR"/*; do
    if [ -d "$fn" ]; then
        echo "  ✓ $(basename "$fn")"
    fi
done
