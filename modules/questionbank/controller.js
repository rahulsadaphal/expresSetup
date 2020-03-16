const questionObject = require('./questionbank');
const functions = require('../common/functions');

const questionController = {

  getQuestionfromBank: async (req, res) => {
    try {
      const result = await questionObject.qBankService().getQuestionfromBank(req.body);
      res.send(functions.responseGenerator(result.code, result.message, result.data));
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  },
  
  addToQuestionBank: async (req, res) => {
    try {
      var userId = res.locals.tokenInfo.Id
      const result = await questionObject.qBankService().addToQuestionBank(req.body,userId);
      res.send(functions.responseGenerator(result.code, result.message, result.data));
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  },

  deleteQuestionById: async (req, res) => {
    try {
      const result = await questionObject.qBankService().deleteQuestionById(req.body.Id);
      res.send(functions.responseGenerator(result.code, result.message, result.data));
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  },
  
};

module.exports = questionController;
