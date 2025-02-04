import { useState } from 'react'

import './App.css'
import axios from 'axios';
import FileConverterApp from './components/FileConverterApp';



function App() {
//  const[command,setCommand] = useState('');
//   const[file,setFile] = useState(null);

//   const handleSubmit= async()=>{
//         try{
//           const formdata = new FormData();
//           formdata.append('file',file);
//           console.log(command);
//           formdata.append('command',command);
//            const res = await axios.post(`http://localhost:8080/upload`,formdata,{
//               headers:{
//                 'Content-type':'multipart/form-data'
//               }
//            });
//             console.log(res.data);
//            console.log("File sent to server!!");
//         }catch(err){
//            console.log(err,"File not uploaded!!");
//         }
//   }

  return (
    <>
      {/* <div>
        <input type='text'
        value={command}
         onChange={(e)=>{
          setCommand(e.target.value)
        }}
        placeholder='Enter your command'
        ></input>
        <input  type = "file"  onChange={(e)=>{
          setFile(e.target.files[0])
        }} />
            <button type='submit' onClick={handleSubmit} disabled={!file}>Upload File</button>
        
        
    
      </div> */}
      <FileConverterApp/>
    </>
  )
}

export default App
