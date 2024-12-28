



import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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
        throw new ApiError(400, "Avatar file is required")
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
export {registerUser}
