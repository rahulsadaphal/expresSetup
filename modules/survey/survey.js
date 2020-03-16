const con = require('../database/mysql');
const util = require('util');
const query = util.promisify(con.query).bind(con);
const code = require('../common/code');
const message = require('../common/message');
const _ = require('lodash');
const upload = require('../common/imageUpload');
const imageDelete = require('../common/imageDelete');

class surveyService {
  //creation of new survey

  //get survey details
  async getSurveyDetails(userId, surveyId, data) {
    try {
      const surveyDetailsQuery = `select * from tblsurvey where Id = ?`;
      const surveyDetailsResult = await query(surveyDetailsQuery, [surveyId]);

      return {
        code: code.success,
        message: message.surveyCreated,
        data: surveyDetailsResult
      };
    } catch (e) {
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }

  //function to return surveys created by Admin
  async getSurveyForAdmin(userId, data) {
    try {
      const surveyDetailsQuery = `
      SELECT SRV.Id, SRV.SurveyTitle, SRV.SurveyDesc, SRV.LogoUrl, IFNULL(SRV.IsPublished,0) as IsPublished , SRV.BuildingID, SRV.motivationStatement, 
      SRV.CreatedBy, CONCAT(USR.FirstName, ' ', USR.LastName) as AdminName, SRV.CreatedOn,
      IFNULL(DATE_FORMAT(SRV.StartDate,'%m/%d/%Y'), 'Not started yet') as StartDate,
      IFNULL(DATE_FORMAT(SRV.EndDate,'%m/%d/%Y'),'Not ended yet') as EndDate,
	    DATE_FORMAT(SRV.CreatedOn,'%m/%d/%Y') as  CreatedOn,
      (Select IFNULL(DATE_FORMAT(max(CreatedOn),'%m/%d/%Y'), 'No responses yet')  from tblsurveyresponse where SurveyID =  SRV.Id ) as LastResponseDate,
      (Select count(distinct(A.userID)) from tblsurveyresponse A
 inner join tblresidentresponsestatus  B On A.SurveyID = B.SurveyID and A.UserID = B.UserID and B.IsSubmitted = 1
 where A.SurveyID =  SRV.Id ) as ResponseCount,
      (select count(distinct(a.id)) from tbluser as a  inner join tblbuilding as d on d.refBuildingID = a.refBuildingID
      where d.refBuildingID in (Select refbuildingId from tblbuilding where userid =? )) as TotalResidents
      FROM tblsurvey  SRV 
      Inner join tblbuilding BLD ON SRV.BuildingID = BLD.Id
      Inner join tbluser USR ON USR.ID = SRV.CreatedBy
      where SRV.Isdeleted  = 0  and BLD.refbuildingId in ((Select refbuildingId from tblbuilding where userid =? ) )
      order by SRV.CreatedOn desc
      `;
      const surveyDetailsResult = await query(surveyDetailsQuery, [userId, userId]);

      return {
        code: code.success,
        message: message.surveyFetched,
        data: surveyDetailsResult
      };
    } catch (e) {
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }

  //function to return surveys targeted for specific resident
  async getSurveyForResident(userId, data) {
    try {
      /*
      //This query returns survey data
      const sqlQuery1 = `SELECT Id, SurveyTitle, SurveyDesc,BuildingID FROM tblsurvey
      where BuildingID in 
      (SELECT id FROM tblbuilding where RefBuildingId in (select RefBuildingId from tbluser where ID = ?))
      and IsPublished NOT IN (0,2) order by CreatedOn desc;`;
*/
      // ADDED NEW FIELD FOR READING Last date when resident has answered the Survey
      // const sqlQuery1 = `SELECT Id, SurveyTitle, SurveyDesc,BuildingID,
      // (Select IFNULL(DATE_FORMAT(max(CreatedOn),'%m/%d/%Y'), 'You have not started this survey')  from tblsurveyresponse where SurveyID =  SRV.Id and UserID =  ? ) as LastResponseDate
      // FROM tblsurvey SRV
      //      where BuildingID in
      //      (SELECT id FROM tblbuilding where RefBuildingId in (select RefBuildingId from tbluser where ID = ?))
      //      and IsPublished NOT IN (0,2) order by CreatedOn desc;`;

      const sqlQuery1 = `SELECT Id, SurveyTitle, SurveyDesc,BuildingID,
      (select IFNULL(IsSubmitted, 0) from tblresidentresponsestatus where SurveyID = SRV.Id and UserID = ?) as isSubmitted,
      (Select IFNULL(DATE_FORMAT(max(CreatedOn),'%m/%d/%Y'), 'You have not started this survey')  from tblsurveyresponse where SurveyID =  SRV.Id and UserID =  ? ) as LastResponseDate
      FROM tblsurvey SRV
      where BuildingID in 
      (SELECT id FROM tblbuilding where RefBuildingId in (select RefBuildingId from tbluser where ID = ?))
      and IsPublished NOT IN (0,2) order by CreatedOn desc`;

      const surveyResult = await query(sqlQuery1, [userId, userId, userId]);

      return {
        code: code.success,
        message: message.surveyFetched,
        data: surveyResult
      };
    } catch (e) {
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }

  //function to delete survey
  async deleteSurvey(surveyId, userId, data) {
    try {
      const sqlQuery = 'delete from tblsurvey where Id = ? AND CreatedBy = ?';
      // const sqlQuery1 = 'delete from tblsurveyunit where SurveyID = ?';
      // const sqlQuery2 = 'delete from tblsurveygroup where SurveyID = ?';
      const sqlQuery3 = 'SELECT distinct Id from tblsurveyquestions where SurveyID = ?';
      const sqlQuery4 = 'delete from tblsurveyquestions where Id = ?';
      const sqlQuery5 = 'delete from tblsurveyquestionchoice where SurveyQuesID = ?';

      //Following query gets all Reference data for every question sothat if it contains images then we can delete them from disk after question and survey deletion
      const ChoiceRefQuery = `select QuesRefData from tblsurveyquestionchoice 
      where SurveyQuesID in
      (select Id from tblsurveyquestions where SurveyID = ?)`;
      const ChoiceRefResult = await query(ChoiceRefQuery, [surveyId]);
      //------------------------------------------------------------------------------------------

      //LogoUrl delete functionality for survey
      const LogoUrlQuery = 'select LogoUrl from tblsurvey where Id = ?';
      const LogoUrlResult = await query(LogoUrlQuery, [surveyId]);
      imageDelete(LogoUrlResult[0].LogoUrl);
      //-----------------------------------------------------------------------------------------

      const surveyDeleteResult = await query(sqlQuery, [surveyId, userId]);
      // const surveyUnitDeleteResult = await query(sqlQuery1, [surveyId]);
      // const surveyGroupDeleteResult = await query(sqlQuery2, [surveyId]);
      const surveyQuestionsId = await query(sqlQuery3, [surveyId]);

      for (var i = 0; i < surveyQuestionsId.length; i++) {
        const deleteQuestions = await query(sqlQuery4, [surveyQuestionsId[i].Id]);
        const deleteChoices = await query(sqlQuery5, [surveyQuestionsId[i].Id]);
      }

      //functionality to delete Question choice images from disk after survey deletion
      for (var i = 0; i < ChoiceRefResult.length; i++) {
        if (
          ChoiceRefResult[i].QuesRefData == null ||
          ChoiceRefResult[i].QuesRefData.match(/https:\/\//g) != null ||
          ChoiceRefResult[i].QuesRefData.match(/http:\/\//g) != null
        ) {
          continue;
        } else {
          imageDelete(ChoiceRefResult[i].QuesRefData);
        }
      }
      //---------------------------------------------------------------------

      return {
        code: code.success,
        message: message.surveyDeleted,
        data: message.surveyDeleted
      };
    } catch (e) {
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }

  async createSurveyV2(userId, data) {
    try {
      //getting questions and survey data
      const {
        survey,
        questions
      } = data;

      //getting survey data to insert into database
      const {
        step,
        pages
      } = survey;
      const info = pages[0].elements[0];
      const userIdQuery = 'select Id from tblbuilding where UserID = ?';
      const userIdResult = await query(userIdQuery, [userId]);

      const insertSurveyQuery = `insert into tblsurvey 
      (SurveyTitle, SurveyDesc,EstCompletionTime,EstCompletionRate, CreatedBy, 
        motivationStatement, Discalimer,BuildingID,categoryID, LogoUrl, IsPublished,
        startdate,enddate) 
      values (?,?,?,?,?,?,?,?,?,?,?,date(?),date(?))`;
      var insertSurveyResult = null;
      var imageUrl1 = null;
      if (info.LogoUrl == '') {
        var insertSurveyResult = await query(insertSurveyQuery, [
          info.title,
          info.description,
          15,
          40.0,
          userId,
          info.motivation,
          info.disclaimer,
          userIdResult[0].Id,
          info.categoryID,
          imageUrl1,
          info.IsPublished,
          info.startdate,
          info.enddate
        ]);
      } else {
        imageUrl1 = upload(info.LogoUrl);
        var insertSurveyResult = await query(insertSurveyQuery, [
          info.title,
          info.description,
          15,
          40.0,
          userId,
          info.motivation,
          info.disclaimer,
          userIdResult[0].Id,
          info.categoryID,
          imageUrl1,
          info.IsPublished,
          info.startdate,
          info.enddate
        ]);
      }

      var SurveyID = insertSurveyResult.insertId;
      var returnData = {
        SurveyID: SurveyID
      };
      //getting questions data to insert into database
      const Step = questions.Step;
      const pages1 = questions.pages;
      // const { Step, pages1 } = questions;
      const queryQuestions = [];
      var done = true;
      var i = 0;
      if (pages1[0].elements) {
        const jsonQuery = `update tblsurvey set SurveyJSON = ? where Id = ?`;
        var jsonObj1 = {
          pages: pages1
        };
        var jsonObj = JSON.stringify(jsonObj1);
        const jsonResult = await query(jsonQuery, [jsonObj, SurveyID]);

        const parsedInfo = parseInfo(pages1[0].elements);

        //Following query gets all Reference data for every question sothat if it contains images then we can delete them from disk after question and survey deletion
        const ChoiceRefQuery = `select QuesRefData from tblsurveyquestionchoice 
        where SurveyQuesID in
        (select Id from tblsurveyquestions where SurveyID = ?)`;
        const ChoiceRefResult = await query(ChoiceRefQuery, [SurveyID]);
        //------------------------------------------------------------------------------------------

        const getQuestionsQuery = `select Id from tblsurveyquestions where SurveyID = ?`;
        const getQuestionsResult = await query(getQuestionsQuery, [SurveyID]);
        const deleteQuestionQuery = `delete from tblsurveyquestions where Id = ?`;
        const deleteChoiceQuery = `delete from tblsurveyquestionchoice where SurveyQuesID = ?`;

        for (var k = 0; k < getQuestionsResult.length; k++) {
          const deleteQuestionResult = await query(deleteQuestionQuery, [getQuestionsResult[k].Id]);
          const deleteChoiceResult = await query(deleteChoiceQuery, [getQuestionsResult[k].Id]);
        }

        //  functionality to delete images from disk after survey deletion
        for (i = 0; i < ChoiceRefResult.length; i++) {
          if (
            ChoiceRefResult[i].QuesRefData == null ||
            ChoiceRefResult[i].QuesRefData.match(/https:\/\//g) != null ||
            ChoiceRefResult[i].QuesRefData.match(/http:\/\//g) != null
          ) {
            continue;
          } else {
            imageDelete(ChoiceRefResult[i].QuesRefData);
          }
        }
        //  ---------------------------------------------------------------------

        const sqlQuery =
          'insert into tblSurveyQuestions (SurveyID, question_title, question_type, question_step) values (?,?,?,?)';
        const sqlQuery1 =
          'insert into tblSurveyQuestionChoice (SurveyQuesID, QuesChoiceData, QuesRefData)  values ?';
        const sqlQuery2 =
          'insert into tblSurveyQuestionChoice (SurveyQuesID, QuesChoiceData, QuesRefData)  values (?,?,?)';
        i = 0;
        do {
          if (i >= parsedInfo.length) {
            done = false;
          } else if (parsedInfo[i].choices) {
            const questionsList = await query(sqlQuery, [
              SurveyID,
              parsedInfo[i].name,
              parsedInfo[i].type,
              Step
            ]);
            const QuestionID = questionsList.insertId;
            const choiceData = getChoiceData(parsedInfo[i].choices, QuestionID, parsedInfo[i].type);
            const ChoiceList1 = await query(sqlQuery1, [choiceData]);
            i++;
          } else {
            const questionsList = await query(sqlQuery, [
              SurveyID,
              parsedInfo[i].name,
              parsedInfo[i].type,
              Step
            ]);
            parsedInfo[i].choices = null;
            const quesID = questionsList.insertId;
            const ChoiceList2 = await query(sqlQuery2, [quesID, null, null]);
            i++;
          }
        } while (done === true);

        var data = {
          message: 'Question added successfully'
        };


      }
      //THIS PART IS FOR DELETING PREVIOUS QUESTIONS AND CHOICES IF QUESTION OBJECT FROM FRONTEND IS EMPTY
      else {

        const jsonQuery = `update tblsurvey set SurveyJSON = ? where Id = ?`;
        var jsonObj1 = {
          pages: pages1
        };
        var jsonObj = JSON.stringify(jsonObj1);
        const jsonResult = await query(jsonQuery, [jsonObj, SurveyID]);

        const getQuestionsQuery = `select Id from tblsurveyquestions where SurveyID = ?`;
        const getQuestionsResult = await query(getQuestionsQuery, [SurveyID]);
        const deleteQuestionQuery = `delete from tblsurveyquestions where Id = ?`;
        const deleteChoiceQuery = `delete from tblsurveyquestionchoice where SurveyQuesID = ?`;

        for (var k = 0; k < getQuestionsResult.length; k++) {
          const deleteQuestionResult = await query(deleteQuestionQuery, [getQuestionsResult[k].Id]);
          const deleteChoiceResult = await query(deleteChoiceQuery, [getQuestionsResult[k].Id]);
        }
      }

      return {
        code: code.success,
        message: message.surveyCreated,
        data: returnData
      };
    } catch (e) {
      console.log('Error in add new Survey-', e);
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }

  //function to update survey details
  async updateSurvey(surveyId, userId, data) {
    try {
      //getting questions and survey data
      const {
        survey,
        questions
      } = data;

      //getting survey data to insert into database
      const {
        step,
        pages
      } = survey;
      const info = pages[0].elements[0];
      //This query updates images if imageURL contains image data
      var sqlQuery = `update tblsurvey set SurveyTitle = ?, SurveyDesc = ?, LogoUrl = ?, CreatedBy = ?,  
      motivationStatement = ?, Discalimer = ?, categoryID = ?, IsPublished = ?,  startdate = ?, enddate = ? where Id = ?`;
      //This query does not update imageURL if image data from req.body is empty
      var sqlQuery1 = `update tblsurvey set SurveyTitle = ?, SurveyDesc = ?, CreatedBy = ?,  
      motivationStatement = ?, Discalimer = ?, categoryID = ?, IsPublished = ?, startdate = ?, enddate = ? where Id = ?`;
      const LogoUrlQuery = 'select LogoUrl from tblsurvey where Id = ?';
      //logoURL upload functionality
      var imageUrl1 = null;
      if (info.LogoUrl == '') {
        const updateResult = await query(sqlQuery1, [
          info.title,
          info.description,
          userId,
          info.motivation,
          info.disclaimer,
          info.categoryID,
          info.IsPublished,
          info.startdate,
          info.enddate,
          surveyId
        ]);
      } else {
        const LogoUrlResult = await query(LogoUrlQuery, [surveyId]);
        imageDelete(LogoUrlResult[0].LogoUrl);
        imageUrl1 = upload(info.LogoUrl);
        const updateResult = await query(sqlQuery, [
          info.title,
          info.description,
          imageUrl1,
          userId,
          info.motivation,
          info.disclaimer,
          info.categoryID,
          info.IsPublished,
          info.startdate,
          info.enddate,
          surveyId
        ]);
      }

      var returnData = {
        'SurveyID successfully updated': surveyId
      };

      //getting questions data to insert into database
      const Step = questions.Step;
      const pages1 = questions.pages;
      // const { Step, pages1 } = questions;

      const queryQuestions = [];
      var done = true;
      var i = 0;

      if (pages1[0].elements) {
        const jsonQuery = `update tblsurvey set SurveyJSON = ? where Id = ?`;
        var jsonObj1 = {
          pages: pages1
        };
        var jsonObj = JSON.stringify(jsonObj1);
        const jsonResult = await query(jsonQuery, [jsonObj, surveyId]);

        //Following query gets all Reference data for every question sothat if it contains images then we can delete them from disk after question and survey deletion
        const ChoiceRefQuery = `select QuesRefData from tblsurveyquestionchoice 
        where SurveyQuesID in
        (select Id from tblsurveyquestions where SurveyID = ?)`;
        const ChoiceRefResult = await query(ChoiceRefQuery, [surveyId]);
        //------------------------------------------------------------------------------------------

        //delete current questions from questions table
        const getQuestionsQuery = `select Id from tblsurveyquestions where SurveyID = ?`;
        const getQuestionsResult = await query(getQuestionsQuery, [surveyId]);
        const deleteQuestionQuery = `delete from tblsurveyquestions where Id = ?`;
        const deleteChoiceQuery = `delete from tblsurveyquestionchoice where SurveyQuesID = ?`;

        for (var k = 0; k < getQuestionsResult.length; k++) {
          const deleteQuestionResult = await query(deleteQuestionQuery, [getQuestionsResult[k].Id]);
          const deleteChoiceResult = await query(deleteChoiceQuery, [getQuestionsResult[k].Id]);
        }

        //functionality to delete images from disk after survey deletion
        for (i = 0; i < ChoiceRefResult.length; i++) {
          if (
            ChoiceRefResult[i].QuesRefData == null ||
            ChoiceRefResult[i].QuesRefData.match(/https:\/\//g) != null ||
            ChoiceRefResult[i].QuesRefData.match(/http:\/\//g) != null
          ) {
            continue;
          } else {
            imageDelete(ChoiceRefResult[i].QuesRefData);
          }
        }
        //---------------------------------------------------------------------

        //insert updated questions into table
        const parsedInfo = parseInfo(pages1[0].elements);

        const sqlQuery0 =
          'insert into tblSurveyQuestions (SurveyID, question_title, question_type, question_step) values (?,?,?,?);';
        const choiceQuery1 =
          'insert into tblSurveyQuestionChoice (SurveyQuesID, QuesChoiceData, QuesRefData)  values ?;';
        const sqlQuery2 =
          'insert into tblSurveyQuestionChoice (SurveyQuesID, QuesChoiceData, QuesRefData)  values (?,?,?);';
        i = 0;
        do {
          if (i >= parsedInfo.length) {
            done = false;
          } else if (parsedInfo[i].choices) {
            const questionsList = await query(sqlQuery0, [
              surveyId,
              parsedInfo[i].name,
              parsedInfo[i].type,
              Step
            ]);
            const QuestionID = questionsList.insertId;
            const choiceData = getChoiceData(parsedInfo[i].choices, QuestionID, parsedInfo[i].type);
            const ChoiceList1 = await query(choiceQuery1, [choiceData]);
            i++;
          } else {
            const questionsList = await query(sqlQuery0, [
              surveyId,
              parsedInfo[i].name,
              parsedInfo[i].type,
              Step
            ]);
            parsedInfo[i].choices = null;
            const quesID = questionsList.insertId;
            const ChoiceList2 = await query(sqlQuery2, [quesID, null, null]);
            i++;
          }
        } while (done === true);

        var data = {
          message: 'Question added successfully'
        };

      }
      //THIS PART IS FOR DELETING PREVIOUS QUESTIONS AND CHOICES IF QUESTION OBJECT FROM FRONTEND IS EMPTY
      else {

        const jsonQuery = `update tblsurvey set SurveyJSON = ? where Id = ?`;
        var jsonObj1 = {
          pages: pages1
        };
        var jsonObj = JSON.stringify(jsonObj1);
        const jsonResult = await query(jsonQuery, [jsonObj, surveyId]);

        const getQuestionsQuery = `select Id from tblsurveyquestions where SurveyID = ?`;
        const getQuestionsResult = await query(getQuestionsQuery, [surveyId]);
        const deleteQuestionQuery = `delete from tblsurveyquestions where Id = ?`;
        const deleteChoiceQuery = `delete from tblsurveyquestionchoice where SurveyQuesID = ?`;

        for (var k = 0; k < getQuestionsResult.length; k++) {
          const deleteQuestionResult = await query(deleteQuestionQuery, [getQuestionsResult[k].Id]);
          const deleteChoiceResult = await query(deleteChoiceQuery, [getQuestionsResult[k].Id]);
        }
      }


      return {
        code: code.success,
        message: message.surveyUpdated,
        data: returnData
      };
    } catch (e) {
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }

  //function to publish survey
  async publishSurvey(surveyId, userId, data) {
    try {
      const sqlQuery = `UPDATE tblsurvey SET  StartDate = current_timestamp() , IsPublished =  1 WHERE Id = ?`;
      const publishResult = await query(sqlQuery, [surveyId]);

      return {
        code: code.success,
        message: message.surveyPublished,
        data: message.surveyPublished
      };
    } catch (e) {
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }

  //function to End survey
  async endSurvey(surveyId, userId, data) {
    try {
      const sqlQuery = `UPDATE tblsurvey SET  EndDate = current_timestamp() , IsPublished =  2 WHERE Id = ?`;
      const endResult = await query(sqlQuery, [surveyId]);

      return {
        code: code.success,
        message: message.surveyPublished,
        data: message.surveyPublished
      };
    } catch (e) {
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }

  //This function returns pending, inprogress and completed count for each survey
  async getInviteStatusforSurvey(surveyId, userId, data) {
    try {
      // const sqlQuery = 'CALL getinvitestatusforsurvey(?)';
      const sqlQuery = 'CALL getinvitestatusforsurvey2(?)';
      const resultList = await query(sqlQuery, [surveyId]);

      var finalData = {
        SurveyId: 0,
        SurveyName: null,
        SurveyDesc: null,
        TotalQuestions: 0,
        TotalUserCount: 0,
        InProgress: 0,
        Completed: 0,
        Pending: 0
      };
      if (resultList && resultList[0] && resultList[0][0]) {
        finalData.SurveyId = resultList[0][0].ID;
        finalData.SurveyName = resultList[0][0].SurveyTitle;
        finalData.SurveyDesc = resultList[0][0].SurveyDesc;
        finalData.TotalQuestions = resultList[0][0].v_totalquestion;
        finalData.TotalUserCount = resultList[0][0].v_totalParticipants;
        finalData.InProgress = resultList[0][0].v_inProgress;
        finalData.Completed = resultList[0][0].v_completed;
        finalData.Pending = resultList[0][0].v_pending;
      }
      return {
        code: code.success,
        message: message.success,
        data: finalData
      };
    } catch (e) {
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }

  //This function returns list of targeted users or residents for specific survey Id
  async getParticipatedUsers(surveyId, userId, data) {
    try {
      // const sqlQuery = `select concat(a.FirstName, ' ', a.LastName, ' - ' , a.RefUserId) as Name, a.id as UserID from tbluser as a
      // inner join tblbuilding as d on d.refBuildingID = a.refBuildingID
      // where d.Id = ? order by Name `;
      // const query1 = 'select BuildingID from tblsurvey where Id = ?';
      // const buildingResult = await query(query1, [surveyId]);

      const sqlQuery = `select concat(a.FirstName, ' ', a.LastName, ' - ' , a.RefUserId) as Name,
        a.id as UserID,RESSTAT.IsSubmitted from tbluser as a  
        inner join tblbuilding as d on d.refBuildingID = a.refBuildingID
        inner join tblresidentresponsestatus RESSTAT on RESSTAT.SurveyID = ? and RESSTAT.UserID = A.id and RESSTAT.IsSubmitted = 1
        where d.Id = (select BuildingID from tblsurvey where Id = ?) order by Name`;
      const userList = await query(sqlQuery, [surveyId, surveyId]);

      return {
        code: code.success,
        message: message.success,
        data: userList
      };
    } catch (e) {
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }


  /**
   * 
   * @param {This is type of action performed as per URL passed} action_mode 
   * @param {*} UserId 
   * @param {*} BuildingID 
   */
  async blk_CreateNewSurvey(data, UserId, BuildingID) {

    // ----------------------------------------------------------------------------------------------------------
    // IN CASE OF "CREATE", we get  blk_referenceType ,blk_referenceId , surveyTitle, expirationdate from URL
    // Create new survey in TblSurvey and get Basic infiormation for this with userDetails and return to Client
    // ----------------------------------------------------------------------------------------------------------
    const sqlQuery_blk_CreateSurvey = `INSERT INTO tblsurvey
    (SurveyTitle,SurveyDesc,Discalimer,BuildingID,IsPublished,
    StartDate,EndDate,
    CreatedBy,UpdatedBy,
    blk_referenceType ,blk_referenceId )
    values 
    (?,?,'Responses received are kept private and not disclosed to other residents',?,1,
    current_timestamp(),?,
    ?,?,
    ?,?);`

    const createResultList = await query(sqlQuery_blk_CreateSurvey,
      [data.surveyTitle,data.surveyTitle ,BuildingID, 
        data.expirationdate,
        UserId,UserId,
        data.blk_referenceType, data.blk_referenceId]);

    // CONSTRUCT RESPONSE and RETURN
    return {
      code: code.success,
      message: message.success,
      data: {
        SurveyId: createResultList.insertId
      }
    };
  }

  /**
   * 
   * @param {This is type of action performed as per URL passed} action_mode 
   * @param {*} UserId 
   * @param {*} BuildingID 
   */
  async getSurveyIdFromBlkSurveyID(blkId, blkType) {

    // ----------------------------------------------------------------------------------------------------------
    // IN CASE OF "EDIT" + "VIEW RESPONSE" +  "ANSWER SURVEY" , we get  blk_referenceType ,blk_referenceId from URL
    // Just get TblSurvey.Id for this referencekey with userDetails and return to Client
    // ----------------------------------------------------------------------------------------------------------
    const sqlQuery_blk_getId = `SELECT Id FROM tblSurvey WHERE blk_referenceId = ? and  blk_referenceType = ? order by Id DESC LIMIT 1;`

    // GET NECESSARY DATA FROM DB, HERE WE HAVE WRITTEN 2 SQL, You will get result in array resultList[0] and resultList[1]
    const resultList = await query(sqlQuery_blk_getId,
      [blkId, blkType]);

    //  CONSTRUCT RESPONSE AND RETURN
    return {
      code: code.success,
      message: message.success,
      data: {
        SurveyId: resultList[0].Id
      }
    };
  }
}

module.exports = {
  surveyService: function () {
    return new surveyService();
  }
};

//function to fetch question choice data from req.body
function getChoiceData(choices, QuestionID, type) {
  const choiceArray = [];
  var temp = null;
  for (var i = 0; i < choices.length; i++) {
    if (typeof choices[i] === 'string') {
      temp = [QuestionID, choices[i], null];
      choiceArray.push(temp);
    } else {
      if (type === 'imagepicker') {
        if (
          choices[i].imageLink.match(/https:\/\//g) != null ||
          choices[i].imageLink.match(/http:\/\//g) != null
        ) {
          temp = [QuestionID, choices[i].value, choices[i].imageLink];
          choiceArray.push(temp);
        } else {
          var imgurl = upload(choices[i].imageLink, choices[i].value);
          temp = [QuestionID, choices[i].value, imgurl];
          choiceArray.push(temp);
        }
      } else {
        temp = [QuestionID, choices[i].text, null];
        choiceArray.push(temp);
      }
    }
  }

  return choiceArray;
}

//function for parsing question info
function parseInfo(questions) {
  var singleQuestionInfo = [];

  questions.forEach(question => {
    singleQuestionInfo.push({
      type: question.type,
      name: question.title == undefined ? question.name : question.title,
      choices: question.choices
    });
  });

  return singleQuestionInfo;
}
