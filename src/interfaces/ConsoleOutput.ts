export interface ConsoleOutput {
  log(_message: string): void;
  error(_message: string): void;
  write(_data: string): void;
}