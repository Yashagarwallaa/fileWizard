const dotenv = require('dotenv');
dotenv.config();
const request = require('request');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const {uploadToGCSFile} = require('./gcp_file_handling.js')
const apiKey = process.env.APIKEY;
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const keyFileName = process.env.GOOGLE_CLOUD_KEYFILENAME;
const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
const storage = new Storage({
  projectId,
  keyFileName
});

// Create a temp directory for file conversion
const TEMP_DIR = path.join(os.tmpdir(), 'zamzar-conversion');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Download file from GCS to local temp directory
async function downloadFromGCS(bucketName, fileName) {
const localFilePath = path.join(TEMP_DIR, path.basename(fileName));
  
  
  await storage
    .bucket(bucketName)
    .file(fileName)
    .download({ destination: localFilePath });
  
  return localFilePath;
}



function startConversionJob(formData) {
 return new Promise((resolve,reject)=>{
      request.post({url:'https://sandbox.zamzar.com/v1/jobs/', formData}, function (err, response, body) {
          if (err) {
              console.log(err);
              reject('Unable to start conversion job', err);
          } else {
              console.log('SUCCESS! Conversion job started:', JSON.parse(body));
              resolve(JSON.parse(body).id);
          }
      }).auth(apiKey, '', true);
      });
}

function ZamzarGotJoborNot(jobID){
  return new Promise((resolve,reject)=>{
  request.get ('https://sandbox.zamzar.com/v1/jobs/' + jobID, function (err, response, body) {
      if (err) {
          reject('Unable to get job', err);
      } else {
          console.log('SUCCESS! Got job:', JSON.parse(body));
          resolve(JSON.parse(body).target_files[0].id);
      }
  }).auth(apiKey, '', true);
  })
  }


function downloadFromZamzar(fileID, targetFormat, originalFilename) {
  return new Promise((resolve, reject) => {
    const filenameWithoutExt = path.basename(originalFilename, path.extname(originalFilename));
    const localFilePath = path.join(TEMP_DIR, `${filenameWithoutExt}.${targetFormat}`);
    
    
    const fileStream = fs.createWriteStream(localFilePath);
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      reject(err);
    });
    
    fileStream.on('finish', () => {
      resolve(localFilePath);
    });
    
    request({
      url: `https://sandbox.zamzar.com/v1/files/${fileID}/content`,
      auth: {
        user: apiKey,
        pass: '',
        sendImmediately: true
      }
    })
    .on('error', (err) => {
      console.error('Download request error:', err);
      reject(err);
    })
    .on('response', (response) => {
      if (response.statusCode !== 200) {
        fileStream.end();
        reject(new Error(`Download failed with status: ${response.statusCode}`));
      }
    })
    .pipe(fileStream);
    return localFilePath
  });
}




// Main function to handle the full conversion workflow
async function convertFileGCStoGCS(sourceFile, targetFormat,destFolder,localSourcePath) {
  targetFormat = targetFormat.toLowerCase();
  try {
    
    // Step 1: Download file from GCS to local
    if(localSourcePath===null)localSourcePath = await downloadFromGCS(bucketName, sourceFile);
    const fileName = path.basename(localSourcePath);
    sourceFile = `uploads/${fileName}`;
    // Step 3: Start conversion job
    const formData={
      source_file:fs.createReadStream(localSourcePath),
      target_format:targetFormat
    };
    const jobID = await startConversionJob(formData);
    await new Promise((res)=>{setTimeout(res,10000)});

    const targetFileId = await ZamzarGotJoborNot(jobID);
 
    
    // Step 5: Download converted file from Zamzar
    localResultPath = await downloadFromZamzar(targetFileId, targetFormat, sourceFile);
    
    // Step 6: Determine output filename
    const originalFileName = path.basename(sourceFile);
    const fileNameWithoutExt = originalFileName.split('.')[0];
    const targetFileName = `${destFolder}/${fileNameWithoutExt}.${targetFormat}`;
    
    // Step 7: Upload the converted file to GCS
    const {result,signedUrl} = await uploadToGCSFile(localResultPath, targetFileName);
    console.log("Conversion Done");
    return {result,signedUrl};
    
  } catch (err) {
    console.error("Conversion failed:", err);
    throw err;
  } finally {
    // Clean up temporary files
    try {
      if (localSourcePath && fs.existsSync(localSourcePath)) {
        await unlinkAsync(localSourcePath);
        // console.log(`Cleaned up temporary source file: ${localSourcePath}`);
      }
      
      if (localResultPath && fs.existsSync(localResultPath)) {
        await unlinkAsync(localResultPath);
        // console.log(`Cleaned up temporary result file: ${localResultPath}`);
      }
    } catch (cleanupErr) {
      console.error("Error during cleanup:", cleanupErr);
    }
  }
}

module.exports = { 
  convertFileGCStoGCS 
};