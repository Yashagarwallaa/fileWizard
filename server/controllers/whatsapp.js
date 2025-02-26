const twilio = require('twilio');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { processWithGemini } = require('../controllers/gemeniController.js');  // Your existing Gemini logic
const {  convertFileGCStoGCS } = require('../controllers/converFile.js');  // Your existing conversion logic
const {uploadToGCS} = require('../controllers/gcp_file_handling.js');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken =   process.env.TWILIO_AUTH_TOKEN
const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
const client = twilio(
    accountSid,
   authToken
);

const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER;

// Store active file transfers
const activeTransfers = new Map();

// Handle incoming WhatsApp messages
async function handleIncomingMessage(req, res) {
    const twiml = new twilio.twiml.MessagingResponse();
    const userNumber = req.body.From;
    const hasMedia = req.body.NumMedia > 0;
    const userMessage = req.body.Body;

    try {
        // Handle file upload
        if (hasMedia) {
            const mediaUrl = req.body.MediaUrl0;
            const contentType = req.body.MediaContentType0;
            const fileExtension = contentType.split('/')[1];
            const fileName = `${Date.now()}.${fileExtension}`;
    
           
         
            // Downloading file from Twilio
            const response = await axios({
                method: 'get',
                url: mediaUrl,
                responseType: 'stream',
                auth:{
                    username:accountSid,
                    password:authToken
                }
            });
            const {uploadDestination,uploadURL} = await uploadToGCS(response.data.responseUrl,`uploads/${fileName}`);
            // await new Promise((resolve, reject) => {
            //     const writeStream = fs.createWriteStream(filePath);
            //     response.data.pipe(writeStream);
            //     writeStream.on('finish', resolve);
            //     writeStream.on('error', reject);
            // });

            // Store file info
            activeTransfers.set(userNumber, {
                uploadDestination,
                fileName
            });

            // Process with Gemini to get initial response
            let result = await processWithGemini(
                "File received",
                { filename: fileName },
                false
            );
            result = result.replace(/^```json\n/, '')  
            result = result.slice(0,-4);
            result = JSON.parse(result);
            twiml.message(result.message || "How would you like me to convert your file?");
        }
        // Handle conversion command
        else if (activeTransfers.has(userNumber)) {
            const fileInfo = activeTransfers.get(userNumber);
            
            // Process command with Gemini
            let result = await processWithGemini(
                userMessage,
                { filename: fileInfo.fileName },
                true
            );
            result = result.replace(/^```json\n/, '')  
            result = result.slice(0,-4);
            result = JSON.parse(result);
            if (result.type === 'conversion') {
                // Perform conversion
                // const convertDir = path.resolve(__dirname, '..', 'converted'); // Moves one level up
                // const outputPath = path.join(convertDir, outputFilename);

                const {res,signedUrl}= await convertFileGCStoGCS(`uploads/${fileInfo.fileName}`,result.targetFormat,'converted',null
                );

                const uploadFile = await uploadToTwilioMedia(userNumber,signedUrl);
                
                await client.messages.create({
                    from: `whatsapp:${WHATSAPP_NUMBER}`,
                    to: userNumber,
                    body: result.action,
                    mediaUrl: uploadFile.twilioResponse  
                });
                

                // Clean up
                activeTransfers.delete(userNumber);
                
             
            } else {
                // Send Gemini's clarification response
                twiml.message(result.message);
            }
        }
        // Pass other messages to Gemini
        else {
            let result = await processWithGemini(
                userMessage,
                'nofile.txt',
                false
            );
            result = result.replace(/^```json\n/, '')  
            result = result.slice(0,-4);
            result = JSON.parse(result);
            console.log(result);
            twiml.message(result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        twiml.message('Sorry, something went wrong. Please try again.');
        
        // Clean up on error
        if (activeTransfers.has(userNumber)) {
            const fileInfo = activeTransfers.get(userNumber);
            fs.unlinkSync(fileInfo.filePath);
            activeTransfers.delete(userNumber);
        }
    }

    res.type('text/xml').send(twiml.toString());
}


async function uploadToTwilioMedia(toNumber,signedUrl) {
    try {
      // First upload to GCS and get signed URL
   
    //  const {signedUrl,destinationPath} =await uploadToGCS(filePath,outputFilename);
      // Create form data with all required fields
      const form = new FormData();
      form.append('To', `whatsapp:${toNumber.replace('whatsapp:', '')}`);
      form.append('From', `whatsapp:${process.env.WHATSAPP_NUMBER.replace('whatsapp:', '')}`);
      form.append('Body', 'Converted File');
      form.append('MediaUrl', signedUrl);
  
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        form,
        {
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID,
            password: process.env.TWILIO_AUTH_TOKEN
          },
          headers: {
            ...form.getHeaders()
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
  
      return {
        twilioResponse: response.data,
      };
    } catch (error) {
      console.error('Error uploading media:', error.response?.data || error.message);
      throw error;
    }
  }
  
module.exports = {handleIncomingMessage};
