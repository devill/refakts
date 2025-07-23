#!/bin/bash

# Function to run a single move and test
move_and_test() {
    local source="$1"
    local destination="$2"
    local description="$3"
    
    echo "🔄 Moving: $description"
    echo "   $source → $destination"
    
    npm run dev -- move-file "$source" --destination "$destination"
    if [ $? -ne 0 ]; then
        echo "❌ Move failed for $source"
        exit 1
    fi
    
    echo "🧪 Running tests..."
    npm test
    if [ $? -ne 0 ]; then
        echo "❌ Tests failed after moving $source"
        echo "🛑 STOPPING at first failure as requested"
        exit 1
    fi
    
    echo "✅ Move successful: $description"
    echo ""
}

echo "🔍 Moving files to core/locators/ with testing between each move..."
echo ""

# Move each file one by one with testing
move_and_test "src/locators/VariableNameOperations.ts" "src/core/locators/variable-name-operations.ts" "VariableNameOperations.ts (rename to snake-case)"
move_and_test "src/locators/declaration-finder.ts" "src/core/locators/declaration-finder.ts" "declaration-finder.ts"
move_and_test "src/locators/position-finder.ts" "src/core/locators/position-finder.ts" "position-finder.ts"
move_and_test "src/locators/position-service.ts" "src/core/locators/position-service.ts" "position-service.ts"
move_and_test "src/locators/variable-locator.ts" "src/core/locators/variable-locator.ts" "variable-locator.ts"
move_and_test "src/locators/variable-node-matcher.ts" "src/core/locators/variable-node-matcher.ts" "variable-node-matcher.ts"
move_and_test "src/locators/variable-result-builder.ts" "src/core/locators/variable-result-builder.ts" "variable-result-builder.ts"

# Type files used by locators
move_and_test "src/core/position-data.ts" "src/core/locators/position-data.ts" "position-data.ts (move from core to locators)"
move_and_test "src/core/shadowing-analysis-request.ts" "src/core/locators/shadowing-analysis-request.ts" "shadowing-analysis-request.ts (move from core to locators)" 
move_and_test "src/core/variable-context.ts" "src/core/locators/variable-context.ts" "variable-context.ts (move from core to locators)"

echo "🎉 All core/locators files moved successfully with tests passing!"