const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const simulationRoutes = require('./simulation.routes');
const resultRoutes = require('./result.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/simulations', simulationRoutes);
router.use('/results', resultRoutes);

module.exports = router;
