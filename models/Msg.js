const { Schema, model } = require('mongoose');

const Msg = new Schema({
    senderName: { type: String,  required: true },
    receiverName: { type: String,  required: true },
    text: { type: String, required: true },
    theme: { type: String, required: true },
    sentAt: { type: Number, required: true },
});

module.exports = model('Msg', Msg);
