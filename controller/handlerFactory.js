const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const Tour = require('../models/tourModel');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return next(new AppError('No Doc found with the given Id', 404));
    res.status(204).json({
      status: 'success',
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        newDoc,
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findOneAndUpdate({ _id: req.params.id }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('No doc exist with provided Name', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findOne({ _id: req.params.id }).populate(
      populateOptions
    );
    if (!doc) {
      return next(new AppError('No doc exist with provided Name', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //************************** The Hack to implement nested review route on tour ************//
    let reviewFilter = {};
    if (req.params.tourName) {
      const tempDoc = await Tour.findOne({ name: req.params.tourName });
      if (!tempDoc)
        return next(new AppError('No Tour Found with given name', 404));
      reviewFilter = { tour: tempDoc._id };
    }
    //******************************************************************************************//
    const features = await new APIFeatures(Model.find(reviewFilter), req.query)
      .filter()
      .sort()
      .fields()
      .paginate();

    const docs = await features.query;
    res.status(200).json({
      status: 'success',
      result: docs.length,
      data: {
        docs,
      },
    });
  });
