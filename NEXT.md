# Testing Architecture Improvements

## Console Output Testing

Add `expected.txt` files alongside existing `expected.ts` files to validate console output and improve error case coverage.

### Implementation Plan

1. **Error Cases First**: Start with error scenarios where files don't change
   - Only `expected.txt` file needed
   - Captures error messages and validation

2. **Success Cases (Optional)**: Add console validation for important feedback
   - Both `expected.ts` and `expected.txt` files
   - Validates user feedback like "inlined 3 occurrences"

### Benefits
- Better error case coverage (currently missing)
- Validates user experience and feedback quality  
- Cleaner test separation (file changes vs console output)

### Recommendation
Hybrid approach: prioritize error cases, add success output testing selectively for critical UX feedback.