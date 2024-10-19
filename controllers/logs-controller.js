const mongoose = require('mongoose');

const errorHandler = require('../utils/error-handler');
const Errorlog = require('../models/error-log');
const log = require('../models/log');

/**
 * Get the last 10 error logs from the database and return them in JSON format.
 *
 * @async
 * @function getlastErrorLogs
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @throws {HttpError} If there is an error finding the error logs in the database.
 * @returns {Promise<void>} A Promise that resolves with the last 10 error logs in JSON format.
 */
const getlastErrorLogs = async (req, res, next) => {
    let errorLogs;

    try {
        errorLogs = await Errorlog.find().sort({createdAt: -1}).limit(10);
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a error logs.', 500, error);
    }

    if (!errorLogs) {
        return errorHandler(req, res, 'Could not find error logs.', 404, null);
    }

    res.json({
        errorLogs: errorLogs.map(errorLog =>
            errorLog.toObject({ getters: true })
        )
    });
}

/**
 * Get the last 10 logs from the database and return them in JSON format.
 *
 * @async
 * @function getlastErrorLogs
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @throws {HttpError} If there is an error finding the logs in the database.
 * @returns {Promise<void>} A Promise that resolves with the last 10 logs in JSON format.
 */
const getlastLogs = async (req, res, next) => {
    let logs;

    try {
        logs = await log.find().sort({createdAt: -1}).limit(10);
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a logs.', 500, error);
    }

    if (!logs) {
        return errorHandler(req, res, 'Could not find logs.', 404, null);
    }

    res.json({
        logs: logs.map(log =>
            log.toObject({ getters: true })
        )
    });
}

exports.getlastErrorLogs = getlastErrorLogs;
exports.getlastLogs = getlastLogs;