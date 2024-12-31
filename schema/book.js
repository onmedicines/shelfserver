import mongoose from "mongoose";

const bookSchema = mongoose.Schema({
  name: { type: String, required: true },
  pages: { type: Number, required: true },
  author: { type: String, required: true },
  genre: [{ type: String, required: true }],
  username: { type: String, required: true },
  rating: { type: Number, required: true },
  review: { type: String, required: false },
});

export const Book = mongoose.model("Book", bookSchema);
