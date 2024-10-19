const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    invoiceNumber: { type: Number, required: true },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
        title: [{
            "en": { type: String, required: true },
            "es": { type: String, required: true }
        }],
        description: [{
            "en": { type: String, required: true },
            "es": { type: String, required: true }
        }],
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        amount: { type: Number, required: true },
    }],
    status: { type: mongoose.Schema.Types.ObjectId, required: true, default: '64be4af990b134d92ec1b693', ref: 'OrderStatus' }, // pending, processing, completed, cancelled by user, cancelled by shop
    shippingMethod: { type: mongoose.Schema.Types.ObjectId, required: true, default: '64be4ca490b134d92ec1b6a1', ref: 'ShippingMethod' }, // Standard, Express, Overnight, 2-Day, 3-Day, Same-Day, Next-Day, Free Shipping, Flat Rate, International, Local Pickup, Store Pickup, etc.----------------
    shippingStatus: { type: mongoose.Schema.Types.ObjectId, required: true, default: '64be4e9190b134d92ec1b6a8', ref: 'ShippingStatus' }, // pending, processing, completed, cancelled --------------
    shippingCost: { type: Number, required: true, default: 0 },
    shippingAddress: {
        name: { type: String, required: false },
        address: { type: String, required: false },
        address2: { type: String, required: false },
        city: { type: String, required: false },
        zipCode: { type: String, required: false },
        province: { type: String, required: false },
        country: { type: String, required: false }
    },
    paymentMethod: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'PaymentMethod' }, // Paypal, Credit Card
    paymentStatus: { type: mongoose.Schema.Types.ObjectId, required: true, default: '64be514790b134d92ec1b6b6', ref: 'PaymentStatus' }, // pending, processing, completed, cancelled --------------
    billingAddress: {
        name: { type: String, required: false },
        recipientName: { type: String, required: false },
        address: { type: String, required: false },
        address2: { type: String, required: false },
        city: { type: String, required: false },
        zipCode: { type: String, required: false },
        province: { type: String, required: false },
        country: { type: String, required: false }
    },
    totalPrice: { type: Number, required: true },
    totalPriceWithOutVAT: { type: Number, required: true },
    priceVAT: { type: Number, required: true },
    VAT: { type: Number, required: true },
    totalElements: { type: Number, required: true },
});

orderSchema.set('timestamps', true);

module.exports = mongoose.model('Order', orderSchema);

