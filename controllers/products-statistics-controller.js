const mongoose = require('mongoose');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

const errorHandler = require('../utils/error-handler');

const Product = require('../models/product');
const User = require('../models/user');
const ProductStatistic = require('../models/product-statistic');
const ProductView = require('../models/product-views');
const Order = require('../models/order');

/**
 * Get product statistics sells by product ID.
 *
 * This function fetches the product statistics for a specific product based on its ID. The product statistics include
 * information about the product's sells. The function also ensures that product statistics are added to the database
 * using the `` function before fetching the sells statistics.
 *
 * @async
 * @function
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {HttpError} If there's an error while fetching the product statistics or if no product statistics are found
 * for the provided product ID.
 * @returns {import('express').Response} A response with a JSON object containing an array of product sells statistics.
 */
const getProductStatisticsById = async (req, res, next) => {

	const productId = req.params.pid;

	let productStatistic;
	try {
		productStatistic = await ProductStatistic.find({ productId: productId }).select(['-views -createdAt -updatedAt -_id -__v -dailyStatistics']);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find a product statistic.', 500, error);
	}

	if (!productStatistic) {
		return errorHandler(req, res, 'Could not find product statistics for the provided id.', 500, null);
	} else {
		productStatistic = productStatistic[0];
	}

	res.json({ productStatistic: productStatistic.toObject({ getters: true }) });
};


/**
 * Add product metrics (sells) to the database.
 *
 * This function adds product metrics, specifically sales statistics, to the database after a successful order is placed.
 * It increases the number of orders for the user associated with the order. For each product in the order, it updates
 * the product's sales statistics in the corresponding `ProductStatistic` document. The function also uses transactions
 * to ensure that if any error occurs during saving, no data is added to the database.
 *
 * @async
 * @function
 * @param {import('mongoose').Document} order - The order document representing the successful order.
 * @throws {HttpError} If there's an error while finding the user, product statistics, or during the transaction to
 * save the statistics.
 */
addMetricSellsToProduct = async (order) => {
	let productsStatistics = [];
	// Aumentamos el numero de orders del usuario
	let user;
	try {
		user = await User.findById(order.userId);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find product statistic.', 500, error);
	}

	user.totalItemsInOrders += order.totalElements;
	user.totalSpentInOrders += order.totalPrice;
	user.orders += 1;
	user.save();

	order.products.forEach(async product => {
		//añadimos la estadistica de ventas a los productos
		let productStatistic;
		try {
			productStatistic = await ProductStatistic.find({ productId: product.productId });
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not find product statistic.', 500, error);
		}
		productStatistic = productStatistic[0];

		//buscamos si hay una estadistica de ventas para el día de hoy para este producto
		const currentDate = dayjs.utc();
		const formatedViewDate = currentDate.toISOString().slice(0, 10);
		const formatedDateMonth = currentDate.startOf('month').format('YYYY-MM-DD');

		productStatistic.dailyStatistics.map((sell) => {
			if (view.dailyStatisticsDate == formatedViewDate) {
				sell.sells += product.amount;
				sell.orders += 1;
			}
		});

		productStatistic.monthlyStatistics.map((sell) => {
			if (view.monthlyStatisticsDate == formatedDateMonth) {
				sell.sells += product.amount;
				sell.orders += 1;

			}
		});

		productStatistic.save();

		try {
			const product = await Product.findById(product.productId);
			product.sells += product.amount;
			product.save();
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not update product statistic.', 500, error);
		}
	});

	res.json({ message: new Date() });
}

/**
 * Add product metrics (views) to the database.
 *
 * This function adds product metrics, specifically view statistics, to the database whenever a product is viewed.
 * It increases the total number of views for the product and updates the view statistics for today in the corresponding
 * `ProductStatistic` document. If a user is logged in, the function also saves the view history for the user and product.
 *
 * @async
 * @function
 * @param {string} productId - The ID of the product being viewed.
 * @param {string|null} userId - The ID of the logged-in user viewing the product (or null if no user is logged in).
 * @throws {HttpError} If there's an error while finding the product or product statistics.
 */
const addMetricViewsToProduct = async (productId, userId) => {
	let productsStatistics = [];
	// Aumentamos el numero de orders del producto
	let product;
	try {
		product = await Product.findById(productId);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find a product.', 500, error);
	}
	product.views += 1;
	product.save();

	//añadimos la estadistica de visitas a los productos
	let productStatistic;
	try {
		productStatistic = await ProductStatistic.find({ productId: productId });
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find a product statistic.', 500, error);
	}
	productStatistic = productStatistic[0];

	const currentDate = dayjs.utc();
	const formatedViewDate = currentDate.toISOString().slice(0, 10);
	const formatedDateMonth = currentDate.startOf('month').format('YYYY-MM-DD');

	productStatistic.dailyStatistics.map((view) => {
		if (view.dailyStatisticsDate == formatedViewDate) {
			view.views += 1;
		}
	});

	productStatistic.monthlyStatistics.map((view) => {
		if (view.monthlyStatisticsDate == formatedDateMonth) {
			view.views += 1;
		}
	});

	productStatistic.save();

	const productView = new ProductView({
		userId: userId,
		productId: productId
	});

	productView.save();
}

const actualiceProductStatistics = async (req, res, next) => {
	const products = await Product.find();

	products.forEach(async product => {
		product.views = await ProductView.find({ productId: product._id }).count();
		product.sells = 0;

		let productStatistic = new ProductStatistic({
			productId: product._id,
			dailyStatistics: [],
			monthlyStatistics: []
		});

		// Añadimos las estadisticas diarias
		let startDate = dayjs.utc('2023-01-01');
		const currentDate = dayjs.utc();
		let currentDay = startDate;

		while (currentDay.isBefore(currentDate)) {
			const ISODate = currentDay.format('YYYY-MM-DD');
			const milisecondsDate = new Date(ISODate).valueOf();
			const endCurrentDay = currentDay.hour(23).minute(59).second(59).millisecond(999);

			// console.log('---------------------------------------');
			// console.log('ISODate: ', ISODate);
			// console.log('---------------------------------------');
			// console.log('startDate: ', currentDay.toDate());
			// console.log('endDate: ', endCurrentDay.toDate());
			let orders = 0;
			let sells = 0;
			let views = 0;

			try {
				orders = await Order.find({ products: { $elemMatch: { productId: product._id } }, createdAt: { $gte: currentDay, $lte: endCurrentDay }, status: '64be4b1990b134d92ec1b695' }).count();
			} catch (error) {
				return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
			}

			try {
				const ordersThisDay = await Order.find({ products: { $elemMatch: { productId: product._id } }, createdAt: { $gte: currentDay, $lte: endCurrentDay }, status: '64be4b1990b134d92ec1b695' });
				ordersThisDay.map(order => {
					order.products.map(productOrder => {
						if (productOrder.productId == product._id.toString()) {
							sells += productOrder.amount;
						}
					});
				});
			} catch (error) {
				return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
			}

			try {
				views = await ProductView.find({ productId: product._id, createdAt: { $gte: currentDay, $lte: endCurrentDay } }).count();
			} catch (error) {
				return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
			}

			productStatistic.dailyStatistics.push({
				orders: orders,
				sells: sells,
				views: views,
				dailyStatisticsDate: ISODate,
				dailyStatisticsDateString: milisecondsDate
			});

			currentDay = currentDay.add(1, 'day');
		}

		// Añadimos las estadisticas mensuales
		startDate = dayjs.utc('2023-01-01');
		let currentMonth = startDate;

		while (currentMonth.isBefore(currentDate)) {
			const ISODate = currentMonth.format('YYYY-MM-DD');
			const milisecondsDate = new Date(ISODate).valueOf();
			const endCurrentMonth = currentMonth.endOf('month');

			// console.log('---------------------------------------');
			// console.log('month: ', currentMonth.format('MMMM YYYY'));
			// console.log('---------------------------------------');
			// console.log('ISODate: ', ISODate);
			// console.log('---------------------------------------');
			// console.log('startDate: ', currentMonth.startOf('month').toDate());
			// console.log('endDate: ', endCurrentMonth.toDate());

			let orders = 0;
			let sells = 0;
			let views = 0;

			try {
				orders = await Order.find({ products: { $elemMatch: { productId: product._id } }, createdAt: { $gte: currentMonth.startOf('month'), $lte: endCurrentMonth }, status: '64be4b1990b134d92ec1b695' }).count();
			} catch (error) {
				return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
			}

			try {
				const ordersThisMonth = await Order.find({ products: { $elemMatch: { productId: product._id } }, createdAt: { $gte: currentMonth.startOf('month'), $lte: endCurrentMonth }, status: '64be4b1990b134d92ec1b695' });
				ordersThisMonth.map(order => {
					order.products.map(productOrder => {
						if (productOrder.productId == product._id.toString()) {
							sells += productOrder.amount;
							product.sells += productOrder.amount;
						}
					});
				});
			} catch (error) {
				return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
			}

			try {
				views = await ProductView.find({ productId: product._id, createdAt: { $gte: currentMonth.startOf('month'), $lte: endCurrentMonth } }).count();
			} catch (error) {
				return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
			}

			productStatistic.monthlyStatistics.push({
				orders: orders,
				sells: sells,
				views: views,
				monthlyStatisticsDate: ISODate,
				monthlyStatisticsDateString: milisecondsDate
			});

			currentMonth = currentMonth.add(1, 'month');
		}

		try {
			await ProductStatistic.deleteOne({ productId: product._id })
			await productStatistic.save();///--------------------------------------------------------------------
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not save a product statistic.', 500, error);
		}

		await product.save();
	});

	// res.json({ message: new Date() });
	//return res.json({ message: true });
}

exports.getProductStatisticsById = getProductStatisticsById;
exports.addMetricSellsToProduct = addMetricSellsToProduct;
exports.addMetricViewsToProduct = addMetricViewsToProduct;
exports.actualiceProductStatistics = actualiceProductStatistics;