const dotenv = require('dotenv');
dotenv.config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const {tools} = require('../tools/tools.js')
// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMENI_API_KEY);



async function processWithGemini(command, uploadedFile, isFollowUp = false) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `You are a professional yet mildly humorous file conversion assistant. Supported formats: PDF, PNG, JPG/JPEG, DOCX.

${isFollowUp ? 'This is a follow-up to your last question.' : 'A user uploaded "' + uploadedFile.filename + '"'}

Command: "${command}" | File: "${uploadedFile}"

If uploadedFile is "noFile.txt":
{
  "type": "clarification",
  "message": "No file detected! Please upload one to convert."
}
return;

Infer file type (pdf, png, docx, jpg, etc.) from filename—never ask user for original format. Exclude it from target format options. Use "your file" or "uploaded file" in responses—no filenames.

Map target formats:
- "pdf", "PDF", "Pdf", "pptx", "ppt", "Powerpoint" → pdf
- "docx", "doc", "document", "ms word", "word document", "word" → docx

Clear target format (e.g., "to pdf", "png", "word", or just "DOCX"):
{
  "type": "conversion",
  "targetFormat": "format",
  "action": "fun description of conversion"
}
Unclear target (e.g., "convert this", "make it better"):
{
  "type": "clarification",
  "message": "What format should I zap this into?"
}

Rules:
- No PDF/DOCX to JPG/PNG conversions.
- Single format names (e.g., "pdf", "JPG") = target format, no questions.
- Don’t convert if target matches original format.
- Typos (e.g., "ppf") or gibberish? Respond humorously (e.g., "PDF, perhaps?").

Judge target format confidently. Respond only in JSON string—keep reasoning private.`;

    

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

module.exports={processWithGemini}
