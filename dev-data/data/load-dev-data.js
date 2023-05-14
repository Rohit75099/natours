const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: '../../config.env' });
const dbUrl = process.env.DB_URL.replace('<PASSWORD>', process.env.DB_PASSWORD);
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection Successful'))
  .catch((err) => console.log('DB connection Failed'));

const tourData = JSON.parse(
  fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
);
const userData = JSON.parse(
  fs.readFileSync(`${__dirname}/users.json`, 'utf-8')
);
const reviewData = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data Deleted Successfully');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const importData = async () => {
  try {
    await Tour.create(tourData);
    await User.create(userData, { validateBeforeSave: false });
    await Review.create(reviewData);
    console.log('Data Imported Successfully');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// console.log(process.argv);
if (process.argv[2] === '--import') importData();
else if (process.argv[2] === '--delete') deleteData();
