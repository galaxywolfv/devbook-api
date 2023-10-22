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
    enum: [0, 1],
    default: 1
  },
  token: { 
    type: String 
  },
});

module.exports = mongoose.model("user", userSchema);
