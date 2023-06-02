import path from "path";
import { rimraf } from "rimraf";
import fs from "fs";
console.log(rimraf);

export async function cleanCache() {
  await rimraf(path.join(__dirname, "..", "local-storage"));
  await rimraf(path.join(__dirname, "..", "screenshots"));
  await fs.mkdir(path.join(__dirname, "..", "screenshots"), () => {});
}
