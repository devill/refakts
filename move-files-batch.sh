#!/bin/bash

# Automated file moving script for RefakTS reorganization
# Moves files one by one, tests after each move, commits if successful

set -e

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counter for moved files
moved_count=0

# Function to move a single file and test
move_and_test() {
    local source="$1"
    local dest="$2"
    
    # Check if source file exists
    if [ ! -f "src/$source" ]; then
        echo -e "${RED}❌ Source file not found: src/$source${NC}"
        return 1
    fi
    
    # Move the file using refakts
    if npm run dev -- move-file "src/$source" --destination "src/$dest" > /dev/null 2>&1; then
        # Run tests
        if npm test > /dev/null 2>&1; then
            # Tests passed - commit the change
            git add -A > /dev/null 2>&1
            git commit -m "Move $source → $dest" > /dev/null 2>&1
            echo -e "${GREEN}✅ $source${NC}"
            ((moved_count++))
            return 0
        else
            # Tests failed - revert
            git reset --hard HEAD > /dev/null 2>&1
            echo -e "${RED}❌ Tests failed for $source - reverted${NC}"
            return 1
        fi
    else
        # Move failed
        echo -e "${RED}❌ Move failed for $source${NC}"
        return 1
    fi
}

# Main execution
echo "🚀 Starting automated file reorganization..."
echo "📊 Progress tracking: Moving core/services files"
echo ""

# List of files to move (core/services section from checklist)
# Already moved: boundary-analyzer, class-method-finder, context-analyzer, cross-file-reference-finder, expression-analyzer
declare -a moves=(
    "services/expression-matcher.ts:core/services/expression-matcher.ts"
    "services/extraction-scope-analyzer.ts:core/services/extraction-scope-analyzer.ts"
    "services/file-system-helper.ts:core/services/file-system/helper.ts"
    "services/file-system-wrapper.ts:core/services/file-system/wrapper.ts"
    "utils/directory-utils.ts:core/services/file-system/directory.ts"
    "services/error-utils.ts:core/services/file-system/error-utils.ts"
    "services/file-validator.ts:core/services/file-validator.ts"
    "services/moved-file-import-updater.ts:core/services/moved-file-import-updater.ts"
    "services/import-reference-service.ts:core/services/import-reference-service.ts"
    "services/method-dependency-analyzer.ts:core/services/method-dependency-analyzer.ts"
    "services/position-converter.ts:core/services/position-converter.ts"
    "services/project-scope-service.ts:core/services/project-scope-service.ts"
    "services/range-analysis-request.ts:core/services/range-analysis-request.ts"
    "services/range-analyzer.ts:core/services/range-analyzer.ts"
    "services/structural-analyzer.ts:core/services/structural-analyzer.ts"
    "services/usage-finder-service.ts:core/services/usage-finder-service.ts"
    "services/usage-type-analyzer.ts:core/services/usage-type-analyzer.ts"
    "services/variable-declaration-finder.ts:core/services/variable-declaration-finder.ts"
    "services/variable-name-validator.ts:core/services/variable-name-validator.ts"
    "services/variable-reference-request.ts:core/services/variable-reference-request.ts"
    "locators/scope-analyzer.ts:core/services/scope-analyzer.ts"
    "locators/shadowing-analyzer.ts:core/services/shadowing-analyzer.ts"
    "locators/shadowing-detector.ts:core/services/shadowing-detector.ts"
    "locators/source-file-helper.ts:core/services/source-file-helper.ts"
    "locators/usage-type-detector.ts:core/services/usage-type-detector.ts"
)

# Process each move
for move in "${moves[@]}"; do
    IFS=':' read -r source dest <<< "$move"
    
    if ! move_and_test "$source" "$dest"; then
        echo ""
        echo -e "${RED}🛑 Stopping due to failure with: $source${NC}"
        echo -e "${GREEN}📊 Successfully moved: $moved_count files${NC}"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}🎉 All files moved successfully!${NC}"
echo -e "${GREEN}📊 Total moved: $moved_count files${NC}"