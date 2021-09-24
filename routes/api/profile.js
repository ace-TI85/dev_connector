const express = require('express');
const router = express.Router();

/**
 * @route       GET api/profile
 * @description Test Route
 * @access      Public (no token needed)
 */
router.get('/', (request, response) => {
  response.send('Profile route');
});

module.exports = router;