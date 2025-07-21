export class DirectoryUtils {
  static async withRootDirectory<T>(directory: string, operation: () => Promise<T>): Promise<T> {
    const originalCwd = process.cwd();
    try {
      process.chdir(directory);
      return await operation();
    } finally {
      process.chdir(originalCwd);
    }
  }
}