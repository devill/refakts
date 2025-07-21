export class Button {
  private text: string;

  constructor(text: string) {
    this.text = text;
  }

  render(): string {
    return `<button>${this.text}</button>`;
  }
}