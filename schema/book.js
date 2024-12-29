import mongoose from "mongoose";

const bookSchema = mongoose.Schema({
  name: { type: String, required: true },
  pages: { type: Number, required: true },
  genre: { type: String, required: true },
  userId: { type: String, required: true },
});

export const Book = mongoose.model("Book", bookSchema);
