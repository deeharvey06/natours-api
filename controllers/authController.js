const User = require('../models/user');
const AppError = require('../utils/appError');

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({ ...req.body });

    if (!newUser) return next(new AppError('', 400));

    res.status(201).json({
      status: 'success',
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
