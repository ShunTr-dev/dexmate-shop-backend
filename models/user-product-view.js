const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userProductViewSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true , ref: 'User'},
    productId: { type: mongoose.Schema.Types.ObjectId, required: true , ref: 'Product'}
});

userProductViewSchema.set('timestamps', true);

module.exports = mongoose.model('UserProductView', userProductViewSchema);