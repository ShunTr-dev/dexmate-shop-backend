const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const generalStatisticSchema = new Schema({
    totalSells: { type: Number, required: false, default: 0 },
    totalViews: { type: Number, required: false, default: 0 },
    totalOrders: { type: Number, required: false, default: 0 },
    totalUsers: { type: Number, required: false, default: 0 },
    totalProducts: { type: Number, required: false, default: 0 },
    totalActiveProducts: { type: Number, required: false, default: 0 },
    totalCategories: { type: Number, required: false, default: 0 },
    
    // pending orders
    // pendingOrders: { type: Number, required: false, default: 0 },
    // deliveredOrders: { type: Number, required: false, default: 0 },
    // cancelledOrders: { type: Number, required: false, default: 0 },
    // completedOrders: { type: Number, required: false, default: 0 },
    // pendingPaymentOrders: { type: Number, required: false, default: 0 },

    dailyStatistics: [{
        orders: { type: Number, required: false },
        views: { type: Number, required: false },
        sells: { type: Number, required: false },
        dailyStatisticsDate: { type: String, required: false },
        dailyStatisticsDateString: { type: String, required: false }
    }],
    monthlyStatistics: [{
        orders: { type: Number, required: false },
        views: { type: Number, required: false },
        sells: { type: Number, required: false },
        monthlyStatisticsDate: { type: String, required: false },
        monthlyStatisticsDateString: { type: String, required: false }
    }]
});

module.exports = mongoose.model('GeneralStatistic', generalStatisticSchema);