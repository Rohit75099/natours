const mongoose = require('mongoose');
const validator = require('validator');
const AppError = require('../utils/appError');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!!!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide Email ID'],
    lowercase: true,
    validate: [validator.isEmail, 'Please Provide the Valid Email'],
    unique: true,
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin'],
      message: 'Invalid Role',
    },
    default: 'user',
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  password: {
    type: String,
    required: [true, 'Please Provide the password'],
    minLength: [8, 'The Password must be 8 characters long'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: [
      function (val) {
        return this.password === val;
      },
      'Password Mismatch',
    ],
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: String,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.post('save', (err, doc, next) => {
  if (err.code === 11000) {
    next(
      new AppError(
        'Provided Email ID already have account please login or use different Email ID',
        400
      )
    );
  } else {
    next();
  }
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.checkPassword = async (providedPassword, passwordHash) =>
  await bcrypt.compare(providedPassword, passwordHash);

userSchema.methods.isPasswordChangedAfter = function (tokenCreatedTime) {
  if (this.passwordChangedAt) {
    const chagngedTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return chagngedTime > tokenCreatedTime;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // console.log(resetToken);
  // console.log(this.passwordResetToken);
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
