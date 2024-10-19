const mongoose = require('mongoose');

//const HttpError = require('../models/http-error');
const errorHandler = require('../utils/error-handler');
const bcrypt = require('bcryptjs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const crypto = require('crypto');

const productsStatisticsController = require('./products-statistics-controller');
const { getTopOrderInvoice } = require('./orders-controller');

const User = require('../models/user');
const Order = require('../models/order');
const Product = require('../models/product');

/**
 * Get the cart for a specific user by their user ID.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object. -> include userId (pid)
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the user's cart or the user does not exist.
 */
const getUserCart = async (req, res, next) => {
	const userId = req.params.pid;

	let user;
	try {
		user = await User.findById(userId);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find a cart.', 500, error);
	}

	if (!user) {
		return errorHandler(req, res, 'Could not find a cart for the provided user id.', 404, null);
	}

	res.json({ cart: user.cart.toObject({ getters: true }) });
};

/**
 * Update the cart for the authenticated user.
 *
 * This function updates the cart for the authenticated user identified by `req.userData.userId`.
 * The cart data to update is expected to be included in the request body (`req.body`).
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the user or updating the cart.
 * @returns {import('express').Response} A response with a JSON object containing a success message.
 */
const updateCart = async (req, res, next) => {
	console.log(req.userData);
	if (req.userData) {
		userId = req.userData.userId;

		let user;
		try {
			user = await User.findById(userId);

			user.cart = req.body;
			user.save();
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not find a cart.', 500, error);
		}

		if (!user) {
			return errorHandler(req, res, 'Could not find a cart for the provided user id.', 404, null);
		}

		res.json({ message: 'User cart updated' });
	} else {
		return errorHandler(req, res, 'Unauthoriced.', 401, null);
	}
};

/**
 * Perform the checkout process for the authenticated or new user.
 *
 * This function handles the checkout process, which involves updating the user's profile information
 * and creating an order with the selected products for purchase. If the user is already authenticated
 * (identified by `req.userData`), their profile information will be updated. Otherwise, a new user
 * will be created with the provided profile information.
 *
 * After updating the user information and creating the order, a payment session will be created using
 * Stripe API to process the payment for the order.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while processing the checkout or creating the payment session.
 * @returns {import('express').Response} A response with a JSON object containing the Stripe payment session URL.
 */
const checkout = async (req, res, next) => {
	let user;

	if(req.body.cart.totalElements === 0 || req.body.cart.totalPrice === 0 ) {
		return errorHandler(req, res, 'Cart is empty.', 500, null);
	}

	if (req.userData) { // hay un usuario logueado
		try {
			user = await User.findById(req.userData.userId);

			if (user.name === '') {
				user.name = req.body.name;
			}

			if (user.surname === '') {
				user.surname = req.body.surname;
			}

			if (user.name === '') {
				user.surname = req.body.surname;
			}

			if (user.phone === '') {
				user.phone = req.body.telephone;
			}

			if (user.mailing_addresses.length === 0) {
				user.mailing_addresses = [{
					name: "Default",
					address: req.body.address,
					address2: req.body.address,
					city: req.body.city,
					zipCode: req.body.zip,
					province: req.body.province,
					country: req.body.country
				}];
			}

		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not find a user.', 500, error);
		}
	} else {
		try {
			user = await User.find({ email: req.body.email });
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not find a user.', 500, error);
		}

		if (user.length === 0) {
			user = new User({
				email: req.body.email,
				password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
				phone: req.body.telephone,
				name: req.body.name,
				surname: req.body.surname,
				unsubcribeNewsletterToken: crypto.randomBytes(32).toString('hex'),
				active: true,
				paymentData: [],
				mailing_addresses: [{
					name: "Default",
					address: req.body.address,
					address2: req.body.address,
					city: req.body.city,
					zipCode: req.body.zip,
					province: req.body.province,
					country: req.body.country
				}],
				cart: {
					totalPrice: 0,
					totalElements: 0,
					products: []
				}
			})

		} else {
			return errorHandler(req, res, 'User exists already, please login instead.', 401, null);
		}
	}

	try {
		await user.save();
	} catch (error) {
		return errorHandler(req, res, 'Register failed, please try again later.', 500, error);
	}

	const orderProductsId = [];
	req.body.cart.forEach(product => {
		orderProductsId.push(product.id);
	});

	let orderProducts = [];
	let products;
	try {
		products = await Product.find({ '_id': { $in: orderProductsId } }).select(['-images', '-category', '-isHot', '-rating', '-reviews', '-largeDescription', '-comments', '-visible', '-createdAt', '-updatedAt', '-sells', '-stock', '-__v', '-thumbs', '-views', '-whislit']);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
	}

	if (!products) {
		return errorHandler(req, res, 'Could not find product for the provided id.', 404, null);
	}

	let totalPrice = 0;
	let totalElements = 0;

	products.forEach(product => { // TO DO Hacer esto pero modificando el ARRAY de productos con sentidiño
		cartProduct = req.body.cart.find(p => p.id === product._id.toString());
		let tmpProduct = {
			'productId': product._id.toString(),
			'title': product.title,
			'description': product.shortDescription,
			'price': +product.price,
			'quantity': +cartProduct.quantity,
			'amount': +product.price * +cartProduct.quantity,
			'currency': 'eur',
		};

		totalElements += tmpProduct.quantity;
		totalPrice += tmpProduct.amount;

		orderProducts.push(tmpProduct);
	});

	const totalPriceWithOutVAT = ((totalPrice / (1 + process.env.VAT_PERCENTAGE / 100)).toFixed(2));
    const priceVAT = (totalPrice - +totalPriceWithOutVAT).toFixed(2);
	topOrderInvoice = await getTopOrderInvoice();

	const order = new Order({
		userId: user._id,
		invoiceNumber: topOrderInvoice,
		products: orderProducts,
		status: '64be4b0c90b134d92ec1b694', // Processing
		shippingMethod: '64be4ca490b134d92ec1b6a1', // Free Shipping
		shippingStatus: '64be4e9190b134d92ec1b6a8', // Pending
		shippingCost: 0,
		shippingAddress: {
			name: req.body.name + ' ' + req.body.surname,
			address: req.body.address,
			address2: req.body.address,
			city: req.body.city,
			zipCode: req.body.zip,
			province: req.body.province,
			country: req.body.country
		},
		paymentMethod: '64be509b90b134d92ec1b6b2', // Credit Card
		paymentStatus: '64be515290b134d92ec1b6b7', // Processing
		billingAddress: {
			name: req.body.name + ' ' + req.body.surname,
			address: req.body.address,
			address2: req.body.address,
			city: req.body.city,
			zipCode: req.body.zip,
			province: req.body.province,
			country: req.body.country
		},
		totalPrice: totalPrice,
		totalPriceWithOutVAT: totalPriceWithOutVAT,
		priceVAT: priceVAT,
		VAT: process.env.VAT_PERCENTAGE,
		totalElements: totalElements
	});

	try {
		await order.save();
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not save the order.', 500, error);
	}

	let paymentIntent;
	try {
		paymentIntent = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: orderProducts.map(p => {
				return {
					price_data: {
						currency: 'eur',
						unit_amount: p.price * 100,
						product_data: {
							name: p.title[0]['en'],
							description: p.description[0]['en']
						},
					},
					quantity: p.quantity,
				}
			}),
			mode: 'payment',
			success_url: process.env.FRONTEND_DOMAIN + '/cart/checkout-success/' + order._id.toString(),
			cancel_url: process.env.FRONTEND_DOMAIN + '/cart/checkout-error/' + order._id.toString()
		});

	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not connect to stripe.', 500, error);
	}
	res.json({ url: paymentIntent.url });
}

/**
 * Handle the checkout error for a specific order.
 *
 * This function handles the checkout error for a specific order identified by `req.params.oid`.
 * It updates the payment and shipping status of the order to "Cancelled" and sets the overall status
 * to "Cancelled by error payment". This function is typically used when the payment process encounters
 * an error, and the order needs to be marked as cancelled due to the error.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while finding or updating the order.
 * @returns {import('express').Response} A response with a JSON object indicating the completion of the process.
 */
const checkoutError = async (req, res, next) => {
	const orderId = req.params.oid;

	let order;
	try {
		order = await Order.findById(orderId);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find an order.', 500, error);
	}

	if (!order) {
		return errorHandler(req, res, 'Could not find an order for the provided id.', 404, null);
	}

	order.paymentStatus = '64be515d90b134d92ec1b6b9'; // Cancelled
	order.shippingStatus = '64be4eab90b134d92ec1b6ab'; // Cancelled
	order.status = '64c23afd65345b09ea11099e'; // Cancelled by error payment

	try {
		await order.save();
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not save the order.', 500, error);
	}

	res.json({ completed: true });
}

/**
 * Handle the checkout success for a specific order.
 *
 * This function handles the checkout success for a specific order identified by `req.params.oid`.
 * It updates the payment status of the order to "Completed" and sets the overall status to "Pending".
 * This function is typically used when the payment process is successful, and the order is ready to be
 * processed further, e.g., shipping the products.
 *
 * After updating the order status, this function also updates the product statistics by adding the number
 * of items sold for each product in the order and the user profile. This helps track product sales and performance.
 * After that send an email to the user with the order details.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while finding or updating the order or updating product statistics.
 * @returns {import('express').Response} A response with a JSON object indicating the completion of the process.
 */
const checkoutSuccess = async (req, res, next) => {
	const orderId = req.params.oid;
	let orderWasAlreadyCompleted = false;
	let orderWasCancelled = false;

	let order;
	try {
		order = await Order.findById(orderId);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find an order.', 500, error);
	}

	if (!order) {
		return errorHandler(req, res, 'Could not find an order for the provided id.', 404, null);
	}

	// The order was already completed or the payment was already completed
	if (order.status == '64be4b1990b134d92ec1b695' || order.paymentStatus == '64be515890b134d92ec1b6b8' ) { 
		orderWasAlreadyCompleted = true;
	}

	// The order was cancelled
	if (order.status == '64be4b2c90b134d92ec1b696' || order.status == '64be4b3d90b134d92ec1b697' || order.status == '64c23afd65345b09ea11099e') { // the order was cancelled
		orderWasCancelled = true;
	}

	if (!orderWasAlreadyCompleted && !orderWasCancelled) {
		order.paymentStatus = '64be515890b134d92ec1b6b8'; // Completed
		order.status = '64be4af990b134d92ec1b693'; // Pending

		try {
			await order.save();
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not save the order.', 500, error);
		}

		try {
			productsStatisticsController.addMetricSellsToProduct(order); //TO DO pensar como moverlo a cuando se confirma el pago
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not save the statistics.', 500, error);
		}
		
		let existingUser;
		try {
			existingUser = await User.findById(order.userId);
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not find an user.', 500, error);
		}

		// Send email to user
		if (!existingUser.isFake && existingUser.active) {
			const products = order.products.map(p => {
				return {
					title: p.title[0]['en'],
					quantity: p.quantity,
					price: p.amount,
				}
			});

			const sgMail = require('@sendgrid/mail');

			sgMail.setApiKey(process.env.SENDGRID_API_KEY);

			const msg = {
				to: existingUser.email,
				from: 'dexmate_shop@proton.me',
				templateId: process.env.SENDGRID_TEMPLATE_ORDER_CONFIRMATION_ID.trim(),
				dynamicTemplateData: {
					subject: `New order in ${process.env.REACT_APP_SHOP_NAME}!`,
					date: order.createdAt.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
					products: products,
					total: order.totalPrice,
					url_terms_and_conditions: '/legal/terms-of-service',
					url_unsubscribe: '/user/unsubscribe/' + existingUser.unsubcribeNewsletterToken,
				}
			};
			sgMail.send(msg);
		}

	}

	res.json({ completed: true });
}

exports.getUserCart = getUserCart;
exports.updateCart = updateCart;
exports.checkout = checkout;
exports.checkoutError = checkoutError;
exports.checkoutSuccess = checkoutSuccess;