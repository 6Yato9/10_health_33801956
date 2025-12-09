// Script to generate bcrypt password hash
// Run with: node scripts/generate-hash.js

const bcrypt = require("bcrypt");

const password = "smiths123ABC$";
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function (err, hash) {
  if (err) {
    console.error("Error generating hash:", err);
    return;
  }
  console.log("Password:", password);
  console.log("Hash:", hash);
  console.log("\nUse this hash in insert_test_data.sql");
});
