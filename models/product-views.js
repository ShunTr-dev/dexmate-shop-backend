const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productViewSchema = new Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, required: true , ref: 'Product'},
    userId: { type: mongoose.Schema.Types.ObjectId, required: false , ref: 'User'},
    // ip: { type: String, required: true },
    // navigator: { type: String, required: true },
    // device: { type: String, required: true },
    // platform: { type: String, required: true },
    // country: { type: String, required: true },
    // region: { type: String, required: true },
    // city: { type: String, required: true },
    // latitude: { type: String, required: true },
    // longitude: { type: String, required: true },
    // timezone: { type: String, required: true },
    // currency: { type: String, required: true },
    // language: { type: String, required: true },
    // userAgent: { type: String, required: true },
    // os: { type: String, required: true },
    // browser: { type: String, required: true },
    // deviceType: { type: String, required: true },
    // deviceVendor: { type: String, required: true },
    // deviceModel: { type: String, required: true },
    // deviceBrowser: { type: String, required: true },
    // deviceEngine: { type: String, required: true },
    // deviceEngineVersion: { type: String, required: true },
    // deviceOs: { type: String, required: true },
    // deviceOsVersion: { type: String, required: true },
    // deviceIsDesktop: { type: Boolean, required: true },
    // deviceIsMobile: { type: Boolean, required: true },
    // deviceIsBot: { type: Boolean, required: true },
});

productViewSchema.set('timestamps', true);

module.exports = mongoose.model('ProductView', productViewSchema);