const { validationResult } = require('express-validator');

/**
 * Validates the result of express-validator checks.
 * Returns 422 with error details if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

module.exports = validate;
