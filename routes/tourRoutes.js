const express = require('express');
const tourController = require('../controller/tourController');
const authController = require('../controller/authController');
const reviewRouter = require('./reviewRoute');

const router = express.Router();

router.use('/:tourName/review', reviewRouter);

router
  .route('/top-5-tours')
  .get(tourController.topFiveTours, tourController.getAllTours);
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/month-count/:year')
  .get(
    authController.protect,
    authController.restrict('admin', 'lead-guide', 'guide'),
    tourController.montlyCount
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.toursWithin);

router.route('/distance/:latlng/unit/:unit').get(tourController.distances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrict('admin', 'lead-guide'),
    tourController.addTour
  );
router
  .route('/:id')
  .get(tourController.getTourIdByName, tourController.getTour)
  .patch(
    authController.protect,
    authController.restrict('admin', 'lead-guide', 'guide'),
    tourController.getTourIdByName,
    tourController.uploadTourPhotos,
    tourController.resizeTourPhotos,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrict('admin', 'lead-guide', 'guide'),
    tourController.getTourIdByName,
    tourController.deleteTour
  );

module.exports = router;
