const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    postContent: {
        type: String,
        required: true
    },
    scheduleTime: {
        type: Date,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    shares: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model("Post", PostSchema);
