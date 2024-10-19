const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productStatisticSchema = new Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, required: true , ref: 'Product'},
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

productStatisticSchema.set('timestamps', true);

module.exports = mongoose.model('ProductStatistic', productStatisticSchema);