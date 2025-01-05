import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import path from "path";
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
app.use(express.static(path.join(__dirname, "build")));

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

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
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
    if (!userExists) throw new Error("Invalid username or password");
    if (password !== userExists.password) throw new Error("Invalid username or password");
    const token = generateToken({ username });
    return res.status(200).json({ message: "User logged in successfully", token });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get("/user", authenticate, async (req, res) => {
  try {
    const { username } = req.payload;
    if (!username) throw new Error("Cannot verify user");
    const userData = await User.findOne({ username }, { password: 0 });
    if (!userData) throw new Error("Could not fetch user data");
    return res.status(200).json(userData);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get("/books", authenticate, async (req, res) => {
  try {
    const { username } = req.payload;
    if (!username) throw new Error("Cannot verify User");
    const userBooks = await Book.find({ username });
    if (!userBooks) throw new Error("Could not fetch books");
    return res.status(200).json(userBooks);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.put("/books", authenticate, async (req, res) => {
  try {
    const { username } = req.payload;
    if (!username) throw new Error("Cannot verify User");
    const { name, pages, genre, author, rating, review } = req.body;
    if (!name || !pages || !genre || !rating || !author) throw new Error("Details missising");
    await Book.create({ username, name, pages, author, genre, rating, review });
    return res.status(200).json({ message: "Book added successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.delete("/books", authenticate, async (req, res) => {
  try {
    const { username } = req.payload;
    const { bookId } = req.body;
    console.log(req.body);
    if (!bookId) throw new Error("Book id not provided");
    const result = await Book.deleteOne({ username, _id: bookId });
    if (!result.acknowledged) throw new Error("Book could not be deleted");
    return res.status(200).json({ message: "Book deleted" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.put("/update-book/:bookId", authenticate, async (req, res) => {
  try {
    let response;
    const { username } = req.payload;
    const { bookId } = req.params;
    const { rating, review } = req.body;
    if (!bookId) throw new Error("Invalid book id");
    if (!rating && !review) throw new Error("Nothing to update");
    if (rating && review) {
      response = await Book.findOneAndUpdate({ username, _id: bookId }, { rating, review }, { new: true });
    } else if (!rating && review) {
      response = await Book.findOneAndUpdate({ username, _id: bookId }, { review }, { new: true });
    } else if (rating && !review) {
      response = await Book.findOneAndUpdate({ username, _id: bookId }, { rating }, { new: true });
    }
    if (!response) throw new Error("Could not update data");
    return res.status(200).json({ message: "Updated info successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get("/one-book/:bookId", authenticate, async (req, res) => {
  try {
    const { username } = req.payload;
    const { bookId } = req.params;
    if (!bookId) throw new Error("Invalid book id");
    const book = await Book.findOne({ _id: bookId });
    if (!book) throw new Error("Book not found");
    return res.status(200).json(book);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});
