import { ConsoleOutput } from './console-output';

export class StandardConsole implements ConsoleOutput {
  log(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(message);
  }

  write(data: string): void {
    process.stdout.write(data);
  }
}