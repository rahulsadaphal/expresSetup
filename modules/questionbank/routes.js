const router = require('express').Router();
const api = require('./controller');
const auth = require('../common/authentication')

// Middle layer for User API 

router.get('/getQuestionfromBank', auth.validateToken, api.getQuestionfromBank);
router.post('/addToQuestionBank', auth.validateToken, api.addToQuestionBank);
router.post('/deleteQuestionById', auth.validateToken, api.deleteQuestionById);

module.exports = router;
