//const fs = require('fs');
const path = require('path');

if(process.env.NODE_ENV === 'dev'){
    require('dotenv').config() // Libreria para traer las configuraciones del .env
}

import express, { Router } from "express";
//const express = require('express');
import serverless from "serverless-http";
const router = express.Router();
const app = express();

import bodyParser from "body-parser";
//const bodyParser = require('body-parser');
import mongoose from "mongoose";
//const mongoose = require('mongoose');

const autoLogin = require('../middleware/auto-login');
const logs = require('../middleware/general-log');
const errorHandler = require('../utils/error-handler');

const jobHourly = require('../crons/every-hour'); // TODO mirar si es necesario incluirlo
const jobDaily = require('../crons/at_midnight');

const productsRoutes = require('../routes/products-routes');
const categoriesRoutes = require('../routes/categories-routes');
const usersRoutes = require('../routes/users-routes');
const cartsRoutes = require('../routes/carts-routes');
const ordersRoutes = require('../routes/orders-routes');
const fakeRoutes = require('../routes/faker-routes');
const productsStatisticsRoutes = require('../routes/product-statistics-routes');
const generalStatisticsRoutes = require('../routes/general-statistics-routes');
const logsRoutes = require('../routes/logs-routes');
const logsTranslations = require('../routes/translations-routes');

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

//console.log('headers set');
app.disable('x-powered-by');

app.use(logs()); //TO DO: Esto va lento, hay que optimizarlo

// Esto si pilla el bearer token de la cabecera de la petición lo mete en req.userData (hace un login)
app.use(autoLogin);

app.use('/.netlify/functions/app/api/products', productsRoutes);
app.use('/.netlify/functions/app/api/users', usersRoutes);
app.use('/.netlify/functions/app/api/categories', categoriesRoutes);
app.use('/.netlify/functions/app/api/carts', cartsRoutes);
app.use('/.netlify/functions/app/api/orders', ordersRoutes);
app.use('/.netlify/functions/app/api/fake', fakeRoutes);
app.use('/.netlify/functions/app/api/statistics', productsStatisticsRoutes);
app.use('/.netlify/functions/app/api/general-statistics', generalStatisticsRoutes);
app.use('/.netlify/functions/app/api/logs', logsRoutes);
app.use('/.netlify/functions/app/api/translations', logsTranslations);

app.use((req, res, next) => {
    return errorHandler(req, res, 'Could not find this route.', 404, null);
});

mongoose
    .connect(
        `${process.env.MONGODB_CREDENTIALS}`
    )
    .then(() => {
    })
    .catch(err => {
        console.log(err);
    });
    
    if(process.env.NODE_ENV === 'dev'){
        app.listen(process.env.PORT || 5000);
    } else {
        //router.get("/hello", (req, res) => res.send("Hello World!"));

        // app.use('/.netlify/functions/app', router);
        // module.exports.handler = serverless(app);
    }
    export const handler = serverless(app);