'use strict';
const logs = require('../models/log');

module.exports = function (options) {
    return function (req, res, next) {
        
        new logs({
            method: req.method,
            url: req.url,
            body: req.body,
            params: req.params,
            query: req.query,
            headers: req.headers,
            // file: data.file,
            // line: data.line,
            // info: data.info,
            // type: data.type
        }).save();

        next()
    }
}