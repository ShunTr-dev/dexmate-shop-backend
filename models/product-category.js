const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productCategorySchema = new Schema({
    name: [{
        "en": { type: String, required: true },
        "es": { type: String, required: true }
    }],
    image: [{ type: String, required: false }],
    numberOfProducts: { type: Number, required: false },
    sells: { type: Number, required: false }
});

module.exports = mongoose.model('ProductCategory', productCategorySchema);