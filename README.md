# FileWizard

FileWizard is a powerful file conversion tool that allows users to seamlessly convert files via WhatsApp or a web interface.

## Try It Out

You can experience FileWizard using the following methods:
- **WhatsApp**: [Click here](https://api.whatsapp.com/send/?phone=%2B14155238886&text=join+pony-machine&type=phone_number&app_absent=0) to try it out.
- **Web Version**: [Visit FileWizard](https://file-wizard-taupe.vercel.app/).

## Installation Guide

### Setting Up the Frontend
1. Navigate to the frontend directory:
   
sh
   cd frontend

2. Initialize the project:
   
sh
   npm init

3. Set up the following environment variable in a .env file:
   
sh
   VITE_BACKEND_URL = http://localhost:<your-port-number>

4. Start the development server:
   
sh
   npm run dev


### Setting Up the Backend
1. Navigate to the server directory:
   
sh
   cd server

2. Initialize the project:
   
sh
   npm init


### Environment Variables Setup
Before launching the project, set up the following environment variables in a .env file:

#### API Keys
- APIKEY: Zamzar API key for file conversion
- GEMENI_AUTH_KEY: Available for free

#### Server Configuration
- PORT: Define your backend port

#### Twilio (For WhatsApp Integration)
To enable WhatsApp messaging, you need a Twilio account and the following credentials:
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- WHATSAPP_NUMBER: Provided by Twilio to join the WhatsApp Sandbox

#### Google Cloud Storage (For File Storage)
Set up a project in **Google Cloud Platform (GCP)** and retrieve the following credentials:
- GOOGLE_CLOUD_PROJECT_ID
- GOOGLE_CLOUD_KEYFILENAME: JSON file containing authentication keys
- GOOGLE_CLOUD_BUCKET_NAME: Cloud Storage bucket name

## Twilio Webhook Configuration
To integrate Twilio messaging with your server, you need to expose your local server to the internet. You can do this by deploying the server on **Google Cloud App Engine** or using **ngrok** for a simpler setup:

### Using Ngrok
1. Run ngrok to expose your backend server:
   
sh
   ngrok http <your-port-number>

2. Copy the generated ngrok URL.
3. Go to **Twilio Dashboard**:
   - Navigate to **Messaging** > **Send a WhatsApp Message**.
   - Open **Sandbox Settings**.
   - In the **When a message comes in** field, add your ngrok URL followed by /webhook, and select the **POST** method.

Now you are all set! 🎉 FileWizard is ready to use.
