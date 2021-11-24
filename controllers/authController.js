const jwt = require('jsonwebtoken');
const User = require('../models/user');
const AppError = require('../utils/appError');

const signToken = async (id) =>
  await jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports.signToken = signToken;

exports.signup = async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;

  try {
    const newUser = await User.create({
      name,
      email,
      password,
      passwordConfirm,
    });

    if (!newUser) return next(new AppError('', 400));

    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password)
      return next(new AppError('Please email and password', 400));

    //must select password to show since its select: false in model
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password)))
      return next(new AppError('Incorrect email or password', 401));

    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
      data: { user },
    });
  } catch (error) {
    next(new AppError(error.message, error.statusCode));
  }
};
