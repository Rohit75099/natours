const express = require('express');
const userController = require('../controller/userController');
const authController = require('../controller/authController');

const router = express.Router();

router.route('/signup').post(authController.signUp);
router.route('/login').post(authController.loginUser);
router.route('/logout').get(authController.logoutUser);
router.route('/forgot-password').post(authController.forgotPassword);
router.route('/reset-password/:token').patch(authController.resetPassword);

//all routes after this will use this
router.use(authController.protect);

router
  .route('/update-me')
  .patch(
    userController.uploadUserPhoto,
    userController.resizeUserImage,
    userController.updateMe
  );
router.route('/delete-me').delete(userController.deleteMe);
router.route('/update-password').patch(authController.updatePassword);
router.route('/me').get(userController.getUserSelf, userController.getUser);

//all routes after this will use this
router.use(authController.restrict('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
