const { Storage } = require('@google-cloud/storage');
const dotenv = require('dotenv');
dotenv.config();

const keyFilename =  process.env.GOOGLE_CLOUD_KEYFILENAME;
const projectId= process.env.GOOGLE_CLOUD_PROJECT_ID;
const storage = new Storage({
    projectId,
      keyFilename
  });
const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
async function uploadToGCS(file,fileOutputNane){
    try{
        const bucket = storage.bucket(bucketName);
        const res = await bucket.upload(file,{
            destination:fileOutputNane
        })

        const [signedUrl] = await storage
        .bucket(bucketName)
        .file(fileOutputNane)
        .getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000, // 1-hour expiration
        });
        return {res,signedUrl};
    }catch(err){
        console.log("Error in GCS while uploading file", err);
    }
}
module.exports = {uploadToGCS};

