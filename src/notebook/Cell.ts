export class Cell {
  id: number;
  prompt: string;
  response: string | null;
  model: string | null;
  timestamp: number | null;
  status: string | null;

  constructor(id: number, prompt: string = "") {
    this.id = id;
    this.prompt = prompt;

    this.response = null;
    this.model = null;
    this.timestamp = null;
    this.status = null;
  }
}
