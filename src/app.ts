import express, { type Application } from "express";
import dotenv from "dotenv";

dotenv.config();

const app: Application = express();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server up and running at http://localhost:${PORT}`);
});
