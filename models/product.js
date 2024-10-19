const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
    images: [{ type: String, required: false }],
    thumbs: [{ type: String, required: false }], // ---------------------------------------------------------
    isHot: { type: Boolean, required: true, default: false }, // ---------------------------------------------------------
    category: [{ type: mongoose.Schema.Types.ObjectId, required: false, ref: 'ProductCategory' }],
    title: [{
        "en": { type: String, required: true },
        "es": { type: String, required: true }
    }],
    price: { type: Number, required: true },
    rating: { type: Number, required: true, default: 0 },
    reviews: { type: Number, required: true, default: 0 },
    shortDescription: [{
        "en": { type: String, required: true },
        "es": { type: String, required: true }
    }],
    largeDescription: [{
        "en": { type: String, required: true },
        "es": { type: String, required: true }
    }],
    visible: { type: Boolean, required: true, default: true }, // ---------------------------------------------------------
    SKU: { type: String, required: false },
    stock: { type: Number, required: true, default: 0 }, // --------------------------------------------------------- TO DO aviso últimas unidades
    sells: { type: Number, required: true, default: 0 },
    views: { type: Number, required: true, default: 0 },
    weight: { type: Number, required: false },
    dimensions: { type: String, required: false },
    // add diferent types of elements (isbn-13, ean, upc, duration,...)
    comments: [
        {
            "rating": { type: Number, required: true },
            "createdAt": { type: Date, required: true },
            "review": { type: String, required: true },
            "userId": { type: mongoose.Schema.Types.ObjectId, required: true },
            "visible": { type: Boolean, required: true },
        }
    ],
    creatorId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }
});

productSchema.set('timestamps', true);

module.exports = mongoose.model('Product', productSchema);

