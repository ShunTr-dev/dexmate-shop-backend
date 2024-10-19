const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderStatusSchema = new Schema({
    name: [{
        "en": { type: String, required: true },
        "es": { type: String, required: true }
    }]
});

module.exports = mongoose.model('OrderStatus', orderStatusSchema);