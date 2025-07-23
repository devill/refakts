export function createLoadFileError(error: unknown, originalPath: string): Error {
  const errorWithCode = error as { code?: string; message?: string };
  if (errorWithCode.code === 'EACCES' || errorWithCode.message?.includes('permission denied')) {
    return new Error(`Permission denied: Cannot read file ${originalPath}`);
  }
  if (errorWithCode.code === 'ENOENT' || errorWithCode.message?.includes('no such file')) {
    return new Error(`File not found: ${originalPath}`);
  }
  return new Error(`Cannot load file ${originalPath}: ${errorWithCode.message || 'Unknown error'}`);
}