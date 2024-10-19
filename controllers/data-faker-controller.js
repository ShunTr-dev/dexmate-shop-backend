// npm install @faker-js/faker --save-dev
// https://fakerjs.dev/api/

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker/locale/es');

const errorHandler = require('../utils/error-handler');

const User = require('../models/user');
const Order = require('../models/order');
const Product = require('../models/product');
const ProductStatistic = require('../models/product-statistic');
const { tr } = require('@faker-js/faker');
const { createUser } = require('./users-controllers');
const { getTopOrderInvoice } = require('./orders-controller');

const addFakeUsers = async (req, res, next) => {
    const usersToAdd = req.params.num_users_to_add;

    for (let i = 0; i < usersToAdd; i++) {

        try {
            const user = createUser(new User({
                email: faker.internet.email().toLowerCase(),
                dateOfBirth: faker.date.birthdate(),
                phone: faker.phone.number(),
                name: faker.person.firstName(),
                surname: faker.person.lastName(),
                isFake: true,
                isDemo: true,
                active: false,
                paymentData: [{
                    name: 'Credit card 23',
                    cardNumber: faker.finance.creditCardNumber(),
                    expirationDate: faker.date.future(),
                    cvv: faker.finance.creditCardCVV(),
                    default: true
                }],
                mailing_addresses: [{
                    name: 'Home',
                    address: faker.location.streetAddress(),
                    address2: faker.location.secondaryAddress(),
                    city: faker.location.city(),
                    zipCode: faker.location.zipCode(),
                    province: faker.location.state(),
                    country: faker.location.country()
                }]
            }));
        } catch (error) {
            return errorHandler(req, res, error.message, error.code, error);
        }
    }

    res.json({ completed: true });
};

// busca un usuario con isFake: true con el menor número de pedidos y le añade un pedido
// busca los productos menos vendidos y los añade al pedido
// TO DO encotrar una manera de guardar las estadisticas de los productos de una manera con sentido no recorriendo el array entero
// TO DO PASAR ESTA FUNCIÓN A UNA FUNCIÓN DE UTILIDADES y la creación de los pedidos a un controlador de pedidos
// Y el usuario creado por la función de crear usuarios
// y la función de crear orders a la funcion de crear orders
const addFakeOrders = async (req, res, next) => { // TO DO: usar la función de products statistics para añadir los datos
    const ordersToAdd = req.params.num_orders_to_add;

    for (let i = 0; i < ordersToAdd; i++) {
        let productsStatistics = [];

        startDate = new Date(2023, 0, 1);
        endDate = new Date();

        const sellDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
        const formatedSellDate = sellDate.toISOString().slice(0, 10);

        let user;
        try {
            user = await User.find().limit(1).sort({ orders: 'asc' });
        } catch (error) {
            return errorHandler(req, res, 'Something went wrong, could not find a user.', 500, error);
        }

        if (!user) {
            return errorHandler(req, res, 'Something went wrong, could not find a user.', 404, error);
        } else {
            user = user[0];
            // aumentamos el número de pedidos del usuario con transacción
            user.orders += 1;
        }

        let products;
        const numProducts = Math.floor(Math.random() * 5) + 1;

        try {
            products = await Product.find().limit(numProducts).sort({ sells: 'asc' });
        } catch (error) {
            return errorHandler(req, res, 'Something went wrong, could not find products.', 500, error);
        }

        let orderProducts = [];
        let totalPrice = 0;
        let totalElements = 0;

        if (!user) {
            return errorHandler(req, res, 'Something went wrong, could not find products.', 404, error);
        } else {
            products.forEach(async product => {
                const elements = Math.floor(Math.random() * 5) + 1;
                orderProducts.push({
                    productId: product._id,
                    title: product.title,
                    price: product.price,
                    quantity: elements,
                    amount: product.price * elements
                });
                totalPrice += product.price * elements;
                totalElements += elements;

                // aumentamos el número de ventas del producto con transacción
                product.sells = product.sells + elements;

                //añadimos la estadistica de ventas a los productos
                let productStatistic;
                try {
                    productStatistic = await ProductStatistic.find({ productId: product._id });
                } catch (error) {
                    return errorHandler(req, res, 'Something went wrong, could not find a product statistic.', 500, error);
                }
                productStatistic = productStatistic[0];

                //buscamos si hay una estadistica de ventas para el día de hoy para este producto
                let productStatisticAumented = false;
                productStatistic.sells.map((sell) => {
                    if (sell.sellsDate == formatedSellDate) {
                        sell.sellsNum += elements;
                        productStatisticAumented = true;
                    }
                });

                if (!productStatisticAumented) {
                    productStatistic.sells.push({
                        sellsNum: elements,
                        sellsDate: formatedSellDate,
                        sellsDateString: new Date(formatedSellDate).valueOf()
                    });
                }

                productsStatistics.push(productStatistic);
            });
        }

        const totalPriceWithOutVAT = ((totalPrice / (1 + process.env.VAT_PERCENTAGE / 100)).toFixed(2));
        const priceVAT = (totalPrice - +totalPriceWithOutVAT).toFixed(2);
        topOrderInvoice = await getTopOrderInvoice();

        const order = new Order({
            userId: user._id,
            invoiceNumber: topOrderInvoice,
            products: orderProducts,
            status: '64be4b1990b134d92ec1b695', // completed
            shippingMethod: '64be4ca490b134d92ec1b6a1', // Free Shipping
            shippingStatus: '64be4ea490b134d92ec1b6aa', // Completed
            shippingCost: 0,
            shippingAddress: {
                name: user.name + ' ' + user.surname,
                address: user.mailing_addresses[0].address,
                address2: user.mailing_addresses[0].address2,
                city: user.mailing_addresses[0].city,
                zipCode: user.mailing_addresses[0].zipCode,
                province: user.mailing_addresses[0].province,
                country: user.mailing_addresses[0].country
            },
            paymentMethod: '64be509b90b134d92ec1b6b2', // Credit Card
            paymentStatus: '64be515890b134d92ec1b6b8', // Completed
            billingAddress: {
                name: user.name + ' ' + user.surname,
                address: user.mailing_addresses[0].address,
                address2: user.mailing_addresses[0].address2,
                city: user.mailing_addresses[0].city,
                zipCode: user.mailing_addresses[0].zipCode,
                province: user.mailing_addresses[0].province,
                country: user.mailing_addresses[0].country
            },
            totalPrice: totalPrice,
            totalPriceWithOutVAT: totalPriceWithOutVAT,
            priceVAT: priceVAT,
            VAT: process.env.VAT_PERCENTAGE,
            createdAt: sellDate
        });

        try {
            // Añadimos las cosas con una transacción para que si falla algo no se añada nada
            const sess = await mongoose.startSession();
            sess.startTransaction();
            await user.save({ session: sess });

            products.forEach(async product => {
                await product.save({ session: sess });
            });

            productsStatistics.forEach(async productStatistic => {
                await productStatistic.save({ session: sess });
            });

            await order.save({ session: sess });

            await sess.commitTransaction();

            // Y hacer la factura
            // quitar password de la respuesta del usuario

        } catch (error) {
            return errorHandler(req, res, 'Something went wrong, could not save the order.', 500, error);
        }
    }

    res.json({ completed: true });
};

exports.addFakeUsers = addFakeUsers;
exports.addFakeOrders = addFakeOrders;