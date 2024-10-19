const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const errorHandler = require('../utils/error-handler');
const User = require('../models/user');

module.exports = async (req, res, next) => {

    if(req.headers?.authorization){
        try { // Debemos meter Error Handler por si no existe en los headers el campo authorization
            const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
            if (!token) {
                throw new Error('Authentication failed!', 403);
            } else {
    
            }
            const decodedToken = jwt.verify(token, `${process.env.SECRET_SEED}`); // seed
            //req.userData = { userId: decodedToken.userId }; // Añadimos datos a la respuesta pero los pueden usar el resto de código

            let user;
            try {
                user = await User.findById(decodedToken.userId);
                
                if(!user) {
                    return errorHandler(req, res, 'Something went wrong, could not find a user.', 404, error);
                } else {

                }
            } catch (error) {
                return errorHandler(req, res, 'Something went wrong, could not find a user.', 404, error);
            }

            if(user.groupId == '64be2e7b90b134d92ec1b68c') {
                req.userData.isAdmin = true;
            }  else {
                req.userData.isAdmin = false;

				return next(new HttpError('Authentication failed!', 401));
            }
			
            next();
        } catch (err) {
            const error = new HttpError('Authentication failed!', 403);
            return next(error);
        }
    } else {
        return errorHandler(req, res, 'Unauthoriced.', 401, null);
    }

};