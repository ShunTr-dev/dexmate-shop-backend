const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const errorLogSchema = new Schema({ // poner que se borre cada día
    /*
    userId: { type: mongoose.Schema.Types.ObjectId, required: true , ref: 'User'},
    ip: { type: String, required: true },
    navigator: { type: String, required: true },
    device: { type: String, required: true },
    platform: { type: String, required: true },
    country: { type: String, required: true },
    region: { type: String, required: true },
    city: { type: String, required: true },
    latitude: { type: String, required: true },
    longitude: { type: String, required: true },
    timezone: { type: String, required: true },
    currency: { type: String, required: true },
    language: { type: String, required: true },
    userAgent: { type: String, required: true },
    os: { type: String, required: true },
    browser: { type: String, required: true },
    deviceType: { type: String, required: true },
    deviceVendor: { type: String, required: true },
    deviceModel: { type: String, required: true },
    deviceBrowser: { type: String, required: true },
    deviceEngine: { type: String, required: true },
    deviceEngineVersion: { type: String, required: true },
    deviceOs: { type: String, required: true },
    deviceOsVersion: { type: String, required: true },
    deviceIsDesktop: { type: Boolean, required: true },
    deviceIsMobile: { type: Boolean, required: true },
    deviceIsBot: { type: Boolean, required: true },
    */
    message: { type: String, required: true },
    errorCode: { type: Number, required: true },
    error: { type: Object, required: true },
    method: { type: String, required: true },
    url: { type: String, required: true },
    body: { type: Object, required: true },
    params: { type: Object, required: true },
    query: { type: Object, required: true },
    headers: { type: Object, required: true },
});

errorLogSchema.set('timestamps', true);

module.exports = mongoose.model('ErrorLog', errorLogSchema);