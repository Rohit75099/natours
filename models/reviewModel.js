const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Can not submit an empty review'],
      minlength: [10, 'Atleast 10 characters required'],
      maxlength: [500, 'Only 500 characters allowed'],
    },
    rating: {
      type: Number,
      required: [true, 'A review must have rating'],
      min: 1,
      max: 5,
    },
    reviewCreatedAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function () {
  // this.populate({ path: 'tour', select: 'name' });
  this.populate({ path: 'user', select: 'name photo' });
});

reviewSchema.statics.calcAverageRating = async function (tourId) {
  // console.log(this);
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numberOfRatings: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length === 0)
    stats.push({ numberOfRatings: 0, averageRating: 4.5 });
  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0].averageRating,
    ratingsQuantity: stats[0].numberOfRatings,
  });
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.reviewToCalculateStats = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  this.reviewToCalculateStats.constructor.calcAverageRating(
    this.reviewToCalculateStats.tour
  );
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
