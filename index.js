import { promises as fs } from "fs";

import { uberReceipts } from "./utils/uber.js";
import { deliverooReceipts } from "./utils/deliveroo.js";
import { amazonReceipts } from "./utils/amazon.js";

async function main() {
  console.log("Parsing receipts... 📄");

  const uberItems = await uberReceipts();
  const deliverooItems = await deliverooReceipts();
  const amazonItems = await amazonReceipts();
  const totalItems = [...uberItems, ...deliverooItems, ...amazonItems];

  console.log("Writing to CSV... 👨🏻‍💻");
  const data = [
    "Date,Total,Type,Filename",
    ...totalItems.map((item) => `${item.date},${item.total},${item.type},${item.file}`),
  ];
  await fs.writeFile("output.csv", data.join("\n"));

  console.log("Done - Results written to output.csv 🚀");
}

await main();
