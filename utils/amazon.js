import { promises as fs } from "fs";
import { PdfReader } from "pdfreader";

/**
 * We have to account for pagination and multiple entries
 * in the Amazon receipts, hence the array of dates and totals.
 * If we don't get a matching date and total at the same index
 * we log an error.
 */
export async function amazonReceipts() {
  const dir = "./receipts/amazon";
  const files = await fs.readdir(dir);

  const entries = [];

  for await (const file of files) {
    const dates = [];
    const totals = [];

    let prevItem = null;

    const pdf = await fs.readFile(dir + "/" + file);

    await new Promise((resolve) => {
      new PdfReader({}).parseBuffer(pdf, (err, item) => {
        if (err) {
          console.log(err);
          return;
        }

        if (!item) {
          resolve();
          return;
        }

        if (item.text) {
          if (prevItem === "Total payable") {
            totals.push(item.text.replace("£", ""));
          }

          if (prevItem === "Order date") {
            dates.push(item.text.replaceAll(".", "/"));
          }

          prevItem = item.text;
          return;
        }
      });
    });

    totals.forEach((total, index) => {
      const date = dates[index];

      if (date && total) {
        entries.push({ date, total, type: "Amazon", file });
        return;
      }

      console.error("⚠️ No date or total found for file: ", file);
    });
  }

  return entries;
}
