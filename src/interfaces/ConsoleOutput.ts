export interface ConsoleOutput {
  log(message: string): void;
  error(message: string): void;
  write(data: string): void;
}