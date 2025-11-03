const Joi = require('joi');

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
    }),
  display_name: Joi.string().min(2).max(100).required(),
  username: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required(),
  bio: Joi.string().max(150).allow(''),
  date_of_birth: Joi.date()
    .max(new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000))
    .required()
    .messages({
      'date.max': 'You must be at least 18 years old',
    }),
  city: Joi.string().min(2).max(100).required(),
  instagram_handle: Joi.string().max(50).allow(''),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const createListingSchema = Joi.object({
  // New structured fields
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).max(500).required(),
  category: Joi.string().valid('sports', 'food', 'entertainment', 'outdoor', 'fitness', 'social', 'other').required(),
  location: Joi.string().min(2).max(200).required(),
  date: Joi.date().min('now').required(),
  time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  max_participants: Joi.number().integer().min(1).max(100).optional(),

  // Legacy fields (optional for backwards compatibility)
  caption: Joi.string().max(200).optional(),
  time_text: Joi.string().max(100).optional(),
  photo_url: Joi.string().uri().optional(),
});

const updateProfileSchema = Joi.object({
  display_name: Joi.string().min(2).max(100),
  bio: Joi.string().max(150).allow(''),
  city: Joi.string().min(2).max(100),
  instagram_handle: Joi.string().max(50).allow(''),
});

module.exports = {
  signupSchema,
  loginSchema,
  createListingSchema,
  updateProfileSchema,
};
