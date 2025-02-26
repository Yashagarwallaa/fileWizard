const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { processWithGemini } = require("./controllers/gemeniController.js");
const { tools } = require("./tools/tools.js");
const { handleIncomingMessage } = require("./controllers/whatsapp.js");
const { convertFileGCStoGCS } = require("./controllers/converFile.js");
const { uploadToGCS, uploadToGCSFile } = require("./controllers/gcp_file_handling.js");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Using OS temp directory
const tempDir = os.tmpdir();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir), 
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage: storage });

app.post("/process", upload.single("file"), async (req, res) => {
  try {
    const isFollowUp = req.body.isFollowUp === "true";
    
    if (!isFollowUp && !req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    if (!req.body.command) {
      return res.status(400).json({ error: "No command provided" });
    }
    
    console.log("✅ File stored at:", req.file.path);
    
    // Process file
    let result = await processWithGemini(req.body.command, req.file, isFollowUp);
    
    let x = result.replace(/^```json\n/, "").slice(0, -4);
    x = JSON.parse(x);
    console.log(x);
    
    if (x.type === "clarification") {
      return res.json({
        needsClarification: true,
        message: x.message,
      });
    }
    
    if (x.type === "error") {
      return res.status(400).json({ error: x.message });
    }
    
    // If conversion is needed
    if (x.type == "conversion") {
      const sourceFile = req.file.path;
      const destFolder = `converted`;
      const souceFileName = path.basename(sourceFile);
      const {destinationFile, signedUrlupload} = await uploadToGCSFile(sourceFile, `uploads/${souceFileName}`);
      
      const {result, signedUrl} = await convertFileGCStoGCS(destinationFile, x.targetFormat, destFolder, sourceFile);
   
    
      return res.json({
        message: x.action,
        format: x.targetFormat,
        signedURL: signedUrl 
      });
    }
  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.post('/webhook', express.urlencoded({ extended: true }), handleIncomingMessage);

app.listen(process.env.PORT || 8000, () => {
  console.log(`✅ Server running on PORT ${process.env.PORT || 8000}`);
});