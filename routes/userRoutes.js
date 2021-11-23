const express = require('express');
const { signup, login } = require('../controllers/authController');
const {
  getAllUser,
  createUser,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const { forgotPassword, resetPassword } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('login', login);

router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword', resetPassword);

router.route('/').get(getAllUser).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
