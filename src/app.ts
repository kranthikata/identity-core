import express, { type Application } from "express";
import { env } from "./config/env.js";

const app: Application = express();

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server up and running at http://localhost:${PORT}`);
});
