const mongoose = require('mongoose');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');

const errorHandler = require('../utils/error-handler');

const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const Category = require('../models/product-category');
const ProductStatistic = require('../models/product-statistic');
const GeneralStatistic = require('../models/general-statistic');
const UserProductView = require('../models/user-product-view');
const ProductView = require('../models/product-views');

// TO DO: optimizar
const addGeneralStatistics = async (req, res, next) => {
	let totalSells = 0;
	let totalViews = await ProductView.count();

	const allOrders = await Order.find({}).select(['-__v', '-_id']);
	allOrders.map(order => {
		totalSells += order.totalPrice;
	});

	let generalStatistics = new GeneralStatistic({
		_id: process.env.GENERAL_STATISTICS_ID,
		totalSells: totalSells,
		totalViews: totalViews,
		totalOrders: await Order.find().count(),
		totalUsers: await User.find().count(),
		totalProducts: await Product.find().count(),
		totalActiveProducts: await Product.find({ visible: true }).count(),
		totalCategories: await Category.find({}).count(),
	});

	// añadimos las estadisticas diarias
	let startDate = dayjs.utc('2023-01-01');
	const currentDate = dayjs.utc();
	let currentDay = startDate;

	while (currentDay.isBefore(currentDate)) {
		const ISODate = currentDay.format('YYYY-MM-DD');
		const milisecondsDate = new Date(ISODate).valueOf();
		const endCurrentDay = currentDay.hour(23).minute(59).second(59).millisecond(999);

		let orders = 0;
		let sells = 0;
		let views = 0;

		try {
			orders = await Order.find({createdAt: { $gte: currentDay, $lte: endCurrentDay }, status: '64be4b1990b134d92ec1b695' }).count();
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
		}

		try {
			const ordersThisDay = await Order.find({ createdAt: { $gte: currentDay, $lte: endCurrentDay }, status: '64be4b1990b134d92ec1b695' });
			ordersThisDay.map(order => {
				sells += order.totalPrice;
			});
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
		}

		try {
			views = await ProductView.find({ createdAt: { $gte: currentDay, $lte: endCurrentDay } }).count();
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
		}

		generalStatistics.dailyStatistics.push({
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

		let orders = 0;
		let sells = 0;
		let views = 0;

		try {
			orders = await Order.find({ createdAt: { $gte: currentMonth.startOf('month'), $lte: endCurrentMonth }, status: '64be4b1990b134d92ec1b695' }).count();
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
		}

		try {
			const ordersThisMonth = await Order.find({ createdAt: { $gte: currentMonth.startOf('month'), $lte: endCurrentMonth }, status: '64be4b1990b134d92ec1b695' });
			ordersThisMonth.map(order => {
				
				sells += order.totalPrice;
			});
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
		}

		try {
			views = await ProductView.find({ createdAt: { $gte: currentMonth.startOf('month'), $lte: endCurrentMonth } }).count();
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not find orders.', 500, error);
		}

		generalStatistics.monthlyStatistics.push({
			orders: orders,
			sells: sells,
			views: views,
			monthlyStatisticsDate: ISODate,
			monthlyStatisticsDateString: milisecondsDate
		});

		currentMonth = currentMonth.add(1, 'month');
	}

	try {
		generalStatistics.totalSells = totalSells;
		await GeneralStatistic.deleteOne({ _id: process.env.GENERAL_STATISTICS_ID })
		await generalStatistics.save();
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not save a general statistic.', 500, error);
	}

	return res.json({ message: true });
};




const getGeneralStatistics = async (req, res, next) => {

	let generalStatistics;
	try {
		generalStatistics = await GeneralStatistic.findById(process.env.GENERAL_STATISTICS_ID).select(['-__v', '-_id']);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find general statistics.', 500, error);
	}

	let orderStatistiscs = {
		pendingOrders: 0,
		cancelledOrders: 0,
		completedOrders: 0,
		pendingPaymentOrders: 0
	}

	try {
		orderStatistiscs.pendingOrders = await Order.find({ status: '64be4af990b134d92ec1b693' }).count();
		orderStatistiscs.cancelledOrders = await Order.find({ status: ['64be4b2c90b134d92ec1b696', '64be4b3d90b134d92ec1b697', '64c23afd65345b09ea11099e'] }).count();
		orderStatistiscs.completedOrders = await Order.find({ status: '64be4b1990b134d92ec1b695' }).count();
		orderStatistiscs.pendingPaymentOrders = await Order.find({ paymentStatus: '64be514790b134d92ec1b6b6' }).count();
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find order statistics.', 500, error);
	}

	let categories;
	try {
		categories = await Category.find().select(['-__v']);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find categories.', 500, error);
	}

	let users;
	try {
		users = await User.find().sort({ totalSpentInOrders: -1}).limit(5).select(['-__v', '-password', '-orders', '-unsubcribeNewsletterToken']);
	} catch (error) {
		return errorHandler(req, res, 'Something went wrong, could not find users.', 500, error);
	}


	res.json({ generalStatistics: generalStatistics, orderStatistiscs: orderStatistiscs, categories: categories, users: users });
}

const actualiceUserStatistics = async (req, res, next) => {
	const users = await User.find();

	users.map(async user => {
		//const userProductViews = await UserProductView.find({ user: user._id });
		const userOrders = await Order.find({ userId: user._id, status: '64be4b1990b134d92ec1b695' });

		user.totalItemsInOrders = 0;
		user.totalSpentInOrders = 0;

		if(!user.unsubcribeNewsletterToken) {
			user.unsubcribeNewsletterToken = '8oa7wd8awd98d7dwa8';
		}

		userOrders.map(order => {
			user.totalItemsInOrders += order.totalElements;
			user.totalSpentInOrders += order.totalPrice;
		});

		user.orders = await Order.find({ userId: user._id,  status: '64be4b1990b134d92ec1b695'}).count();

		try {
			//await User.updateOne({ _id: user._id }, { userStatistics: userStatistics });
			await user.save();
		} catch (error) {
			return errorHandler(req, res, 'Something went wrong, could not update user statistics.', 500, error);
		}
	});

	res.json({ message: true });
}



exports.addGeneralStatistics = addGeneralStatistics;
exports.getGeneralStatistics = getGeneralStatistics;
exports.actualiceUserStatistics = actualiceUserStatistics;