const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const errorHandler = require('../utils/error-handler');

module.exports = (req, res, next) => {


	if (req.method === 'OPTIONS') {
		return next(); // Necesario por que algunos navegadores antes de enviar la solicitud envían otra.
	}

    if(req.headers?.authorization){
        try { // Debemos meter Error Handler por si no existe en los headers el campo authorization
            const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
            if (!token) {
                throw new Error('Authentication failed!', 403);
            } else {
    
            }
            const decodedToken = jwt.verify(token, `${process.env.SECRET_SEED}`); // seed
            req.userData = { userId: decodedToken.userId }; // Añadimos datos a la respuesta pero los pueden usar el resto de código
            next();
        } catch (error) {
            return errorHandler(req, res, 'Authentication failed!.', 403, error);
        }
    } else {
        // console.log('No hay token en los headers');
        return next();
    }

};