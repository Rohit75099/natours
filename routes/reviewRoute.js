const express = require('express');
const reviewController = require('../controller/reviewController');
const authController = require('../controller/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReview)
  .post(
    authController.protect,
    authController.restrict('user'),
    reviewController.setTourAndUser,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReviewById)
  .delete(
    authController.restrict('user', 'admin'),
    reviewController.deleteReview
  )
  .patch(
    authController.restrict('user', 'admin'),
    reviewController.updateReview
  );

module.exports = router;
