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

  formatContentForReadme(rawContent: { helpCommands: string; qualityChecks: string; content: string }) {
    return {
      content: rawContent.content,
      formattedHelp: this.formatHelpSection(rawContent.helpCommands),
      formattedQuality: this.formatQualitySection(rawContent.qualityChecks)
    };
  }
}