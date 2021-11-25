const express = require('express');
const {
  signup,
  login,
  updatePassword,
} = require('../controllers/authController');
const {
  getAllUser,
  createUser,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const {
  authMiddleware,
  forgotPassword,
  resetPassword,
} = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('login', login);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);
router.patch('/updateMyPassword', authMiddleware, updatePassword);

router.route('/').get(getAllUser).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
