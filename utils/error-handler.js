const errorLogs = require('../models/error-log');

module.exports = function (req, res, message, errorCode, error) {

    console.log('---------------------------------------------------------------------------------------------------');
    console.log('error-handler.js: message: ', message);
    console.log('---------------------------------------------------------------------------------------------------');
    console.log('error-handler.js: error: ', error);
    console.log('---------------------------------------------------------------------------------------------------');
    console.log('error-handler.js: code: ', errorCode);
    console.log('---------------------------------------------------------------------------------------------------');
    
    if(error === null){
        error = 'null';
    }

    new errorLogs({
        message: message,
        errorCode: errorCode,
        error: error,
        method: req.method,
        url: req.url,
        body: req.body,
        params: req.params,
        query: req.query,
        headers: req.headers,
    }).save();
    

    return res.status(errorCode || 500).json({ code: errorCode || 500, message: message || 'An unknown error occurred!' });
    //next()
}
