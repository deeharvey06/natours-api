const User = require('../models/user');
const AppError = require('../utils/appError');

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

exports.createUser = (req, res) => {};

exports.getUser = (req, res) => {};

exports.updateUser = (req, res) => {};
exports.deleteUser = (req, res) => {};
