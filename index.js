import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`server started on port ${port}.`);
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose
  .connect(process.env.ATLAS_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas.");
  })
  .catch(() => {
    console.log("Could not connect to MongoDB Atlas!");
  });

app.get("/", (req, res) => {
  res.send("<h1>Welcome to Book records</br>");
});
