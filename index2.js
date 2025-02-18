const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCEh1o4_qZFfhfpI_80eHE7q5zxZOQNOeU");
async function run(){
const model = genAI.getGenerativeModel({ model: "gemini-pro"});

const prompt = "Explain how AI works";

const result = await model.generateContent(prompt);
const response = await result.response;
const text = await response.text();
console.log(text);
}
run();