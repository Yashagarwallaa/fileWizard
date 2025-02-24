const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {processWithGemini} = require('./controllers/gemeniController.js')
const {tools} = require('./tools/tools.js')
const {handleIncomingMessage} = require('./controllers/whatsapp.js')

const app = express();
app.use(cors());
app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage: storage });


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
 
      let x = result.replace(/^```json\n/, '')  
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


app.post('/webhook', express.urlencoded({ extended: true }), handleIncomingMessage);


app.listen(process.env.PORT || 8000, () => {
  console.log(`Server running on PORT ${process.env.PORT || 8000}`);
});