import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}
const registerUser = asyncHandler( async (req, res) => {
    console.log("this is res body",res.body)
    const {fullName, email, username, password } = req.body
    console.log("email: ", email);
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    console.log(User)
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    // console.log("this  is res.files",res.files)
    const avtaarLocalPath = req.files?.avtaar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
let coverImageLocalPath;
if(req.files  && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
coverImageLocalPath=req.files.coverImage[0].path
}

    if (!avtaarLocalPath) {
        throw new ApiError(400, "avtaar file is required")
    }
    const avtaar  = await uploadOnCloudinary(avtaarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avtaar ) {
        throw new ApiError(400, "avtaar  file is required")
    }
    const user = await User.create({
        fullName,
        avtaar : avtaar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
} )

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
    const {email, username, password} = req.body

    if (!username || !email) {
        throw new ApiError(400, "username or email is required")
    }
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    console.log("username and email",username,email)
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }
   const isPasswordValid = await user.isPasswordCorrect(password)
   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    console.log("this is user id",user._id)
    }
    console.log("this is user id",user._id)
   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)
   
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})
const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})
const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized token")
}
try{
    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )
    
    const user = await User.findById(decodedToken?._id)
    
    if (!user) {
        throw new ApiError(401, "Invalid refresh token")
    }
    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used")
        
    }
    const options = {
        httpOnly: true,
        secure: true
    }
    
    const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {accessToken, refreshToken: newRefreshToken},
            "Access token refreshed"
        )
    )
}
catch(error){
    throw new ApiError(401, error?.message || "Invalid refresh token")
}

})
const changeCurrentPassword=asyncHandler(async()=>{
    const {oldPassword,newPassword}=req.body
 const user= await User.findById( req.user?._id)
const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid password")
}
user.password=newPassword
await user.save({validateBeforeSave:false})
return res.status(200)
.json(new ApiResponse(200,{},"Password changed successfully"))
})
const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(200,req.user,"current user fetched successfully")
})
const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body
    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }
 const user=  User?.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            fullName,
            email
        }
    }
    ,{new :true}
   ).select
   return res.status(200).json(new ApiError(200,user,"account details updated details"))
})
const updateAvtaar=asyncHandler(async(req,res)=>{
const avtaarLocalPath=req.file?.path
if(!avtaarLocalPath){
    throw new ApiError(400,"Avtaar file is missing")
}
const avtaar=await uploadOnCloudinary(avtaarLocalPath)
if(!avtaar.url){
    throw new ApiError(400,"Error while uploading on cloudinary on Avtaar")
}
 const user=await  User.findByIdAndUpdate(
    req._user?._id,
{
    $set:{
        avtaar:avtaar.url
    }
},
{new:true}
).select("-password")
return res .status(200)
    .json(
        new ApiResponse(200,user,"CoverImage updated Successfully")
    )
})

const updateCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"coverImage file is missing")
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading on cloudinary on coverImage")
    }
    const user=await  User.findByIdAndUpdate(
        req._user?._id,
    {
        $set:{
            coverImage:coverImage.url
        }
    },
    {new:true}
    ).select("-password")
    return res .status(200)
    .json(
        new ApiResponse(200,user,"coverImage updated Successfully")
    )
    })
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword
    ,updateAccountDetails,
    updateAvtaar,
    updateCoverImage
}