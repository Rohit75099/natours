const express = require('express');
const morgan = require('morgan');
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-Parser');

const toursRouter = require('./routes/tourRoutes');
const usersRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoute');
const viewRouter = require('./routes/viewRoute');
const bookingRouter = require('./routes/bookingRoute');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV === 'dev') {
  app.use(morgan('dev'));
}
//removes mongo query from req
app.use(mongoSanitize());
//removes html from req
app.use(xss());
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});
app.use(
  hpp({
    whitelist: [
      'ratingsAverage',
      'ratingsQuantity',
      'name',
      'duration',
      'maxGroupSize',
      'difficulty',
      'price',
      'durationWeeks',
    ],
  })
);

//To limit the request from one IP
const limiter = rateLimiter({
  max: 50,
  windowMs: 60 * 60 * 100,
  message: 'Too Many request from this IP!!! Please try again after 1 hour',
});

app.use('/api', limiter);

//mounting route
app.use('/', viewRouter);
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/review', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`can not find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
