const dotenv = require('dotenv');
dotenv.config();
var request = require('request'),
    fs = require('fs'),
    apiKey = process.env.APIKEY;

    formData = {
        target_format: 'docx',
        source_file: fs.createReadStream('./file.pdf')
    };
const localFilename = './hello.docx';

function startConversionJob(formData){
return new Promise((resolve,reject)=>{
request.post({url:'https://sandbox.zamzar.com/v1/jobs/', formData: formData}, function (err, response, body) {
    if (err) {
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
   
function downloadFile(fileID){
return new Promise((resolve,reject) => 
{
request.get({url: 'https://sandbox.zamzar.com/v1/files/' + fileID + '/content', followRedirect: false}, function (err, response, body) {
    if (err) {
        reject('Unable to download file:', err);
    } else {
        // We are being redirected
        if (response.headers.location) {
            // Issue a second request to download the file
            var fileRequest = request(response.headers.location);
            fileRequest.on('response', function (res) {
                res.pipe(fs.createWriteStream(localFilename));
            });
            fileRequest.on('end', function () {
                console.log('File download complete');
                resolve();
            });
        }
    }
}).auth(apiKey,'',true).pipe(fs.createWriteStream(localFilename));
});
};

async function convertFile(){
    try{
    const jobID = await startConversionJob(formData);
    await new Promise((res)=>{setTimeout(res,10000)});
    const fileID = await ZamzarGotJoborNot(jobID);
    await downloadFile(fileID);
    console.log("Conversion Done Successfully!!");
    }catch(err){
        console.log(err);
    }
}

convertFile();