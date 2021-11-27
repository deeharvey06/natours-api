const jwt = require('jsonwebtoken');
const User = require('../models/user');
const AppError = require('../utils/appError');

const signToken = async (id) =>
  await jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports.signToken = signToken;

const createSendToken = async (user, statsuCode, res) => {
  const token = signToken(user._id);
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Wont send cookies in dev b/c its not HTTPS
  if (process.env.NODE_ENV === 'production') cookieOption.secure = true;

  res.cookie('jwt', token, cookieOption);

  // Romoves password from output
  user.password = undefined;

  res.status(statsuCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.createSendToken = createSendToken;

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

    createSendToken(newUser, 201, res);
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

    createSendToken(user, 200, res);
  } catch (error) {
    next(new AppError(error.message, error.statusCode));
  }
};

exports.updatePassword = async (req, res, next) => {
  const { currentPassword, password, passwordConfirm } = req.body;
  const { id } = req.user;

  try {
    const user = await User.findById({ id }).select('+password');

    if (!user) {
      return next(new AppError('user not found', 404));
    }

    if (!(await user.correctPassword(currentPassword, user.password))) {
      return new AppError('Your current password is wrong', 401);
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    next(new AppError(error.message, error.statusCode));
  }
};
