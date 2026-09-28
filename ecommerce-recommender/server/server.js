const path = require("node:path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = require("./app");

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Add it to server/.env.");
  }
  await mongoose.connect(process.env.MONGO_URI);
  app.listen(port, () => {
    console.log(`API server listening at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error(`Unable to start server: ${error.message}`);
  process.exit(1);
});
