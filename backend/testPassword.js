const bcrypt = require("bcryptjs");

const password = "admin111";

const hash = "$2b$10$Fvh/UQsNB5TNuETS.rgN7OWDVpQsMRKgghsuIx6lr9PIIplsCDdtK";

bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log("Password cocok:", result);
});
