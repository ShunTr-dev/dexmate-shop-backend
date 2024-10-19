const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const invoiceSchema = new Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, required: true , ref: 'Order'},
    userId: { type: mongoose.Schema.Types.ObjectId, required: true , ref: 'User'},
    invoiceNumber: { type: String, required: true }, // poner autoincremental pero si se borra una que se reponga el número
    invoiceDate: { type: Date, required: true },
    invoiceType: { type: String, required: true }, // ---------------------------------------------------------
    invoiceStatus: { type: String, required: true }, // ---------------------------------------------------------
});

invoiceSchema.set('timestamps', true);

module.exports = mongoose.model('Invoice', invoiceSchema);