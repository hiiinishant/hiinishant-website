const crypto = require("crypto");

const password = process.argv[2];

if (!password) {
  console.log("Usage: node hash.js <password>");
  console.log("Example: node hash.js nishant2am");
  process.exit(1);
}

const hash = crypto.createHash("sha256").update(password).digest("hex");
console.log("\n==================================================");
console.log(`Password:      ${password}`);
console.log(`SHA-256 Hash:  ${hash}`);
console.log("==================================================");
console.log("Set this hash as the ADMIN_PASSWORD environment variable on your backend server.\n");
