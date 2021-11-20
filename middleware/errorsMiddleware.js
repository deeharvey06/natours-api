const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
}

const handleDuplicateErrorDB = (err, req) => {
  const { name } = req.body;
  const message = `Dulplicate field value: ${name}. Please use another value!`;
  return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
  const errors = Object.keys(err.errors).map(key => key.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
}

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
}

const sendErrorProd = (err, res) => {
  //Operational error
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    //Program error
    console.error('Error :', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'production') sendErrorProd(err, res);
  if (process.env.NODE_ENV === 'development') {
    let error = { ...err };

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.name === 'MongoError' || error.code === 11000) error = handleDuplicateErrorDB(error, req);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);


    sendErrorDev(error, res);
  }
}
