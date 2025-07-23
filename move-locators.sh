#!/bin/bash

# Move all files to core/locators directory
echo "🔍 Moving files to core/locators..."

# Main locator files
npm run dev -- move-file "src/locators/VariableNameOperations.ts" --destination "src/core/locators/variable-name-operations.ts"
npm run dev -- move-file "src/locators/declaration-finder.ts" --destination "src/core/locators/declaration-finder.ts"  
npm run dev -- move-file "src/locators/position-finder.ts" --destination "src/core/locators/position-finder.ts"
npm run dev -- move-file "src/locators/position-service.ts" --destination "src/core/locators/position-service.ts"
npm run dev -- move-file "src/locators/variable-locator.ts" --destination "src/core/locators/variable-locator.ts"
npm run dev -- move-file "src/locators/variable-node-matcher.ts" --destination "src/core/locators/variable-node-matcher.ts"
npm run dev -- move-file "src/locators/variable-result-builder.ts" --destination "src/core/locators/variable-result-builder.ts"

# Type files used by locators
npm run dev -- move-file "src/core/position-data.ts" --destination "src/core/locators/position-data.ts"
npm run dev -- move-file "src/core/shadowing-analysis-request.ts" --destination "src/core/locators/shadowing-analysis-request.ts"
npm run dev -- move-file "src/core/variable-context.ts" --destination "src/core/locators/variable-context.ts"

echo "✅ All core/locators files moved successfully!"