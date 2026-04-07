const Simulation = require('../models/Simulation');

exports.getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    const simulations = await Simulation.find({ ...filter, isPublished: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(simulations);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const simulation = await Simulation.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );
    if (!simulation) return res.status(404).json({ message: 'Simulation not found' });
    res.json(simulation);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const simulation = await Simulation.create({
      ...req.body,
      createdBy: req.user.id,
    });
    res.status(201).json(simulation);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const simulation = await Simulation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!simulation) return res.status(404).json({ message: 'Simulation not found' });
    res.json(simulation);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const simulation = await Simulation.findByIdAndDelete(req.params.id);
    if (!simulation) return res.status(404).json({ message: 'Simulation not found' });
    res.json({ message: 'Simulation deleted' });
  } catch (error) {
    next(error);
  }
};
