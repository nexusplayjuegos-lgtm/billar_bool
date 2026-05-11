# Deploy Guide — Bool Sinuca Premiere

## Edge Functions Deploy

### Prerequisites
```bash
npm install -g supabase
supabase login
```

### Deploy all functions
```bash
# Link project (one time)
supabase link --project-ref fjgpfovrwtdgcydgezdh

# Deploy all functions
supabase functions deploy --all --project-ref fjgpfovrwtdgcydgezdh
```

### Or use the provided script
```bash
chmod +x scripts/deploy-edge-functions.sh
./scripts/deploy-edge-functions.sh
```

## Database Migrations

### Apply migrations
```bash
supabase db push
```

### Seed data (after migrations)
```bash
# Option 1: Direct SQL
psql <DATABASE_URL> -f supabase/seed/shop_items.sql
psql <DATABASE_URL> -f supabase/seed/season_pass.sql

# Option 2: Edge Function (requires service_role key)
curl -X POST https://fjgpfovrwtdgcydgezdh.supabase.co/functions/v1/seed-database \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

## Verify Deployment

### Check functions
```bash
supabase functions list --project-ref fjgpfovrwtdgcydgezdh
```

### Test endpoints
```bash
# Shop catalog
curl https://fjgpfovrwtdgcydgezdh.supabase.co/functions/v1/get-shop-catalog

# Season data (requires auth)
curl https://fjgpfovrwtdgcydgezdh.supabase.co/functions/v1/get-season \
  -H "Authorization: Bearer <ANON_KEY>"
```
