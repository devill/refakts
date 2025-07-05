// Sample content for testing section replacement

export const BASIC_MARKDOWN_CONTENT = `# Example Document

Some introductory text.

<!-- AUTO-GENERATED HELP START -->
Old help content here
<!-- AUTO-GENERATED HELP END -->

More content below.

<!-- AUTO-GENERATED QUALITY-CHECKS START -->
Old quality checks here
<!-- AUTO-GENERATED QUALITY-CHECKS END -->

Final content.`;

export const MISSING_START_MARKER = `# Example Document

Some introductory text.

Old help content here
<!-- AUTO-GENERATED HELP END -->

More content below.`;

export const MISSING_END_MARKER = `# Example Document

Some introductory text.

<!-- AUTO-GENERATED HELP START -->
Old help content here

More content below.`;

export const NO_MARKERS = `# Example Document

Some introductory text without any markers.

More content below.`;

export const NESTED_MARKERS = `# Example Document

<!-- AUTO-GENERATED HELP START -->
Some content with
<!-- AUTO-GENERATED HELP START -->
nested markers
<!-- AUTO-GENERATED HELP END -->
should handle this
<!-- AUTO-GENERATED HELP END -->

Final content.`;