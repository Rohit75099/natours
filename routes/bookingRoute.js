const express = require('express');
const bookingController = require('../controller/bookingController');
const authController = require('../controller/authController');

const router = express.Router();

router
  .route('/check-out/:tourId')
  .get(authController.protect, bookingController.tourCheckOut);

module.exports = router;
