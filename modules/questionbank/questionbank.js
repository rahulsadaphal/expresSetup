const con = require('../database/mysql');
const util = require('util');
const query = util.promisify(con.query).bind(con);
const code = require('../common/code');
const message = require('../common/message');
const _ = require('lodash');
var SqlString = require('sqlstring');
const upload = require('../common/imageUpload');
const imageDelete = require('../common/imageDelete');

class QBankService {
  async getQuestionfromBank() {
    try {
      // const sqlQuery = 'SELECT * FROM tblQuestionBank WHERE IsDeleted = 0 ';
      const sqlQuery = `SELECT BANK.Id, BANK.Question, BANK.IsDeleted, BANK.CreatedOn, BANK.CreatedBy, concat(USR.FirstName, ' ', USR.LastName) as FullName 
      FROM tblQuestionBank as BANK 
      inner join tbluser as USR on BANK.CreatedBy = USR.Id
      WHERE BANK.IsDeleted = 0 `;

      const resultList = await query(sqlQuery);
      var finalResult = resultList;
      for (var res of finalResult) {
        var quoteRemove = res.Question.replace(/\'/gi, '');
        var slashRemove = quoteRemove.replace(/\\/gi, '');
        res.Question = JSON.parse(slashRemove);
      }
      return {
        code: code.success,
        message: message.questionFetched,
        // data: Object.values(resultList)
        data: finalResult
      };
    } catch (e) {
      console.log('TCL: getQuestionfromBank Error - ', e);
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }

  async addToQuestionBank(questiondata, userId) {
    try {
      console.log('inside addToQuestionBank route');
      const sqlQuerySurvey =
        'INSERT INTO tblQuestionBank(Question, CreatedBy,UpdatedBy) VALUES (?, ?, ?)';
      console.log('question data', JSON.parse(questiondata[0].bankData));
      const questionInsertDetails = await query(sqlQuerySurvey, [
        SqlString.escape(questiondata[0].bankData),
        userId,
        userId
      ]);

      return {
        code: code.success,
        message: message.questionCreated,
        data: questionInsertDetails
      };
    } catch (e) {
      console.log('TCL: addToQuestionBank Error - ', e);
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }

  async deleteQuestionById(questionId) {
    try {
      console.log('qsnid', questionId)
      const sqlQuery = `UPDATE tblQuestionBank SET IsDeleted = 1 where Id = ?;`;
      const surveyDetails = await query(sqlQuery, [questionId]);
      return {
        code: code.success,
        message: message.questionDeleted,
        data: surveyDetails
      };
    } catch (e) {
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }
}

module.exports = {
  qBankService: function() {
    return new QBankService();
  }
};
