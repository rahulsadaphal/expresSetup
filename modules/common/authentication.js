const functions = require('./functions');
const code = require('./code');
const message = require('./message');
const app_enums = require('./app_enums');
const request = require('request');
var jwtDecode = require('jwt-decode');

const authenticationController = {
  validateToken: async (req, res, next) => {
    try {
      if (req.headers.auth) {
        const tokenDecryptInfo = await functions.tokenDecrypt(req.headers.auth);
        if (tokenDecryptInfo.data) {
          res.locals.tokenInfo = tokenDecryptInfo.data;
          const token = await functions.tokenEncrypt(tokenDecryptInfo.data);
          res.header('auth', token);
          next();
        } else {
          res.send(functions.responseGenerator(code.sessionExpire, message.sessionExpire));
        }
      } else {
        res.send(functions.responseGenerator(code.invalidDetails, message.tokenMissing));
      }
    } catch (e) {
      console.log(e);
      res.send(functions.responseGenerator(code.invalidDetails, message.tryCatch, e));
    }
  },

  decryptRequest: (req, res, next) => {
    try {
      if (req.body.encRequest) {
        const userinfo = functions.decryptData(req.body.encRequest);
        res.locals.requestedData = userinfo;
        next();
      } else {
        res.send(functions.responseGenerator(code.invalidDetails, message.dataIssue));
      }
    } catch (e) {
      console.log(e);
      res.send(functions.responseGenerator(code.invalidDetails, message.tryCatch, e));
    }
  },

  parseSSO: async (req, res, next) => {
    try {
      if (req.query.OAuthToken) {
        handle_oauth_sso(req, res, next);
      } else {
        handle_data_sso(req, res, next);
      }
      //  else {
      //   res.send(functions.responseGenerator(code.invalidDetails, message.dataIssue));
      // }
    } catch (e) {
      console.log(e);
      res.send(functions.responseGenerator(code.invalidDetails, message.tryCatch, e));
    }
  }
};

module.exports = authenticationController;

function handle_oauth_sso(req, res, next) {
  var decoded = jwtDecode(req.query.OAuthToken);
  console.log('DATA RECEIVED FROM OAUTH TOKEN');
  if (
    JSON.parse(decoded.user_type) &&
    decoded.property &&
    JSON.parse(decoded.property) &&
    JSON.parse(decoded.unit_occupancy)
  ) {
    var datamapping = {
      userid: decoded.sub,
      role: functions.getRoleofVisitor(JSON.parse(decoded.user_type).name),
      FirstName: decoded.given_name,
      LastName: decoded.family_name,
      EmailAddress: '',
      BuildingId: JSON.parse(decoded.property).id,
      BuildingName: JSON.parse(decoded.property).name,
      OccupancyId: JSON.parse(decoded.unit_occupancy).id,
      UnitName: JSON.parse(decoded.unit_occupancy).name,
      IsMgmtUnit: false,
      TimeStamp: '2019-07-18T07:18:39.7015937Z'
    };
    res.locals.ssoData = JSON.stringify(datamapping);
    res.locals.action_mode = app_enums.ACTION_MODE_OAUTH;
    next();
  } else {
    res.send(functions.responseGenerator(code.invalidDetails, message.oAuthdataIssue));
  }
}

function handle_data_sso(req, res, next) {
  var data = '';
  var actionMode = '';

  /* *
   * We have different URL to handle SSO from BLK applciation 
   * below cases are used to read parameter passed 
   * */

  // SSO LOGIN
  if (req.query.data) {
    data = req.query.data;
    actionMode = app_enums.ACTION_MODE_SSO_LOGIN;
  }

  // CREATE SURVEY
  if (req.query.createsurvey) {
    data = req.query.createsurvey;
    actionMode = app_enums.ACTION_MODE_CREATE;
  }
  // EDIT SURVEY
  if (req.query.editsurvey) {
    data = req.query.editsurvey;
    actionMode = app_enums.ACTION_MODE_EDIT;
  }
  // ANSWER SURVEY
  if (req.query.answersurvey) {
    data = req.query.answersurvey;
    actionMode = app_enums.ACTION_MODE_ANSWER;
  }
  // VIEW RESPOSNES 
  if (req.query.viewresponses) {
    data = req.query.viewresponses;
    actionMode = app_enums.ACTION_MODE_VIEW_RESPOSNE;
  }

  request(
    'http://survey.buildinglink.com:8081/api/values?encrypted_data=' + data + "&taskType=decrypt",
    function (error, response, plainbody) {
      plainbody = JSON.parse(plainbody);
      res.locals.ssoData = plainbody;
      res.locals.action_mode = actionMode;
      next();
    }
  );
}

/*
// plain data sample 

// Create Survey
var data = {
  "blk_referenceType": "SURVEY",
  "blk_referenceId": 12,
  "surveyTitle": "dsadasd",
  "expirationdate": "10/06/2019",
  "userid": 6835215,
  "role": "Admin",
  "FirstName": "Jai",
  "LastName": "Porje",
  "EmailAddress": "",
  "BuildingId": 36,
  "BuildingName": "SCTL Development - South",
  "OccupancyId": 1308,
  "UnitName": "Bldg Mgmt",
  "IsMgmtUnit": true,
  "TimeStampUTC": "2019-09-13T15:44:37.482504Z"
}

DATA
  http://localhost:8080/?createsurvey=
  UFVOX9a1za7fGZPN5Bon00deX2ZqfT5UqwuToy6fDGLS0dRpLS0/BuNcuA008MEkKrrZsa01Bqwykm/EMuNPsiNy/JXTBDUpqk4Otb4AYJCas4Vy+HHJQZpPP6T0UDP7erVpyTeCHYzdxy1PE+N24hrj3wYEFGZuUjoBDmUBb1pYjmw1iKhDqLNVb98LNUerD7pp6lwMV6pMXKjnM7iA0wE5d8Fvj6lQktMloPuvX2bh7QbfelkAe8TpBVegs7e9bggb3QN6MvpZDIqxaJhQv1DXJgO9V2XjAR4ak2ToqVqdTNzZsUL/J1oXnb7eyNQeiUMss47gl/NQPisOiATWSYZb1NyoAZ+AusGPpfinEOImzQtMvPCbHzruCfah9he6zAUY8QreAZsSWuOa+iP5YWqlShxAOGAysJBQQxqEJQ3LuXkB6gUYbGdKjHRH7ytDcwSK6ShnthBGUk6DbMR0yGygYGyvef7OYEZNRplMpVAts8yQPxLHP11hZGUVHfJXQUtMaZ31f+tdYsf5hRhbI9MEBFUkoe3RSCAVZp2Rj0hNtWxEOykAxbFeSfIVGph5OvmgSC9Gvmx1Ahrrp7v+FWuKFkXTXFtAsHRPOmXiHuNdjHDrkDOFbVuP79INXjRgvFbDvSzpbsCH2MLo+GmOujZXJXCiqeqs3rDkk7yJQgQa9k+r7C91fw/L1Kr8O0PU+slFNWySH5XCM0iuMNA5L+ABkW16sxGBkfsreh6uX7xHVk6AHcmaHR68Lz9F/+gs3c2Kgy2/RTmWTRpUPRTuX4Es7dH5YNKHpMtDOhI9xwA7HXPAXV567FkKrGpsV47QGfQqnO5FXe9wpgiiqYDELVBwTdm5rUuaquiHEojm4LeRDvchKLOCy1vJn0B+//JK4oODyNMfqt+85e80Nj/7d6oEaO6QeqnKAtJ9NcbK+F3vqAR1oilKTa1fAAd/WsfB


// Edit Survey
var data = {
  "blk_referenceType": "SURVEY",
  "blk_referenceId": 12,
  "userid": 6835215,
  "role": "Admin",
  "FirstName": "Jai",
  "LastName": "Porje",
  "EmailAddress": "",
  "BuildingId": 36,
  "BuildingName": "SCTL Development - South",
  "OccupancyId": 1308,
  "UnitName": "Bldg Mgmt",
  "IsMgmtUnit": true,
  "TimeStampUTC": "2019-09-13T15:44:37.482504Z"
}

DATA
http://localhost:8080/?editsurvey=
UFVOX9a1za7fGZPN5Bon00deX2ZqfT5UqwuToy6fDGLS0dRpLS0/BuNcuA008MEkKrrZsa01Bqwykm/EMuNPsiNy/JXTBDUpqk4Otb4AYJCas4Vy+HHJQZpPP6T0UDP7mzqm2NYIp97sP09Ojx8aNUBdQsMmCMNp/M8NcZEqh5kD4U/UB4Ks/yJwGrn0e7AK/sSt2dHEQX95ULGk5bTOFO/4GO+1/zdLz4UuE1mNWvmm26Jyw2UdPWsiTWrK4FHuwQmWvB/DPPX+iMoU1d4cG+ntQehfZtVEj4raPqCt4g/M6S66SddC7wTlwj3R37H/KtwYxTi5HYmrirAVOrki14n6B9CSkm88gxGiaS6Za/TGgvvPL6AohPMPYIHBEnmxbTCjAR92AiOb1gMa1VjLBEtxdtkSoNEJFOwxGe8ubM0SFzuJMxKGqQ8CTVeM2i7/Cf8MO9M9UZ0Z28ny+t9oIqpNGWymYvHgadX/JVOzMlNViCIvZDvApUMtBFzOAW5Dqg0aY9xE5yxWB01FeC0Wp7ZjVRvOCVkpT0r0N1F3IUwx+EXRqVHMVeboNxZP0PWsgKmG1VIH7zCgaumLBbOqSRH6TcZr+mGblWkoye9a0qHDZz04U7bY7zcGfEjLJF1MAG0Xd/QPFAvQEKoR+IRHuYcbsNqIxPjLTi2IQTwMHKoTN/EhgcBPXbHVx742+67wHOV5Kb8heqbfX0uLNfedz6wdOYTnvzycDg1CzAn2Jhg94mkReA2jAgDooN/xBn0wxZeaPuUTJKtgo3bR8sAlLmY4ILx7atvXvFrvptHbKoQ=

{
  "blk_referenceType": "SURVEY",
  "blk_referenceId": 12,
  "userid": 6280906,
  "role": "Resident",
  "FirstName": "John",
  "LastName": "Constantine",
  "EmailAddress": "",
  "BuildingId": 36,
  "BuildingName": "SCTL Development - South",
  "OccupancyId": 1308,
  "UnitName": "Bldg Mgmt",
  "IsMgmtUnit": true,
  "TimeStampUTC": "2019-09-13T15:44:37.482504Z"
}
http://localhost:8080/?answersurvey=
UFVOX9a1za7fGZPN5Bon00deX2ZqfT5UqwuToy6fDGLS0dRpLS0/BuNcuA008MEkKrrZsa01Bqwykm/EMuNPsiNy/JXTBDUpqk4Otb4AYJCas4Vy+HHJQZpPP6T0UDP7mzqm2NYIp97sP09Ojx8aNaPOpp9VFmp7BWTpWiEm3GQCX56jewbGtJBiAWXM6Mv2jkFTiDvA2cd+jwlDJbi7EblTY21idtDut2rp5oDz9bYeaZHk39SlUQeUgUpCccy/G7XJA7hpRJguDNekgf/6yLSiZEuVnM2d11mxLi3Kcs4fS5YGshiWNFKmM+KrWnYdGbeRPoU27RLXLCq3RqVVe4G9n4bb3XwLLe1+MqhZ97wlk4PVO0GoxfuMXE5v6LDMjK00M6FdjDymN0kaZaKWTsCVi01YGs4gmr/6sSSHA5aDInFFLgpPAV753l+tYpnLYz1EwB21tntxSAbbrwZOtF/XXYidBG+mBiwi0wIvqENZijduvWGzBVOKv7rufw2+yasSPxpRO6O+qxy61aymX37paboR4mJoOZzP8rf9qeKgmJoJpQF4QYXzY4gsqLSPnYetdSquAnPM2+bCNlKYx23IUYKMAbnqYEMxZUS9azt8sfM7a3wa2IOGzUhcaO1wrnXbrfDPPbDMgUrV7YXtkfc0UBZLfoDx5svbkyibiM4AoWbD5kS0VoNYwYDtu467mCrAphC9bAUAfxEF8CKA3drSwwHrX9ByAXpQ6/nvs4kXHCUyLISbwKSI7lMvE/jQzp+NikdZ15haPYWPvvF/EGF7mbSpF+C6PV93+V5kXmpOlW++825OeFDZWmKo1Ys4



// View Resposne

http://localhost:8080/?viewresponses=
UFVOX9a1za7fGZPN5Bon00deX2ZqfT5UqwuToy6fDGLS0dRpLS0/BuNcuA008MEkKrrZsa01Bqwykm/EMuNPsiNy/JXTBDUpqk4Otb4AYJCas4Vy+HHJQZpPP6T0UDP7mzqm2NYIp97sP09Ojx8aNUBdQsMmCMNp/M8NcZEqh5kD4U/UB4Ks/yJwGrn0e7AK/sSt2dHEQX95ULGk5bTOFO/4GO+1/zdLz4UuE1mNWvmm26Jyw2UdPWsiTWrK4FHuwQmWvB/DPPX+iMoU1d4cG+ntQehfZtVEj4raPqCt4g/M6S66SddC7wTlwj3R37H/KtwYxTi5HYmrirAVOrki14n6B9CSkm88gxGiaS6Za/TGgvvPL6AohPMPYIHBEnmxbTCjAR92AiOb1gMa1VjLBEtxdtkSoNEJFOwxGe8ubM0SFzuJMxKGqQ8CTVeM2i7/Cf8MO9M9UZ0Z28ny+t9oIqpNGWymYvHgadX/JVOzMlNViCIvZDvApUMtBFzOAW5Dqg0aY9xE5yxWB01FeC0Wp7ZjVRvOCVkpT0r0N1F3IUwx+EXRqVHMVeboNxZP0PWsgKmG1VIH7zCgaumLBbOqSRH6TcZr+mGblWkoye9a0qHDZz04U7bY7zcGfEjLJF1MAG0Xd/QPFAvQEKoR+IRHuYcbsNqIxPjLTi2IQTwMHKoTN/EhgcBPXbHVx742+67wHOV5Kb8heqbfX0uLNfedz6wdOYTnvzycDg1CzAn2Jhg94mkReA2jAgDooN/xBn0wxZeaPuUTJKtgo3bR8sAlLmY4ILx7atvXvFrvptHbKoQ=


*/
