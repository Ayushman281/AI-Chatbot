const express = require('express');
const router = express.Router();
const { handleAgentQuery } = require('../controllers/agentController');

router.post('/ask', handleAgentQuery);

module.exports = router;
