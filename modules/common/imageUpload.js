const fs = require('fs');
const path = require('path');
const mime = require('mime');
const uuidv4 = require('uuid/v4');

//function to decode base64 image data
function decodeBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
}

//function to upload image data to server
const upload = function uploadBase64(imageLink) {
  var uploadPath = path.normalize(process.cwd() + '/public/uploads/');

  var decodedImg = decodeBase64Image(imageLink);

  var imageBuffer = decodedImg.data;
  var type = decodedImg.type;
  var extension = mime.getExtension(type);

  // var fileName = value + '.' + extension;
  var fileName = uuidv4() + '.' + extension;

  var imgURL = `/uploads/` + fileName;

  try {
    const checkvalue = fs.writeFileSync(uploadPath + fileName, imageBuffer, 'utf8');
    return imgURL;
  } catch (error) {
    return error.message;
  }
};

module.exports = upload;
