import React, { useState, useRef, useEffect } from 'react';
import { Upload, Send, FileText, Bot } from 'lucide-react';
import axios from 'axios';


const FileConverterApp = () => {
  const [command, setCommand] = useState('');
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [originalFilename, setOriginalFilename] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (isFollowUp = false) => {
    if ((!file && !isFollowUp) || !command) return;
    
    const currentCommand = command;
    setCommand('');
    setIsLoading(true);
    
    const newUserMessage = {
      type: 'user',
      text: currentCommand,
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const formData = new FormData();
      if (!isFollowUp) {
        formData.append('file', file);
        setOriginalFilename(file.name);
      } else {
        formData.append('file', file);
      }
      formData.append('command', currentCommand);
      formData.append('isFollowUp', isFollowUp);
      
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/process`, formData, {
        headers: {
          'Content-type': 'multipart/form-data'
        },
      });

      if (res.data.needsClarification) {
        const clarificationMessage = {
          type: 'bot',
          text: res.data.message
        };
        setMessages(prev => [...prev, clarificationMessage]);
      } else {
        const serverMessage = {
          type: 'bot',
          text: `${res.data.message}`,
          fileURL: res.data.signedURL
        };
        console.log(serverMessage.fileURL);
        setMessages(prev => [...prev, serverMessage]);
        setFile(null);
        setOriginalFilename(null);
      }
      
    } catch (err) {
      const errorMessage = {
        type: 'bot',
        text: err.response?.data?.error || 
              err.response?.data?.details || 
              'I encountered an error processing your request. Please try again.',
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const fileMessage = {
        type: 'bot',
        text: `Great! You've uploaded "${selectedFile.name}". How would you like me to convert it?`
      };
      setMessages(prev => [...prev, fileMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(!!originalFilename);
    }
  };

  return (
    <div className="converter-container" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        {/* <Bot size={24} color="white" /> */}
        <div>
          <h2 style={styles.headerTitle}>FileWizard - File Conversion Assistant</h2>
        <a 
          href="http://wa.me/+14155238886?text=join%20pony-machine" 
          target="_blank" 
          rel="noopener noreferrer"
          style={styles.whatsappLink}
        >
          
          <p>Open in WhatsApp</p>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-whatsapp" viewBox="0 0 16 16">
  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
</svg>
          </a>
        </div>
      </div>

      {/* Messages Area */}
      <div style={styles.messagesArea}>
        {messages.length === 0 ? (
          <WelcomeMessage />
        ) : (
          messages.map((msg, index) => (
            <MessageBubble key={index} message={msg} />
          ))
        )}
        
        {isLoading && (
          <div style={styles.loadingBubble}>
            <div style={styles.loadingContent}>
              <Bot size={16} />
              <span>Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        {!originalFilename && (
          <>
            <input 
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label 
              htmlFor="file-upload" 
              style={styles.uploadButton}
            >
              <Upload size={24} color={file ? '#00a67e' : '#666'} />
            </label>
          </>
        )}
        
        <input 
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={file ? "How would you like to convert your file?" : "Upload a file to get started..."}
          style={styles.textInput}
        />
        
        <button 
          onClick={() => handleSubmit(!!originalFilename)}
          disabled={(!file && !originalFilename) || !command || isLoading}
          style={{
            ...styles.sendButton,
            backgroundColor: ((!file && !originalFilename) || !command || isLoading) ? '#cccccc' : '#171717',
            cursor: ((!file && !originalFilename) || !command || isLoading) ? 'not-allowed' : 'pointer',
          }}
        >
          <Send size={20} color="white" />
        </button>
      </div>
    </div>
  );
};

// components/MessageBubble.js
const MessageBubble = ({ message }) => {
  return (
    <div style={{
      ...styles.messageBubble,
      alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
      backgroundColor: message.type === 'user' 
        ? '#171717'
        : (message.error ? '#FFE5E5' : '#ffffff'),
      color: message.type === 'user' ? 'white' : (message.error ? '#d8000c' : 'black'),
    }}>
      {message.type === 'bot' && (
        <div style={styles.botIdentifier}>
          <Bot size={16} />
          <span>FileWizard</span>
        </div>
      )}
      
      {message.text}
      {message.fileURL && (
        <div style={styles.downloadButton}>
          <FileText size={20} style={{ marginRight: '10px' }} />
          <a 
            href={`${message.fileURL}`}
            style={styles.downloadLink}
            download
            target='_blank'
            rel='noopener noreferer'
          >
            Download Converted File
          </a>
        </div>
      )}
    </div>
  );
};

// components/WelcomeMessage.js
const WelcomeMessage = () => {
  return (
    <div style={styles.welcomeMessage}>
      <div style={styles.welcomeHeader}>
        <Bot size={20} />
        <span style={{ fontWeight: '500' }}>FileWizard</span>
      </div>
      <p style={{ margin: '0 0 10px' }}>
        Hi! I'm your file conversion assistant. Upload a file and tell me how you'd like to convert it.
      </p>
     <p style={{ margin: '0 0 10px',  fontWeight:'bold'}}>Upload max limit is 1 MB per file</p> 

      <p style={{ margin: '0 0 5px' }}>I support converting to:</p>
      <ul style={{ margin: '0', paddingLeft: '20px' }}>
        <li>PDF documents</li>
        <li>PNG images</li>
        <li>JPG/JPEG images</li>
        <li>Word documents (DOCX)</li>
      </ul>
    </div>
  );
};

// Styles object
const styles = {
  container: {
    fontFamily: "'Lexend Deca', sans-serif",
    maxWidth: '600px',
    margin: '2rem auto 0 auto',
    height: '90vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f4f4f7',
    borderRadius: '12px',
boxShadow: '4px 6px 4px rgba(0, 0, 0, 1), 0 1px 2px rgba(255, 255, 255, 0.07)',
    overflow: 'hidden'
  },
  header: {
    backgroundColor: '#171717',
    color: 'white',
    padding: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  headerTitle: {
    margin: 0,
    fontWeight: '600'
  },
  headerSubtitle: {
    margin: '5px 0 0',
    fontSize: '0.9em',
    opacity: 0.8
  },
  whatsappLink: {
    color: '#25D366',
    cursor:'pointer',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight:'bold',
  },
  messagesArea: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  messageBubble: {
    maxWidth: '80%',
    padding: '12px 15px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  botIdentifier: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '5px',
    color: '#666',
    fontSize: '0.9em'
  },
  downloadButton: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '10px',
    backgroundColor: '#f0f0f0',
    padding: '8px',
    borderRadius: '8px'
  },
  downloadLink: {
    color: '#333',
    textDecoration: 'none',
    fontWeight: '500'
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    padding: '12px 15px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  loadingContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#666'
  },
  inputArea: {
    display: 'flex',
    padding: '15px',
    backgroundColor: 'white',
    gap: '10px',
    alignItems: 'center',
    borderTop: '1px solid #e0e0e0'
  },
  uploadButton: {
    cursor: 'pointer',
    backgroundColor: '#f0f0f0',
    padding: '10px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center'
  },
  textInput: {
    flexGrow: 1,
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    outline: 'none',
    fontSize: '15px'
  },
  sendButton: {
    border: 'none',
    padding: '10px 15px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'all 0.2s ease'
  },
  welcomeMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '12px',
    maxWidth: '80%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  welcomeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px'
  }
};

export default FileConverterApp;