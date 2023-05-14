const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const factory = require('./handlerFactory');

exports.getAllReview = factory.getAll(Review);

exports.setTourAndUser = catchAsync(async (req, res, next) => {
  const { tourName } = req.params;
  const tour = await Tour.findOne({ name: tourName });
  if (!tour && !req.body.tour) return next(new AppError('Invalid Tour', 400));
  req.body.tour = req.body.tour || tour._id;
  req.body.user = req.body.user || req.user._id;
  next();
});

exports.createReview = factory.createOne(Review);
exports.getReviewById = factory.getOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
