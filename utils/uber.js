import { promises as fs } from "fs";
import { PdfReader } from "pdfreader";

/**
 * Uber receipts are a bit of a nightmare as each letter is read as
 * a new line by the pdfreader lib. We join the letters then parse the
 * entire text block.
 *
 * We have to do some date manipulation but getting the total is easy enough and
 * makes up for it.
 */
export async function uberReceipts() {
  const dir = "./receipts/uber";
  const files = await fs.readdir(dir);

  const entries = [];

  for await (const file of files) {
    const letters = [];

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
          letters.push(item.text);
          return;
        }
      });
    });

    const allText = letters.join("");

    const totalIndex = allText.indexOf("Totalamountpayable");
    const dateIndex = allText.indexOf("Invoicedate:");

    // We have to account for different string lengths of months (Sept being 4
    // chars and not 3). Sometimes there will be a trailing T or lowercase
    // a that we will need to remove
    const date = () => {
      const parsedFullDate = allText.substring(dateIndex + 12, dateIndex + 22).replace("T", "");
      const hasTrailingA = parsedFullDate.lastIndexOf("a") === parsedFullDate.length - 1;

      if (hasTrailingA) {
        return parsedFullDate.substring(0, parsedFullDate.length - 1);
      }
      return parsedFullDate;
    };

    // Convert the Jan Feb etc dates to 01 02 etc
    const month = date().replace(/[0-9]/g, "");
    const monthInNumFormat = Math.floor(
      "JanFebMarAprMayJunJulAugSeptOctNovDec".indexOf(month) / 3 + 1
    );
    const monthWithLeadingZero = monthInNumFormat < 10 ? `0${monthInNumFormat}` : monthInNumFormat;

    // We format the 1/xx/xxxx to be 01/xx/xxxx
    const indexOfMonth = date().indexOf(month);
    const dayValue = date().substring(0, indexOfMonth);
    const dayWithLeadingZero = dayValue < 10 ? `0${dayValue}` : dayValue;

    const year = date().substring(date().length - 4, date().length);

    // Format the date to match 01/08/2022 format
    const dateInNumFormat = `${dayWithLeadingZero}/${monthWithLeadingZero}/${year}`;

    const total = allText
      .substring(totalIndex + 19, totalIndex + 24)
      .replace("U", "")
      .replace("I", "");

    entries.push({ date: dateInNumFormat, total, type: "Uber Eats", file });
  }

  return entries;
}
