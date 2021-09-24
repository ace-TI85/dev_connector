const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator')
const config = require('config');
const jwt = require('jsonwebtoken');
const User = require ('../../models/User');
const bcrypt = require('bcryptjs');

/**
 * @route       GET api/auth
 * @description Test Route
 * @access      Public (no token needed)
 */
router.get('/', auth, async (request, response) => {
  
  try {
    const user = await User.findById(request.user.id).select('-password');
    response.json(user)
  } catch (error) {
    console.error(error.message);
    response.status(500).send('Server error');
  }
});

/**
 * @route       POST api/auth
 * @description Authenticate user and get token
 * @access      Public (no token needed)
 */
 router.post('/', [
  check('email', 'Please include a valid e-mail.')
    .isEmail(),
  check('password', 'Password is required.')
    .exists()
  ],
async (request, response) => {
  const errors = validationResult(request);
  
  if (!errors.isEmpty()) {
    return response.status(400).json({ errors: errors.array() });
  }

  const { email, password } = request.body;

  try {
    // see if user exists; if not, proceed
    let user = await User.findOne({ email: email });
    if (!user) {
      return response.status(400)
        .json({ errors: [ { msg: 'Invalid credentials.' } ] })
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return response.status(400)
        .json({ errors: [ { msg: 'Invalid credentials.' } ] })
    }

    const payload = {
      user : {
        id: user.id
      }
    };

    jwt.sign(
      payload, 
      config.get('jwtSecret'), 
      { expiresIn: 3600 },
      (error, token) => {
        if (error) {
          throw error;
        }
        response.json({ token })
      }
    );

  } catch (error) {
    console.log(error.message);
    response.status(500)
      .send('Server error')
  }
});

module.exports = router;