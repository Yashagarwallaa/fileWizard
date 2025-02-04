
const dotenv = require('dotenv');
dotenv.config();
var request = require('request'),
    fs = require('fs'),
    apiKey = process.env.APIKEY;


function startConversionJob(formData){
return new Promise((resolve,reject)=>{
request.post({url:'https://sandbox.zamzar.com/v1/jobs/', formData: formData}, function (err, response, body) {
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
   
function downloadFile(fileID, localFilename) {
    return new Promise((resolve, reject) => {
        console.log(`Starting download for file ${fileID}`);
        
        const fileStream = fs.createWriteStream(localFilename);
        
        fileStream.on('error', (err) => {
            console.error('File stream error:', err);
            reject(err);
        });

        fileStream.on('finish', () => {
            console.log('File stream finished');
            fileStream.close();
        });

        fileStream.on('close', () => {
            console.log('File download complete');
            resolve();
        });

        // Make direct request to download the file
        const downloadRequest = request({
            url: `https://sandbox.zamzar.com/v1/files/${fileID}/content`,
            auth: {
                user: apiKey,
                pass: '',
                sendImmediately: true
            }
        });

        downloadRequest.on('error', (err) => {
            console.error('Download request error:', err);
            fileStream.destroy();
            reject(err);
        });

        downloadRequest.on('response', (response) => {
            console.log('Download started with status:', response.statusCode);
            if (response.statusCode !== 200) {
                console.error('Download failed with status:', response.statusCode);
                fileStream.destroy();
                reject(new Error(`Download failed with status: ${response.statusCode}`));
            }
        });

        downloadRequest.pipe(fileStream);
    });
}

async function convertFile(formData,localFilename){
    try{
    const jobID = await startConversionJob(formData);
    await new Promise((res)=>{setTimeout(res,10000)});
    const fileID = await ZamzarGotJoborNot(jobID);
    const x = await downloadFile(fileID,localFilename);
    console.log("Conversion Done Successfully!!");
    return;
    }catch(err){
        console.log(err);
    }
}


module.exports = { convertFile};