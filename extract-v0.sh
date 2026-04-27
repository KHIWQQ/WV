#!/bin/bash
set -e
# Backup root components.json
if [ -f "components.json" ]; then
  mv components.json components.json.bak
fi

# Run extraction in a separate folder
mkdir -p v0-extract
cd v0-extract

cat << 'JSON' > components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
JSON

# Run v0. Yes command handles any prompts
yes | npx -y v0@latest add nC5xhbicBdG || true

cd ..
# Restore root components.json
if [ -f "components.json.bak" ]; then
  mv components.json.bak components.json
fi

ls -la v0-extract
ls -la v0-extract/components
