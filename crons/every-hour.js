const CronJob = require('cron').CronJob;
const Order = require('../models/order');
const Product = require('../models/product');
const dayjs = require('dayjs');

//console.log('Before job instantiation');
const job = new CronJob('0 * * * * *', async function () {
    const d = new Date();
    //console.log('Every Minute:', d);

    // --- Las ordenes que no se han pagado en 10 minutos se ponen en estado de canceladas --------------------------------
    const tenMinutesAgoDate = dayjs.utc().subtract(10, 'minute');
    // console.log('10 minutes ago', tenMinutesAgoDate);
    // console.log('Payments cron job', await Order.find({ paymentStatus: '64be514790b134d92ec1b6b6' , createdAt: { $lte:  tenMinutesAgoDate } }).count()); // Pendiende de confirmación

    const ordersPendingConfirmation = await Order.find({ paymentStatus: '64be514790b134d92ec1b6b6', createdAt: { $lte: tenMinutesAgoDate } });
    ordersPendingConfirmation.map(async order => {
        order.status = '64be4b3d90b134d92ec1b697'; // Cancelada por la tienda
        order.paymentStatus = '64be515d90b134d92ec1b6b9'; // Cancelado
        await order.save();
    });

    // console.log('Payments cron job', await Order.find({ paymentStatus: '64be515290b134d92ec1b6b7' , createdAt: { $lte:  tenMinutesAgoDate } }).count()); // Procesando

    const ordersProcessing = await Order.find({ paymentStatus: '64be515290b134d92ec1b6b7', createdAt: { $lte: tenMinutesAgoDate } });
    ordersProcessing.map(async order => {
        order.status = '64be4b3d90b134d92ec1b697'; // Cancelada por la tienda
        order.paymentStatus = '64be515d90b134d92ec1b6b9'; // Cancelado
        await order.save();
    });

    // --- Establecemos los artículos que son top ventas -----------------------------------------------------------------

    const allProducts = await Product.find();
    allProducts.map(async product => {
        product.isHot = false;
        await product.save();
    });

    const topProducts = await Product.find({}).sort({ sells: -1 }).limit(5);
    topProducts.map(async product => {
        product.isHot = true;
        await product.save();
    });

});

job.start();