const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const errorHandler = require('../utils/error-handler');

const Order = require('../models/order');
const User = require('../models/user');
const order = require('../models/order');

/**
 * Get a list of all orders.
 *
 * This function fetches a list of all orders available in the database.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the orders or if no orders are found.
 * @returns {import('express').Response} A response with a JSON object containing an array of orders.
 */
const getAllOrders = async (req, res, next) => {
	let orders;

	try {
		orders = await Order.find()
			.populate([
				//{ path: 'userId', select: '-password -groupId -dateOfBirth -phone -legal -subscribe_newsletter -token -orders -active -isFake -vericationCode -resetPasswordToken -resetPasswordExpires -cart -mailing_addresses -paymentData -avatar -__v -createdAt -updatedAt' },
				//{path: 'status'}
			])
			// .populate('shippingStatus')
			// .populate('paymentStatus')
			// .populate('paymentMethod')
			//.populate('status')
			.limit(10);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
	}

	if (!orders) {
		return errorHandler(req, res, 'Could not find orders.', 404, null);
	}

	res.json({
		orders: orders.map(order =>
			order.toObject({ getters: true })
		)
	});
}

/**
 * Get orders for the authenticated user.
 *
 * This function fetches the orders for the authenticated user identified by `req.userData.userId`.
 * The orders are sorted by creation date in descending order (newest to oldest). The function returns
 * an array of simplified order information, including createdAt, status, paymentStatus, totalElements,
 * and totalPrice. This simplified information can be used for displaying the user's orders in a list.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the user orders or if no orders are found.
 * @returns {import('express').Response} A response with a JSON object containing an array of user orders.
 */
const getUserOrders = async (req, res, next) => {

	if (req.userData) {
		userId = req.userData.userId;

		let orders;
		try {
			orders = await Order.find({ userId: req.userData.userId }).sort({ createdAt: 'desc' });
			//.populate('status')
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
		}

		if (!orders) {
			return errorHandler(req, res, 'Could not find orders.', 404, null);
		}
/*
		ordedOrders = orders.map(order => {
			return [
				order.createdAt, order.status, order.paymentStatus, order.totalElements, order.totalPrice
			];
		})
*/
		res.json({
			orders: orders.map(order =>
				order.toObject({ getters: true })
			)
		});
	} else {
		return res.status(401).json({ message: 'Could not find user.' });
	}
}

/**
 * Set the shipping status of an order to 'Completed' and send a shipping confirmation email to the user.
 *
 * @async
 * @function setOrderShippingStatusToCompleted
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @throws {HttpError} If there is an error finding or saving the order or user.
 * @returns {Promise<void>} A Promise that resolves when the shipping status is updated and the email is sent.
 */
const setOrderShippingStatusToCompleted = async (req, res, next) => {
	// TO DO hacer que esto solo lo pueda hacer el admin
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
	if (order.status == '64be4b1990b134d92ec1b695' || order.shippingStatus == '64be4ea490b134d92ec1b6aa') {
		orderWasAlreadyCompleted = true;
	}

	// The order was cancelled
	if (order.status == '64be4b2c90b134d92ec1b696' || order.status == '64be4b3d90b134d92ec1b697' || order.status == '64c23afd65345b09ea11099e') { // the order was cancelled
		orderWasCancelled = true;
	}

	if (!orderWasAlreadyCompleted && !orderWasCancelled) {
		order.shippingStatus = '64be4ea490b134d92ec1b6aa'; // Completed

		try {
			await order.save();
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not save the order.', 500, error);
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

			//TO DO add legal options
			const msg = {
				to: existingUser.email,
				from: 'dexmate_shop@proton.me',
				templateId: process.env.SENDGRID_TEMPLATE_SHIPPING_CONFIRMATION_ID.trim(),
				dynamicTemplateData: {
					subject: `Last order shipped in ${process.env.REACT_APP_SHOP_NAME}!`,
				}
			};
			sgMail.send(msg);
		}

	}

	res.json({ completed: true });
}

/**
 * Get the invoice number for the next order by finding the highest invoice number from the existing orders and incrementing it by 1.
 * If no order is found, the function returns 1 as the starting invoice number.
 *
 * @async
 * @function getTopOrderInvoice
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @throws {HttpError} If there is an error finding the order.
 * @returns {Promise<number>} A Promise that resolves with the next invoice number for the new order.
 */
const getTopOrderInvoice = async (req, res, next) => {
	let order;
	try {
		order = await Order.findOne().sort({ invoiceNumber: 'desc' });
	} catch (error) {
		throw new HttpError('Something went wrong, could not find an order.', 500);
	}

	if (!order) {
		return 1;
	} else {
		return order.invoiceNumber + 1;
	}
}

/**
 * Get the invoice details for a specific order if the user is authenticated.
 *
 * @async
 * @function getOrderInvoice
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @throws {HttpError} If there is an error finding the invoice or the user is not authenticated.
 * @returns {Promise<void>} A Promise that resolves with the invoice details in JSON format if the user is authenticated.
 */
const getOrderInvoice = async (req, res, next) => {
	if (req.userData) {
		const orderId = req.params.oid;

		let order;
		try {
			order = await Order.findOne({ _id: orderId, userId: req.userData.userId }).select(['-__v', '-id', '-_id',  '-paymentMethod', '-paymentStatus', '-shippingCost', '-shippingMethod', '-shippingStatus', '-status', '-userId', '-updatedAt', '-shippingAddress']);
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not find the invoice.', 500, error);
		}

		if (!order) {
			return errorHandler(req, res, 'Something went wrong, could not find the invoice.', 500, null);
		} else {
			res.json({ invoice: order.toObject({ getters: true }) });
		}
	} else {
		return res.status(401).json({ message: 'Could not find user.' });
	}
}
















const getAllOrdersAdmin = async (req, res, next) => {
	let orders;

	try {
		orders = await Order.find()
			.sort({createdAt: -1})
			.limit(2000);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
	}

	if (!orders) {
		return errorHandler(req, res, 'Could not find orders.', 404, null);
	}

	res.json({
		orders: orders.map(order =>
			order.toObject({ getters: true })
		)
	});
}

const getAllPendingOrdersAdmin = async (req, res, next) => {
	let orders;

	try {
		orders = await Order.find({ status: '64be4af990b134d92ec1b693' })
			.sort({createdAt: -1})
			.limit(2000);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
	}

	if (!orders) {
		return errorHandler(req, res, 'Could not find orders.', 404, null);
	}

	res.json({
		orders: orders.map(order =>
			order.toObject({ getters: true })
		)
	});
}

const getAllCancelledOrdersAdmin = async (req, res, next) => {
	let orders;

	try {
		orders = await Order.find({ status: ['64be4b2c90b134d92ec1b696', '64be4b3d90b134d92ec1b697', '64c23afd65345b09ea11099e'] })
			.sort({createdAt: -1})
			.limit(2000);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
	}

	if (!orders) {
		return errorHandler(req, res, 'Could not find orders.', 404, null);
	}

	res.json({
		orders: orders.map(order =>
			order.toObject({ getters: true })
		)
	});
}

const getAllCompletedOrdersAdmin = async (req, res, next) => {
	let orders;

	try {
		orders = await Order.find({ status: '64be4b1990b134d92ec1b695' })
			.sort({createdAt: -1})
			.limit(2000);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
	}

	if (!orders) {
		return errorHandler(req, res, 'Could not find orders.', 404, null);
	}

	res.json({
		orders: orders.map(order =>
			order.toObject({ getters: true })
		)
	});
}

const getAllPendingPaymentOrdersAdmin = async (req, res, next) => {
	let orders;

	try {
		orders = await Order.find({ paymentStatus: '64be514790b134d92ec1b6b6' })
			.sort({createdAt: -1})
			.limit(2000);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
	}

	if (!orders) {
		return errorHandler(req, res, 'Could not find orders.', 404, null);
	}

	res.json({
		orders: orders.map(order =>
			order.toObject({ getters: true })
		)
	});
}

exports.getAllOrders = getAllOrders;
exports.getUserOrders = getUserOrders;
exports.setOrderShippingStatusToCompleted = setOrderShippingStatusToCompleted;
exports.getTopOrderInvoice = getTopOrderInvoice;
exports.getOrderInvoice = getOrderInvoice;

exports.getAllOrdersAdmin = getAllOrdersAdmin;
exports.getAllPendingOrdersAdmin = getAllPendingOrdersAdmin;
exports.getAllCancelledOrdersAdmin = getAllCancelledOrdersAdmin;
exports.getAllCompletedOrdersAdmin = getAllCompletedOrdersAdmin;
exports.getAllPendingPaymentOrdersAdmin = getAllPendingPaymentOrdersAdmin;