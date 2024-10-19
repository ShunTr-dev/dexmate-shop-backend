const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: false }, // TO DO: ver si esto es necesario
    groupId: { type: mongoose.Schema.Types.ObjectId, required: false , ref: 'UserGroup', default: '64be2e7090b134d92ec1b68a'},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6, default: '$2a$12$IcIXZcsWonhhcPceT11KIeLeNUaIYcVXvIOpU6aQ7m.g51yUvAJ4y' },
    dateOfBirth: { type: Date, required: false, default: '' },
    phone: { type: String, required: false, default: '' },
    name: { type: String, required: false, default: '' },
    surname: { type: String, required: false, default: '' },
    legal: { type: Boolean, required: true, default: true },
    subscribe_newsletter: { type: Boolean, required: true , default: true},
    token: { type: String, required: false, default: '' },
    orders: { type: Number, required: false, default: 0 },
    totalItemsInOrders: { type: Number, required: false, default: 0 },
    totalSpentInOrders: { type: Number, required: false, default: 0 },
    active: { type: Boolean, required: true, default: true },
    isFake: { type: Boolean, required: true, default: false },
    isDemo: { type: Boolean, required: true, default: false },
    unsubcribeNewsletterToken: { type: String, required: true },
    // vericationCode: { type: String, required: false },
    resetPasswordToken: { type: String, required: false, default: '' },
    // resetPasswordExpires: { type: Date, required: false, default: '' },
    avatar: { type: String, required: false, default: '/img/default-user-avatar.webp' }, 
    paymentData: [{
        name: { type: String, required: false },
        cardNumber: { type: String, required: false },
        expirationDate: { type: String, required: false },
        cvv: { type: String, required: false },
        type: { type: String, required: false, default: 'credit-card' },
        default: { type: Boolean, required: false }
    }],
    mailing_addresses: [{
        name: { type: String, required: false },
        address: { type: String, required: false },
        address2: { type: String, required: false },
        city: { type: String, required: false },
        zipCode: { type: String, required: false },
        province: { type: String, required: false },
        country: { type: String, required: false }
    }],
    cart: {
        totalPrice: { type: Number, required: false, default: 0 },
        totalElements: { type: Number, required: false, default: 0 },
        products: [{
            id: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Product'},
            // productId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Product'},
            images: [{ type: String, required: false }],
            title: [{
                "en": { type: String, required: true },
                "es": { type: String, required: true }
            }],
            category: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'ProductCategory' }],
            quantity: { type: Number, required: false },
            price: { type: Number, required: false }
        }]
    }
});

userSchema.plugin(uniqueValidator);
userSchema.set('timestamps', true);

module.exports = mongoose.model('User', userSchema);