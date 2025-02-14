import express from "express";
import cors from "cors";
import auth from "./routes/auth.ts";
import records from "./routes/record.ts";

import crypto from 'node:crypto';

const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", auth);
app.use("/record", records);

console.log(crypto.randomBytes(64).toString('hex'));

// start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});