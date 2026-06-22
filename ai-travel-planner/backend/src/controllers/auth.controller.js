const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt.utils');
const { successResponse, errorResponse } = require('../utils/response.utils');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 409, 'An account with this email already exists.');
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    return successResponse(res, 201, 'Account created successfully', { token, user });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    const token = generateToken(user._id);
    user.password = undefined;

    return successResponse(res, 200, 'Login successful', { token, user });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getMe = async (req, res) => {
  try {
    return successResponse(res, 200, 'User profile retrieved', { user: req.user });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
    return successResponse(res, 200, 'Profile updated successfully', { user });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = { register, login, getMe, updateProfile };
