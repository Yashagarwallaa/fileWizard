const { convertFile } = require('../controllers/converFile.js');

const tools = {
  // convertFile: async (sourceFile, targetFormat, outputPath) => {
  //   const formData = {
  //     target_format: targetFormat,
  //     source_file: fs.createReadStream(sourceFile)
  //   };
  //   await convertFile(formData, outputPath);
  //   return outputPath;
  // },
  
  validateFormat: (format) => {
    const supportedFormats = ['pdf', 'png', 'jpg', 'jpeg', 'docx'];
    return supportedFormats.includes(format.toLowerCase());
  }
};

module.exports = {tools}