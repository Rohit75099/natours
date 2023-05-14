const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
  });
  if (!tour)
    return next(new AppError('No tour found with the provided name', 404));
  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.login = catchAsync(async (req, res) => {
  res.status(200).render('login');
});

exports.getAccountDetails = (req, res, next) => {
  res.status(200).render('account');
};

exports.getBooking = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user._id });
  const tours = bookings.map((booking) => booking.tour);
  res.status(200).render('overview', {
    title: 'My Bookings',
    tours,
  });
});
