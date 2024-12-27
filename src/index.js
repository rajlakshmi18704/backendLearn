import dotenv from "dotenv"
// import mongoose from "mongoose";
// import {DB_NAME} from "./constants";
import connectDB from "./db/index.js";
import {app} from './app.js'

dotenv.config({
    path :'./env'
})

connectDB()


.then(()=>{
    app.on("error",(error)=>{
        console.log("ERROR",error)
        throw error
    })
    app.listen(process.env.pory  ||8000,()=>{
        console.log(`Server is Running at port :${process.env.port}`)
    })
}).catch(
    (err)=>{
        console.log(("MONGO db connection failedd!!",err))
    }
)
/*
import express from "express"
const app=express()
(async ()=>{
try{
await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
app.on("error",()=>{
    console.log("ERROR",error)
    throw error
})
app.listen(process.env.PORT,()=>{
    console.log(`App is listening on port ${process.env.PORT}`)
})
}
catch (error){
console.log("ERROR",error)
throw error
}
})()*/
