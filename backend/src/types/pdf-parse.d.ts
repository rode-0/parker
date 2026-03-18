declare module "pdf-parse" {
  class PDFParse {
    constructor(dataBuffer: Buffer);
    getText(): Promise<string>;
    getInfo(): Promise<Record<string, unknown>>;
  }

  export { PDFParse };
}
