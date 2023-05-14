const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const extension = file.mimetype.split('/')[1];
//     const userId = req.user._id;
//     cb(null, `user-${userId}-${Date.now()}.${extension}`);
//   },
// });

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

exports.resizeUserImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

exports.uploadUserPhoto = upload.single('photo');

exports.getAllUsers = factory.getAll(User);

exports.updateMe = catchAsync(async (req, res, next) => {
  const allowedFields = ['name', 'email'];
  const options = {};
  Object.keys(req.body).forEach((el) => {
    if (allowedFields.includes(el)) options[el] = req.body[el];
  });
  if (req.file) options.photo = req.file.filename;
  const updatedUser = await User.findByIdAndUpdate(req.user._id, options, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: 'success',
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'err',
    message: 'route not created yet instead use /signup',
  });
};

exports.getUserSelf = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
