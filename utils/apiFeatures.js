const Tour = require('../models/tourModel');

class APIFeatures {
  constructor(query, queryParameters) {
    this.query = query;
    this.queryParameters = queryParameters;
  }

  filter() {
    //normal filter
    let queryObj = { ...this.queryParameters };
    const nonQueryFields = ['page', 'limit', 'sort', 'fields'];
    nonQueryFields.forEach((el) => delete queryObj[el]);
    //advance filter
    queryObj = JSON.stringify(queryObj);
    queryObj = JSON.parse(
      queryObj.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)
    );
    this.query = this.query.find(queryObj);
    return this;
  }

  fields() {
    if (this.queryParameters.fields) {
      const fields = this.queryParameters.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  sort() {
    //sorting
    if (this.queryParameters.sort) {
      const sortBy = this.queryParameters.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('price');
    }
    return this;
  }

  async paginate() {
    //pagination
    const page = Number(this.queryParameters.page) || 1;
    const limit = Number(this.queryParameters.limit) || 100;
    const skip = (page - 1) * limit;
    const numberDocuments = await Tour.countDocuments();
    if (skip >= numberDocuments) throw new Error('Selecting Empty Page');
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
