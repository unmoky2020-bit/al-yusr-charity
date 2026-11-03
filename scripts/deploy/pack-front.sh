#!/usr/bin/env bash
# Builds the site and packs it for Hostinger in two archives (each under 30 MB, so they can also be
# copied through the desktop bridge): deploy-out/front-1-assets.tgz and deploy-out/front-2-site.tgz.
# On the server:  tar -xzf front-1-assets.tgz && tar -xzf front-2-site.tgz && bash deploy.sh --check && bash deploy.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
npm run build
git checkout -q -- public/sitemap.xml public/sitemap-base.xml 2>/dev/null || true   # the build regenerates them
rm -rf deploy-out/pkg && mkdir -p deploy-out/pkg
cp -a dist deploy-out/pkg/site
cp scripts/deploy/front-deploy.sh deploy-out/pkg/deploy.sh
tar -czf deploy-out/front-1-assets.tgz -C deploy-out/pkg site/assets
tar -czf deploy-out/front-2-site.tgz -C deploy-out/pkg --exclude=site/assets .
echo "files: $(find deploy-out/pkg/site -type f | wc -l)"
ls -la deploy-out/front-*.tgz
