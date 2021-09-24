const jwt = require('jsonwebtoken');
const config = require('config');

// middleware functions have access to the 
// request/response cycle, and acts as a go-between

module.exports = function(request, response, next) {
  // get token from header
  const token = request.header('x-auth-token');

  // check if no token, respond with 401 (not authorised)
  if (!token) {
    return response.status(401).json({
      msg: 'No token. Authorisation denied.'
    });
  }

  const jwtSecret = config.get('jwtSecret');
  // verify token
  try {
    const decodedToken = jwt.verify(token, jwtSecret);

    request.user = decodedToken.user;

    next();
  } catch (error) {
    response.status(401).json({
      msg: "Token is not valid."
    })
  }
}