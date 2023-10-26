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
  description: String
});

module.exports = mongoose.model("Book", bookSchema);
