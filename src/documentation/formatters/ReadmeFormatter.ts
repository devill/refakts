export class ReadmeFormatter {
  formatHelpSection(helpCommands: string): string {
    return `## Available Commands

\`\`\`
${helpCommands}
\`\`\``;
  }

  formatQualitySection(qualityChecks: string): string {
    return `**Quality Checks Include:**
\`\`\`\`
${qualityChecks}
\`\`\`\``;
  }
}