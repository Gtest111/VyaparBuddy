const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    postContent: { type: String, required: true },
    scheduleTime: { type: Date, required: true }
});

module.exports = mongoose.model("Post", postSchema);
