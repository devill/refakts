#!/bin/bash

# Dynamic file moving script for RefakTS reorganization
# Reads the checklist, moves the next pending file, tests, and updates checklist

set -e

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to find the next pending file from checklist
get_next_pending_file() {
    # Parse the checklist to find the first unchecked file (skip [S] marked files)
    local next_move=$(grep -n "^- \[ \]" REORGANIZATION_CHECKLIST.md | head -1)
    
    if [ -z "$next_move" ]; then
        echo ""
        return 1
    fi
    
    # Extract the file paths using more robust parsing that handles special cases
    local line=$(echo "$next_move" | cut -d: -f2-)
    local source=$(echo "$line" | sed -n 's/^- \[ \] `\([^`]*\)`.* → `\([^`]*\)`.*/\1/p')
    local dest=$(echo "$line" | sed -n 's/^- \[ \] `\([^`]*\)`.* → `\([^`]*\)`.*/\2/p')
    
    if [ -z "$source" ] || [ -z "$dest" ]; then
        echo ""
        return 1
    fi
    
    echo "$source:$dest"
    return 0
}

# Function to move a single file and test
move_and_test() {
    local source="$1"
    local dest="$2"
    
    echo -e "${BLUE}🔄 Processing: $source → $dest${NC}"
    
    # Check if source file exists
    if [ ! -f "src/$source" ]; then
        echo -e "${YELLOW}⚠️  Source file not found: src/$source (might be already moved)${NC}"
        return 2  # Special return code for "already moved"
    fi
    
    # Check if destination already exists
    if [ -f "src/$dest" ]; then
        echo -e "${YELLOW}⚠️  Destination already exists: src/$dest (might be already moved)${NC}"
        return 2  # Special return code for "already moved"
    fi
    
    # Move the file using refakts
    echo -e "${BLUE}   Moving file...${NC}"
    if npm run dev -- move-file "src/$source" --destination "src/$dest" > /dev/null 2>&1; then
        echo -e "${BLUE}   Running tests...${NC}"
        # Run tests
        if npm test > /dev/null 2>&1; then
            echo -e "${BLUE}   Updating checklist...${NC}"
            # Update checklist to mark as completed
            npx ts-node verify-checklist.ts > /dev/null 2>&1
            
            echo -e "${BLUE}   Committing changes...${NC}"
            # Tests passed - commit the change
            git add -A > /dev/null 2>&1
            git commit -m "Move $source → $dest

Updated checklist automatically after successful move and test." > /dev/null 2>&1
            
            echo -e "${GREEN}✅ SUCCESS: $source${NC}"
            return 0
        else
            # Tests failed - revert
            echo -e "${RED}   Tests failed - reverting...${NC}"
            git reset --hard HEAD > /dev/null 2>&1
            echo -e "${RED}❌ FAILED: Tests failed for $source - reverted${NC}"
            return 1
        fi
    else
        # Move failed
        echo -e "${RED}❌ FAILED: Move command failed for $source${NC}"
        return 1
    fi
}

# Function to get current progress
get_progress() {
    npx ts-node verify-checklist.ts 2>/dev/null | grep "Completed:" | tail -1 || echo "Progress: Unknown"
}

# Main execution
echo -e "${BLUE}🚀 Starting dynamic file reorganization...${NC}"
echo -e "${BLUE}📊 Current progress: $(get_progress)${NC}"
echo ""

# Counter for this session
moved_count=0
max_moves=${1:-10}  # Default to 10 moves, can be overridden with argument

echo -e "${BLUE}🎯 Will attempt up to $max_moves moves this session${NC}"
echo ""

for ((i=1; i<=max_moves; i++)); do
    echo -e "${BLUE}=== Move $i of $max_moves ===${NC}"
    
    # Get next pending file
    next_file=$(get_next_pending_file)
    
    if [ -z "$next_file" ]; then
        echo -e "${GREEN}🎉 No more pending files found! Reorganization complete!${NC}"
        break
    fi
    
    # Parse source and destination
    IFS=':' read -r source dest <<< "$next_file"
    
    # Attempt the move
    move_result=0
    move_and_test "$source" "$dest" || move_result=$?
    
    if [ $move_result -eq 0 ]; then
        ((moved_count++))
        echo ""
    elif [ $move_result -eq 2 ]; then
        # File already moved, update checklist and continue
        echo -e "${YELLOW}   Updating checklist for already-moved file...${NC}"
        npx ts-node verify-checklist.ts > /dev/null 2>&1
        echo -e "${GREEN}✅ UPDATED: Checklist corrected for $source${NC}"
        echo ""
    else
        # Real failure - stop
        echo ""
        echo -e "${RED}🛑 Stopping due to failure with: $source${NC}"
        echo -e "${GREEN}📊 Successfully moved in this session: $moved_count files${NC}"
        echo -e "${BLUE}📊 Updated progress: $(get_progress)${NC}"
        exit 1
    fi
done

echo -e "${GREEN}🏁 Session complete!${NC}"
echo -e "${GREEN}📊 Successfully moved in this session: $moved_count files${NC}"
echo -e "${BLUE}📊 Final progress: $(get_progress)${NC}"

if [ $moved_count -eq 0 ]; then
    echo -e "${YELLOW}💡 No files were moved this session. All checked files may already be in place.${NC}"
fi