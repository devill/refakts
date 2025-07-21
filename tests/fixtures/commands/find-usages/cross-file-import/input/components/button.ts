import { formatName } from '../utils/helpers';

export class Button {
  private text: string;
  
  constructor(text: string) {
    this.text = text;
  }
  
  render(): void {
    console.log(`<button>${this.text}</button>`);
  }
  
  updateText(firstName: string, lastName: string): void {
    this.text = formatName(firstName, lastName);
  }
}