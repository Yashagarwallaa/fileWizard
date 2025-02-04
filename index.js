const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
// const dotenv = require('dotenv');
const {convertFile} = require('./controllers/converFile.js')
const multer = require('multer');
const path = require('path');
const fs = require('fs');
apiKey = process.env.APIKEY;
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

const PORT = process.env.PORT || 8000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/') // files will be saved in uploads folder
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)) // Add timestamp to filename
    }
  });

const upload = multer({ storage: storage });

let formData = {
    target_format: 'pdf',
    source_file: ''
};
let x='';
app.post('/upload',upload.single('file'),async (req,res)=>{
    try{
      if(!req.file){
        return res.status(400).send('No file uploaded');
      }
     x = req.file.filename;
     const message = req.body.command;
     let y='';
     for( let i=0;i<x.length;i++){
        if(x[i]=='.')break;
        y+=x[i];
     }
   
     formData.source_file = fs.createReadStream(`./uploads/${x}`);
const localFilename = `./converted/${y}.${formData.target_format}`

await convertFile(formData,localFilename);


console.log(`File converted to ${formData.target_format} format`);

res.json({
    message : `File converted to ${formData.target_format} format`,
    filename: `${y}.${formData.target_format}`
})
 
    }catch(err){
       res.status(500).send(err);
    }
})

app.get('/converted/:filename',(req,res)=>{
     const fileName = req.params.filename;
     const filePath = path.join(__dirname,'converted',fileName);
     res.download(filePath,(err)=>{
        if(err){
            res.status(500).json({
                message:'Could not download file'
            })
        }
     })
})

app.listen(PORT,(req,res)=>{
    console.log(`Server running on PORT ${PORT}`);
})


