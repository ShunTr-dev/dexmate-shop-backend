const CronJob = require('cron').CronJob;

const generalStatisticsController = require('../controllers/general-statistics-controller');
const productsStatisticsController = require('../controllers/products-statistics-controller');
const categoriesController = require('../controllers/categories-controller');

const job = new CronJob('00 00 00 * * *', function() {
	//const d = new Date();
	//console.log('Midnight:', d);

    generalStatisticsController.addGeneralStatistics();

    productsStatisticsController.actualiceProductStatistics();

    generalStatisticsController.actualiceUserStatistics();

    categoriesController.countProductsByCategory();
    categoriesController.calculateSellsByCategory();

});

job.start();