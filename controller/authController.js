const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const Email = require('../utils/sendEmail');
const crypto = require('crypto');
// const bcrypt = require('bcryptjs');

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

const signAndSendToken = (res, user, statusCode) => {
  const token = signToken(user._id);
  const cookiesOptions = {
    expiresIn: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'prod') cookiesOptions.secure = true;
  res.cookie('jwt', token, cookiesOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  signAndSendToken(res, newUser, 200);
});

exports.loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError('Either Email ID or Password not Provided', 400));
  const user = await User.findOne({ email: email }).select('+password');
  if (!user) return next(new AppError('Incorrect email or Password', 400));
  const isPasswordCorrect = await user.checkPassword(password, user.password);
  if (!isPasswordCorrect)
    return next(new AppError('Incorrect email or Password', 400));
  // const token = signToken(user._id);
  signAndSendToken(res, user, 200);
});

exports.logoutUser = (req, res) => {
  const cookiesOptions = {
    expiresIn: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  };
  res.cookie('jwt', 'userLoggedOut', cookiesOptions);
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  const token = req.headers?.authorization?.split(' ')[1] || req.cookies.jwt;
  if (
    !token ||
    (!req.cookies.jwt && req.headers?.authorization?.split(' ')[0] !== 'Bearer')
  )
    next(new AppError('Please Login to have Access', 401));

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  if (!decoded) return next(new AppError('Please login to view details.'));
  const user = await User.findById(decoded.id);
  // console.log(user);
  if (!user) return next(new AppError('The user does not exist!!!', 401));
  if (user.isPasswordChangedAfter(decoded.iat))
    return next(
      new AppError(
        'Invalid Password!!! Please login using correct password',
        401
      )
    );

  req.user = user;
  res.locals.user = user;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET_KEY);
      const user = await User.findById(decoded.id);
      if (!user) return next();
      if (user.isPasswordChangedAfter(decoded.iat)) return next();
      res.locals.user = user;
      return next();
    }
  } catch {
    return next();
  }
  next();
};

exports.restrict = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError("You don't have permission to perform this action", 403)
      );
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const user = await User.findOne({ email: email }).select();
  if (!user)
    return next(new AppError('No user Found with the given email Id', 400));
  const resetToken = user.createPasswordResetToken();
  user.isPreRun = false;
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;
  await new Email(user, resetUrl).sendPasswordReset();
  res.status(200).json({
    status: 'success',
    message: 'Reset token sent on mail',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // console.log(req.params.token);
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  // console.log(hashedToken);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // console.log(Date.now());
  if (!user)
    return next(new AppError('Link is either invalid or expired', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  signAndSendToken(res, user, 200);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;
  if (!currentPassword || !newPassword || !newPasswordConfirm)
    return next(new AppError('Please provide all the fields', 400));
  const user = await User.findOne({ email: req.user.email }).select(
    '+password'
  );
  if (!user) return next(new AppError('user does not exist', 400));
  const isPasswordCorrect = await user.checkPassword(
    currentPassword,
    user.password
  );
  if (!isPasswordCorrect) return next(new AppError('Incorrect Password', 403));
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();
  signAndSendToken(res, user, 200);
});
