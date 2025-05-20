const mongoose = require('mongoose');

const nameDataSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    captions: {
        type: [String],  // Array of captions
        required: true
    },
    hashtags: {
        type: [String],  // Array of hashtags
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

const NameData = mongoose.model('NameData', nameDataSchema);

module.exports = NameData;
