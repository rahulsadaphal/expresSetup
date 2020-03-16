const surveyObject = require('./survey');
const functions = require('../common/functions');   

const surveyController = {
  
  //   createSurvey: async (req, res) => {
  //   try {
  //     var userId = res.locals.tokenInfo.Id
  //     const result = await surveyObject.surveyService().createSurvey(userId, req.body);
  //     res.send(functions.responseGenerator(result.code, result.message, result.data));
  //   } catch (error) {
  //     res.send(functions.responseGenerator(error.code, error.message, error.data));
  //   }
  // },

  createSurveyV2: async (req, res) => {
    try {
      var userId = res.locals.tokenInfo.Id
      const result = await surveyObject.surveyService().createSurveyV2(userId, req.body);
      res.send(functions.responseGenerator(result.code, result.message, result.data));
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  },
 
  getSurveyForAdmin: async (req, res) => {
    try {
      var userId = res.locals.tokenInfo.Id
      const result = await surveyObject.surveyService().getSurveyForAdmin(userId, req.body);
      res.send(functions.responseGenerator(result.code, result.message, result.data));
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  },

  getSurveyForResident: async (req, res) => {
    try {
      var userId = res.locals.tokenInfo.Id
      const result = await surveyObject.surveyService().getSurveyForResident(userId, req.body);
      res.send(functions.responseGenerator(result.code, result.message, result.data));
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  },

  getSurveyDetails: async (req, res) => {
    try {
      var userId = res.locals.tokenInfo.Id
      var surveyId = req.params.id
      const result = await surveyObject.surveyService().getSurveyDetails(userId, surveyId, req.body);
      res.send(functions.responseGenerator(result.code, result.message, result.data));
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  },
  
 // get Id From Blk ID
 getIdFromBlkIDandType: async (req, res) => {
  try {
    var blkId =  req.body.blk_referenceId
    var blkType =  req.body.blk_referenceType
    const result = await surveyObject.surveyService().getSurveyIdFromBlkSurveyID(blkId,blkType);
    res.send(functions.responseGenerator(result.code, result.message, result.data));
  } catch (error) {
    console.log("Error getIdFromBlkIDandType",error)
    res.send(functions.responseGenerator(error.code, error.message, error.data));
  }
},

 //blk_CreateNewSurvey 
 blk_CreateNewSurvey: async (req, res) => {
  try {
    var userId = res.locals.tokenInfo.Id;
    var BuildingID = res.locals.tokenInfo.BuildingID;
    const newSurveyDetails = await surveyObject.surveyService().blk_CreateNewSurvey(req.body,userId,BuildingID);
    res.send(
      functions.responseGenerator(newSurveyDetails.code, newSurveyDetails.message, newSurveyDetails.data)
    );
  } catch (error) {
    console.log("Error blk_CreateNewSurvey",error)
    res.send(functions.responseGenerator(error.code, error.message, error.data));
  }
},
  deleteSurvey: async (req, res) => {
    try {
      console.log('inside delete survey')
      var surveyId = req.params.id
      console.log('surveyId',surveyId)
      var userId = res.locals.tokenInfo.Id
      console.log('userId',userId)
      const result = await surveyObject.surveyService(). deleteSurvey(surveyId, userId, req.body);
      res.send(functions.responseGenerator(result.code, result.message, result.data));
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  },

  updateSurvey: async (req, res) => {
    try {
      var surveyId = req.params.id
      console.log('surveyId',surveyId)
      var userId = res.locals.tokenInfo.Id
      const result = await surveyObject.surveyService().updateSurvey(surveyId, userId, req.body);
      res.send(functions.responseGenerator(result.code, result.message, result.data));
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  },

  publishSurvey: async (req, res) => {
    try {
      var surveyId = req.params.id
      console.log('surveyId',surveyId)
      var userId = res.locals.tokenInfo.Id
      const result = await surveyObject.surveyService(). publishSurvey(surveyId, userId, req.body);
      res.send(functions.responseGenerator(result.code, result.message, result.data));
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  },  

  endSurvey: async (req, res) => {
    try {
      var surveyId = req.params.id
      console.log('surveyId',surveyId)
      var userId = res.locals.tokenInfo.Id
      const result = await surveyObject.surveyService(). endSurvey(surveyId, userId, req.body);
      res.send(functions.responseGenerator(result.code, result.message, result.data));
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  }, 
  getInviteStatusforSurvey: async (req, res) => {
    try {
      var surveyId = req.params.id
      var userId = res.locals.tokenInfo.Id
      const result = await surveyObject.surveyService(). getInviteStatusforSurvey(surveyId, userId, req.body);
      res.send(functions.responseGenerator(result.code, result.message, result.data));
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  },
  
  getParticipatedUsers: async (req, res) => {
    try {
      var surveyId = req.params.id
      var userId = res.locals.tokenInfo.Id
      const result = await surveyObject.surveyService(). getParticipatedUsers(surveyId, userId, req.body);
      res.send(functions.responseGenerator(result.code, result.message, result.data));
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  } 

}
module.exports = surveyController;
