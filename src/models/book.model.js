const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  author: {
    type: String,
    required: true,
  },
  isbn: {
    type: [String],
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  image: String,
  description: String
});

module.exports = mongoose.model("Book", bookSchema);
