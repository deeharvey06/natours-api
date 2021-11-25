const User = require('../models/user');
const AppError = require('../utils/appError');

const filterObj = (body, ...allowedFields) => {
  let filteredObj = {};
  Object.keys(body).forEach((key) => {
    if (allowedFields.includes(key)) {
      filteredObj[key] = body[key];
    }
  });
  return filteredObj;
};

exports.getAllUser = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({
      status: 'success',
      result: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    next(new AppError(error.message, error.statusCode));
  }
};

exports.updateMe = async (req, res, next) => {
  const { id } = req.user;
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This rooute is nit for password updates. Please use /updateMyPassword',
        400
      )
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'email');

  try {
    const updatedUser = await User.findByIdAndUpdate(id, filteredBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    next(new AppError(err.message, err.statusCode));
  }
};

exports.createUser = (req, res) => {};

exports.getUser = (req, res) => {};

exports.updateUser = (req, res) => {};
exports.deleteUser = (req, res) => {};
