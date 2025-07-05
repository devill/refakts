export class ClaudeFormatter {
  formatHelpSection(helpCommands: string): string {
    return `## Available RefakTS Commands

\`\`\`
${helpCommands}
\`\`\``;
  }
}