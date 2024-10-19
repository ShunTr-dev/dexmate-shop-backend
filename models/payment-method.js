const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const paymentMethodSchema = new Schema({
    name: [{ type: String, required: false }]
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);