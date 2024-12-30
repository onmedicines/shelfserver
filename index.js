import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

import { User } from "./schema/user.js";
import { Book } from "./schema/book.js";

const app = express();
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`server started on port ${port}.`);
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose
  .connect(process.env.ATLAS_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas.");
  })
  .catch(() => {
    console.log("Could not connect to MongoDB Atlas!");
  });

const generateToken = (payload) => {
  try {
    const token = jwt.sign(payload, process.env.SECRET_KEY);
    return token;
  } catch (err) {
    throw new Error("Could not generate token");
  }
};

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) throw new Error("No verification token found");
    const payload = jwt.verify(token, process.env.SECRET_KEY);
    if (!payload) throw new Error("Could not verify token");
    req.payload = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
};

app.get("/", (req, res) => {
  res.send("<h1>Welcome to Book records</br>");
});

app.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const usernameAlreadyExists = await User.findOne({ username });
    if (usernameAlreadyExists) throw new Error("Username already exists");
    const emailAlreadyExists = await User.findOne({ email });
    if (emailAlreadyExists) throw new Error("Email already exists");

    await User.create({ name, username, email, password });
    const token = generateToken({ username });
    return res.status(200).json({ message: "User created successfully", token });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const userExists = await User.findOne({ username });
    if (!userExists && password !== userExists.password) throw new Error("Invalid username or password");
    const token = generateToken({ username });
    return res.status(200).json({ message: "User logged in successfully", token });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});
