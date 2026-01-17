import { PDFParse } from "pdf-parse";

export async function parsePdf(pdfBuffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: pdfBuffer });
    const data = await parser.getText();
    return data.text;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF file.");
  }
}