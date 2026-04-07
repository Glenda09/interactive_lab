const express = require('express');
const authMiddleware = require('../middleware/auth');
const simulationController = require('../controllers/simulation.controller');

const router = express.Router();

router.get('/', simulationController.getAll);
router.get('/:id', simulationController.getById);

router.use(authMiddleware);
router.post('/', simulationController.create);
router.put('/:id', simulationController.update);
router.delete('/:id', simulationController.remove);

module.exports = router;
