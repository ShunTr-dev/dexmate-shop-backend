//const fs = require('fs');
const path = require('path');
require('dotenv').config() // Libreria para traer las configuraciones del .env

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
//const autoLogin = require('./middleware/auto-login');
const logs = require('./middleware/general-log');
const errorHandler = require('./utils/error-handler');

const jobHourly = require('./crons/every-hour'); // TODO mirar si es necesario incluirlo
const jobDaily = require('./crons/at_midnight');

const productsRoutes = require('./routes/products-routes');
const categoriesRoutes = require('./routes/categories-routes');
const usersRoutes = require('./routes/users-routes');
const cartsRoutes = require('./routes/carts-routes');
const ordersRoutes = require('./routes/orders-routes');
const fakeRoutes = require('./routes/faker-routes');
const productsStatisticsRoutes = require('./routes/product-statistics-routes');
const generalStatisticsRoutes = require('./routes/general-statistics-routes');
const logsRoutes = require('./routes/logs-routes');
const logsTranslations = require('./routes/translations-routes');

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

    next();
});
app.disable('x-powered-by');

app.use(logs()); //TO DO: Esto va lento, hay que optimizarlo

// Esto si pilla el bearer token de la cabecera de la petición lo mete en req.userData (hace un login)
//app.use(autoLogin);

app.use('/api/products', productsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/carts', cartsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/fake', fakeRoutes);
app.use('/api/statistics', productsStatisticsRoutes);
app.use('/api/general-statistics', generalStatisticsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/translations', logsTranslations);

app.use((req, res, next) => {
    return errorHandler(req, res, 'Could not find this route.', 404, null);
});

mongoose
    .connect(
        `${process.env.MONGODB_CREDENTIALS}`
    )
    .then(() => {
        app.listen(process.env.PORT);
    })
    .catch(err => {
        console.log(err);
    });
