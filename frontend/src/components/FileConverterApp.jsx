import React, { useState } from 'react';
import { Upload, Send, FileText } from 'lucide-react';
import axios from 'axios';

const FileConverterApp = () => {
  const [command, setCommand] = useState('');
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file || !command) return;

    setIsLoading(true);
    const newUserMessage = {
      type: 'user',
      text: `${command}`,
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('command', command);

      const res = await axios.post(`http://localhost:8080/upload`, formData, {
        headers: {
          'Content-type': 'multipart/form-data'
        },
  
      });
      console.log(res.data.filename);
      const serverMessage = {
        type: 'server',
        text: res.data.message || 'File converted successfully!',
        fileName:res.data.filename
      };
      setMessages(prev => [...prev, serverMessage]);
    } catch (err) {
      const errorMessage = {
        type: 'server',
        text: err.response?.data?.message || 'File conversion failed. Please try again.',
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const fileMessage = {
        type: 'user',
        text: `Selected file: ${selectedFile.name}`
      };
      setMessages(prev => [...prev, fileMessage]);
    }
  };

  return (
    <div style={{
      fontFamily: 'Inter, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f4f4f7',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      {/* Chat Header */}
      <div style={{
        backgroundColor: '#171717',
        color: 'white',
        padding: '15px',
        textAlign: 'center',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px'
      }}>
        <h2 style={{ margin: 0, fontWeight: '600' }}>File Wizard</h2>
      </div>

      {/* Message Area */}
      <div style={{
        flexGrow: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            style={{
              alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              padding: '10px 15px',
              borderRadius: '12px',
              backgroundColor: msg.type === 'user' 
                ? (msg.error ? '#FFE5E5' : '#e5e5ea')
                : (msg.error ? '#FFE5E5' : '#ffffff'),
              color: msg.error ? '#d8000c' : 'black',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {msg.text}
            
            {msg.fileName && (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    marginTop: '10px',
    backgroundColor: '#f0f0f0',
    padding: '8px',
    borderRadius: '8px'
  }}>
    <FileText size={20} style={{ marginRight: '10px' }} />
    <a 
      href={`http://localhost:8080/converted/${msg.fileName}`}  // Updated href
      style={{ 
        color: '#333', 
        textDecoration: 'none',
        fontWeight: '500'
      }}
    >
      Download Converted File
    </a>
  </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '10px 15px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            Processing your request...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{
        display: 'flex',
        padding: '15px',
        backgroundColor: 'white',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px',
        gap: '10px',
        alignItems: 'center'
      }}>
        <input 
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="file-upload"
        />
        <label 
          htmlFor="file-upload" 
          style={{
            cursor: 'pointer',
            backgroundColor: '#f0f0f0',
            padding: '10px',
            borderRadius: '8px'
          }}
        >
          <Upload size={24} />
        </label>
        
        <input 
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter conversion command (e.g., convert to pdf)"
          style={{
            flexGrow: 1,
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            outline: 'none'
          }}
        />
        
        <button 
          onClick={handleSubmit}
          disabled={!file || !command || isLoading}
          style={{
            backgroundColor: (!file || !command || isLoading) ? '#cccccc' : '#171717',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '8px',
            cursor: (!file || !command || isLoading) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <Send size={20} /> Send
        </button>
      </div>
    </div>
  );
};

export default FileConverterApp;