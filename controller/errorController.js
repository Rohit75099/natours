const AppError = require('../utils/appError');

const handleNotFoundDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 404);
};

const handleDuplicateDB = (err) => {
  const message = `Duplicate key : ${JSON.stringify(err.keyValue)}`;
  return new AppError(message, 400);
};

const handleValidationDB = (err) => {
  const validationFailed = Object.values(err.errors)
    .map((el, ind) => `${ind + 1}.) ${el.message}`)
    .join(' , ');

  const message = `Invalid Fields : ${validationFailed}`;
  // console.log(Object.values(err.errors).map((el) => el.message));
  return new AppError(message, 400);
};

const handleJwtExpiredToken = (err) =>
  new AppError('Session Timeout!!! Please Login Again!!!', 401);

const handleJwtInvalidToken = (err) =>
  new AppError('Invalid Session!!! Please Login Again!!!', 401);

const errorHandlerDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      err: err,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something Went Wrong!!!',
      msg: err.message,
    });
  }
};

const errorHandlerProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      res.status(err.statusCode).json({
        status: err.status,
        message: 'OOPS! Something went wrong.',
      });
    }
  }
  if (err.isOperational) {
    res.status(err.statusCode).render('error', {
      title: 'Something Went Wrong!!!',
      msg: err.message,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something Went Wrong!!!',
      msg: 'OOPS! Something went wrong. Please try after sometime',
    });
  }
};

module.exports = (err, req, res, next) => {
  // console.log(err.name);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'dev') {
    errorHandlerDev(err, req, res);
  } else if (process.env.NODE_ENV === 'prod') {
    let error = JSON.parse(JSON.stringify(err));
    error.message = err.message;
    if (error.name === 'NotFoundInDB') error = handleNotFoundDB(error);
    if (error.code === 11000) error = handleDuplicateDB(error);
    if (error.name === 'ValidationError') error = handleValidationDB(error);
    if (error.name === 'TokenExpiredError')
      error = handleJwtExpiredToken(error);
    if (error.name === 'JsonWebTokenError')
      error = handleJwtInvalidToken(error);
    errorHandlerProd(error, req, res);
  }
  next();
};
