const express = require('express');
const authMiddleware = require('../middleware/auth');
const resultController = require('../controllers/result.controller');

const router = express.Router();

router.use(authMiddleware);

router.post('/', resultController.create);
router.get('/me', resultController.getMine);
router.get('/simulation/:simulationId', resultController.getBySimulation);

module.exports = router;
