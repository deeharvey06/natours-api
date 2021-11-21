const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXPCEPTION! Shutting down...');
  console.log(err.name, err.message);

  if (process.env.NODE_ENV !== 'production') console.log(err.stack);

  process.exit(1);
});

require('dotenv').config({
  path: './config.env',
});

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful'));

const PORT = process.env.PORT || 1000;

const server = app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

//safety Net for unhandle Rejections
//listen for emitter
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});
