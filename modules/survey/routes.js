const router = require('express').Router();
const api = require('./controller');
const auth = require('../common/authentication')
// Middle layer for User API

router.get('/getSurveyForAdmin', auth.validateToken, api.getSurveyForAdmin);
router.get('/getSurveyForResident', auth.validateToken, api.getSurveyForResident); 
router.get('/getParticipatedUsers/:id', auth.validateToken, api.getParticipatedUsers);
router.get('/getInviteStatusforSurvey/:id', auth.validateToken, api.getInviteStatusforSurvey);
router.get('/getSurveyDetails/:id', auth.validateToken, api.getSurveyDetails);
router.post('/', auth.validateToken, api.createSurveyV2);
router.post('/publishSurvey/:id', auth.validateToken, api.publishSurvey);
router.post('/endSurvey/:id', auth.validateToken, api.endSurvey);
router.delete('/:id', auth.validateToken, api.deleteSurvey);
router.put('/:id',  auth.validateToken, api.updateSurvey );
router.post('/getIdFromBlkIDandType', auth.validateToken, api.getIdFromBlkIDandType);
router.post('/blk_CreateNewSurvey',auth.validateToken, api.blk_CreateNewSurvey);
module.exports = router;
