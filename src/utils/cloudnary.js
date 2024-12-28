import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLODINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadOnCloudinary= async (localFilePath)=>{
        try{
if(!localFilePath)return null
//upload the file.
 const response= await cloudinary.uploader.upload(localFilePath,{
    resource_type:"auto"
})

//file has been uploaded successfully
console.log("file is uploaded on cloudinary",response.url)
console.log("this is response",response)
fs.unlinkSync(localFilePath)
return response;
        }
        catch(error){
fs.unlinkSync(localFilePath)//remove the locally saved temporary file as operation got failed
        }
    }
    
  export {uploadOnCloudinary}