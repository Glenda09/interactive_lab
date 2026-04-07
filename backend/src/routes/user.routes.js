const express = require('express');
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/user.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.put('/:id', userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
