const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { convertFile } = require('./controllers/converFile.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMENI_API_KEY);
// Available tools for Gemini
const tools = {
  convertFile: async (sourceFile, targetFormat, outputPath) => {
    const formData = {
      target_format: targetFormat,
      source_file: fs.createReadStream(sourceFile)
    };
    await convertFile(formData, outputPath);
    return outputPath;
  },
  
  validateFormat: (format) => {
    const supportedFormats = ['pdf', 'png', 'jpg', 'jpeg', 'docx'];
    return supportedFormats.includes(format.toLowerCase());
  }
};

// Function to analyze command with Gemini
async function processWithGemini(command, uploadedFile, isFollowUp = false) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `You are a helpful file conversion assistant. You have these supported formats: PDF, PNG, JPG/JPEG, and DOCX.

    ${isFollowUp ? 'This is a follow-up response to your previous question.' : 'A user has uploaded a file named "' + uploadedFile.filename + '"'}
    
    The user's command is: "${command}"
    This is the name of user file - "${uploadedFile}"

    infer the file type from given file name i.e. is is pdf,png,docx,jpg, etc.
    Once you figure out the file type -- use it accordingly in your conversations.
    For example -- 1.While asking for which format to convert to , don't include the user file format in the options.
   
    Don't use file name in your conversation, just use something like - your file, given file, uploaded file, etc.

    If the target format is clear, respond with JSON:
    {
      "type": "conversion",
      "targetFormat": "format",
      "action": "description of what you'll do"
    }

    If the target format is unclear, respond with JSON:
    {
      "type": "clarification",
      "message": "your question asking for clarification about the target format"
    }

    Some examples of unclear commands includes:
    - "convert this file" (unclear format)
    - "change the format" (unclear format)
    - "make it better" (unclear format)
    i.e. basically anything where final format is not clear

    Some Example of clear commands includes:
    - "convert to pdf" (format = pdf)
    - "make it a png image" (format = png)
    - "transform into jpg" (format = jpg)
    - "to docx" (format = docx)
    -"jpeg" (format = jpeg)

    Please judge according to your own reasoning whether target format is mentioned or not.
    You don't need to know the original format of file for conversion.
    Make conversion style humorous and interesting.
    For example -- if there is a typo --> respond accordingly with clearifying question like-
    "Did you mean pdf" for "convert file to ppf"
    If jibberish is return --> respond with humour.
    

    You must not start conversion if target format is same as the format of the user's file.

    Keep more confidence on your own judgement what is target-format...stop asking clarifying 
    questions once you get to know the target format..just do the conversion then.
    
    Respond only in json string keep your reosoning to yourself..don't send it along with the JSON string.
    `;

    

    const result = await model.generateContent(prompt);

    const response = result.response.text()
    if (response.type === "conversion") {
      // Validate the format
      if (!tools.validateFormat(response.targetFormat)) {
        return {
          type: 'clarification',
          message: `I apologize, but I don't support converting to ${response.targetFormat}. I can convert to PDF, PNG, JPG/JPEG, or DOCX. Which format would you like?`
        };
      }

      // If format is valid, return conversion plan
      return {
        type: 'conversion',
        targetFormat: response.targetFormat.toLowerCase(),
        action: response.action
      };
    }

    // Return clarification request
    return response;

  } catch (error) {
    console.error('Gemini Processing Error:', error);
    return {
      type: 'error',
      message: 'I encountered an error processing your request. Could you please try rephrasing your command?'
    };
  }
}

// Express setup
const app = express();
app.use(cors());
app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage: storage });

// Main endpoint that handles both initial commands and follow-ups
app.post('/process', upload.single('file'), async (req, res) => {
  try {
    const isFollowUp = req.body.isFollowUp === 'true';
    
    // For follow-up messages, we don't require a new file upload
    if (!isFollowUp && !req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.body.command) {
      return res.status(400).json({ error: 'No command provided' });
    }
    let result = await processWithGemini(
      req.body.command, 
      req.file,
      isFollowUp
    );
       console.log(result);
      let x = result
       .replace(/^```json\n/, '')  
       x = x.slice(0,-4);
      x = JSON.parse(x);
    console.log(x);
    if (x.type === 'clarification') {
      return res.json({
        needsClarification: true,
        message: x.message
      });
    }

    if (x.type === 'error') {
      return res.status(400).json({
        error: x.message
      });
    }

    // If we have a conversion plan, execute it
    if (x.type == "conversion") {
      const sourceFile = `./uploads/${req.file.filename}`;
      const outputFilename = `${Date.now()}.${x.targetFormat}`;
      const outputPath = `./converted/${outputFilename}`;
      await tools.convertFile(sourceFile,x.targetFormat, outputPath);

      return res.json({
        message: x.action,
        filename: outputFilename,
        format: x.targetFormat
      });
    }

  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'converted', req.params.filename);
  res.download(filePath, (err) => {
    if (err) {
      res.status(500).json({ error: 'Download failed' });
    }
  });
});

app.listen(process.env.PORT || 8000, () => {
  console.log(`Server running on PORT ${process.env.PORT || 8000}`);
});