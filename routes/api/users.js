const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator')
const User = require('../../models/User');
const config = require('config');

/**
 * @route       POST api/users
 * @description Register user
 * @access      Public (no token needed)
 */
router.post('/', [
  check('name', 'Name is required')
    .not()
    .isEmpty(),
  check('email', 'Please include a valid e-mail')
    .isEmail(),
  check('password', 'Please enter a password with 6 or more characters')
    .isLength({ min: 6 })
  ],
async (request, response) => {
  const errors = validationResult(request);
  
  if (!errors.isEmpty()) {
    return response.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = request.body;

  try {
    // see if user exists; if not, proceed
    let user = await User.findOne({ email: email });
    if (user) {
      return response.status(400)
        .json({ errors: [ { msg: 'User already exists' } ] })
    }

    // get users gravatar
    const avatar = gravatar.url(email, {
      size: 200,
      rating: 'pg',
      default: 'mm'
    });

    user = new User({
      name,
      email,
      avatar,
      password
    });
    
    // encrypt password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // return json webtoken

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