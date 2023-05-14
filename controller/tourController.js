const Tour = require('../models/tourModel');
const multer = require('multer');
const sharp = require('sharp');
// const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Only Image format is supported', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourPhotos = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourPhotos = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);
  req.body.images = [];
  Promise.all(
    req.files.images.map(async (file, idx) => {
      req.body.images.push(
        `tour-${req.params.id}-${Date.now()}-${idx + 1}.jpeg`
      );
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.images[idx]}`);
    })
  );
  next();
});

exports.getTourIdByName = catchAsync(async (req, res, next) => {
  const { id: name } = req.params;
  const tour = await Tour.findOne({ name: name });
  if (!tour)
    return next(new AppError('No tour exist with the provided Name', 404));
  req.params.id = tour._id;
  next();
});

exports.topFiveTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,ratingsAverage,price,summary';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.addTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTour: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgRating: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    result: stats.length,
    data: {
      stats,
    },
  });
});

exports.montlyCount = catchAsync(async (req, res, next) => {
  const { year } = req.params;
  const monthCount = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        $expr: {
          $eq: [{ $year: '$startDates' }, Number(year)],
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        tourCount: { $sum: 1 },
        tour: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { tourCount: -1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    result: monthCount.length,
    data: {
      monthCount,
    },
  });
});

exports.toursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    return next(new AppError('Please define both latitute and longitute', 400));
  const unitAllowed = ['mi', 'km'];
  if (!unitAllowed.includes(unit))
    return next(
      new AppError('Please mention mi for miles or km for kilometer', 400)
    );
  if (!distance || Number(distance) < 0)
    return next(new AppError('Either distance is not define or negative', 400));
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      tours,
    },
  });
});

exports.distances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    return next(new AppError('Please define both latitute and longitute', 400));
  const unitAllowed = ['mi', 'km'];
  if (!unitAllowed.includes(unit))
    return next(
      new AppError('Please mention mi for miles or km for kilometer', 400)
    );
  const mul = unit === 'mi' ? 0.000621371 : 0.001;
  const distance = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: mul,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    result: distance.length,
    data: {
      distance,
    },
  });
});
