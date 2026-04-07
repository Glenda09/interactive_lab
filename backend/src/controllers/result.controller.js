const Result = require('../models/Result');

exports.create = async (req, res, next) => {
  try {
    const result = await Result.create({ ...req.body, user: req.user.id });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getMine = async (req, res, next) => {
  try {
    const results = await Result.find({ user: req.user.id })
      .populate('simulation', 'title category difficulty')
      .sort({ completedAt: -1 });
    res.json(results);
  } catch (error) {
    next(error);
  }
};

exports.getBySimulation = async (req, res, next) => {
  try {
    const results = await Result.find({ simulation: req.params.simulationId })
      .populate('user', 'name email')
      .sort({ score: -1 });
    res.json(results);
  } catch (error) {
    next(error);
  }
};
