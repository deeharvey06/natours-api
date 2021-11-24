const crypto = require('crypto');
const { promisify } = require('util');

const jwt = require('jsonwebtoken');

const User = require('../models/user');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const { signToken } = require('../controllers/authController');

exports.authMiddleware = async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    const { role } = req.user;

    if (!roles.includes(role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  let user;

  try {
    user = await User.findOne({ email });

    if (!user) {
      return next(
        new AppError('There is no user with that email address', 404)
      );
    }

    const resetToken = user.createPasswordResetToken();
    //inside middleware document was updated but not save()
    await user.save({ validateBeforeUpdate: false });

    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}`;

    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeUpdate: false });

    next(
      new AppError(
        'There was an error sending the eamil. Try again later!',
        500
      )
    );
  }
};

exports.resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;
  const hashedToken = crypto.createhash('sha256').update(token).digest('hex');

  try {
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      //  checking to see if the timestamp is greater than now
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const newToken = signToken(user._id);

    res.status(200).json({
      status: 'success',
      newToken,
      data: { user },
    });
  } catch (error) {
    next(new AppError(error.message, error.statusCode));
  }
};
