#!/bin/bash
set -e

echo "Generating Prisma Client..."
pnpm prisma generate

echo "Prisma Client generation complete!"
