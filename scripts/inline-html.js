const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const src = path.join(root, "public", "index.html");
const dest = path.join(root, "src", "generated", "index-html.js");

const html = fs.readFileSync(src, "utf8");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, `module.exports = ${JSON.stringify(html)};\n`, "utf8");

console.log(`[inline-html] wrote ${dest} (${html.length} chars)`);
