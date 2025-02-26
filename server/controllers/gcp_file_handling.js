const { Storage } = require('@google-cloud/storage');
const dotenv = require('dotenv');
dotenv.config();
const { promisify } = require('util');
const stream = require('stream');
const axios = require('axios');
const pipeline = promisify(stream.pipeline);
const keyFilename =  process.env.GOOGLE_CLOUD_KEYFILENAME;
const projectId= process.env.GOOGLE_CLOUD_PROJECT_ID;
const storage = new Storage({
    projectId,
      keyFilename
  });
const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
async function uploadToGCS(fileUrl,fileOutputName){
    try{
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileOutputName);

        const writeStream = file.createWriteStream({
            resumable: false,
          });
          const response = await axios({
            method: 'GET',
            url: fileUrl,
            responseType: 'stream'
          });
          await pipeline(response.data, writeStream);
   
        const [signedUrl] = await storage
        .bucket(bucketName)
        .file(fileOutputName)
        .getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000, // 1-hour expiration
        });
        return {fileOutputName,signedUrl};
    }catch(err){
        console.log("Error in GCS while uploading file", err);
    }
}

async function uploadToGCSFile(file,fileOutputName){
  try{
      const bucket = storage.bucket(bucketName);
      await bucket.upload(file,{
        destination:fileOutputName,
      })
 
      const [signedUrl] = await storage
      .bucket(bucketName)
      .file(fileOutputName)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1-hour expiration
      });
      return {fileOutputName,signedUrl};
  }catch(err){
      console.log("Error in GCS while uploading file", err);
  }
}
module.exports = {uploadToGCS,uploadToGCSFile};

