const express = require('express');
const router = express.Router();

/**
 * @route       GET api/posts
 * @description Test Route
 * @access      Public (no token needed)
 */
router.get('/', (request, response) => {
  response.send('Posts route');
});

module.exports = router;