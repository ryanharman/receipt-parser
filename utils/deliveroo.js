import { promises as fs } from "fs";
import { PdfReader } from "pdfreader";

/**
 * God bless Deliveroo and their simple receipts.
 */
export async function deliverooReceipts() {
  const dir = "./receipts/deliveroo";
  const files = await fs.readdir(dir);

  const entries = [];

  for await (const file of files) {
    let date = null;
    let total = null;

    let prevItem = null;

    const pdf = await fs.readFile(dir + "/" + file);

    const pdfResult = await new Promise((resolve) => {
      new PdfReader({}).parseBuffer(pdf, (err, item) => {
        if (err) {
          console.log(err);
          return;
        }

        if (!item) {
          resolve({ date, total });
          return;
        }

        if (item.text) {
          if (prevItem === "Deliveroo subtotal") {
            total = item.text.replace("£", "");
          }

          if (item.text.includes("Order date:")) {
            // Assigns the date and removes the order date text
            date = item.text.replace("Order date:", "").trim();
          }

          // console.log(item.text);
          prevItem = item.text;
          return;
        }
      });
    });

    entries.push({ ...pdfResult, type: "Deliveroo", file });
  }

  return entries;
}
