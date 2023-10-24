const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    set: (value) => value.toLowerCase(),
    maxlength: 30
  },
  password: {
    type: String,
    maxlength: 256
  },
  role: {
    type: Number,
    enum: [0, 1, 2],
    //0 = admin, 1 = author, 2 = user
    default: 2
  },
  token: {
    type: String
  },
  savedBooks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book"
  }],
  publishedBooks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book"
  }]
});

module.exports = mongoose.model("user", userSchema);
