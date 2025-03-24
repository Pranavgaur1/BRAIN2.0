import express from "express";
import{ LinkModel,ContentModel,UserModel} from "./db.js"
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import { JWT_PASSWORD } from "./config.js";
import { userMiddleware } from "./middleware.js";
import { random } from "./utils.js";


const app=express();
app.use(express.json()); 

app.post("/api/v1/signup",async (req,res)=>{
    const username=req.body.username;
    const password=req.body.password;

    try{
        await UserModel.create({
            username:username,
            password:password

        })
        res.json({
            message:"user signed up"
        })
    }
    catch(e){
        res.status(411).json({
            message:"user already exists"
        })
    }
})

app.post("api/v1/signin", async (req,res)=>{
    const username=req.body.username;
    const password=req.body.password;

    const existingUser=await UserModel.findOne({
        username,
        password
    })

    if(existingUser){
        const token=jwt.sign({
            id: existingUser._id
        
        },JWT_PASSWORD)

        res.json({
            token
        })
    }
    else{
        res.status(403).json({
            message:"incorrect credentials"
        })
    }

})
app.post("api/v1/content", userMiddleware, async (req,res)=>{

    const link=req.body.link;

    const type=req.body.type;

    await ContentModel.create({
        link,
        type,
        //@ts-ignore
        userID:req.userID,
        tags:[]

    })

    res.json({
        message:"content added",
    })

})

app.get("/api/v1/content",userMiddleware,async (req,res)=>{
    //@ts-ignore
    const userId = req.userId;  // User ID is fetched from middleware
    // Fetch all content associated with the user ID and populate username
    // The `populate` function is used to include additional details from the referenced `userId`.
    // For example, it will fetch the username linked to the userId.
    // Since we specified "username", only the username will be included in the result, 
    // and other details like password won’t be fetched.
    const content = await ContentModel.find({ userId: userId }).populate("userId", "username");
    res.json(content);
})

app.post("/api/v1/brain/share",async (req,res)=>{
    const { share } = req.body;
    if (share) {
        // Check if a link already exists for the user.
        //@ts-ignore
        const existingLink = await LinkModel.findOne({ userId: req.userId });
        if (existingLink) {
            res.json({ hash: existingLink.hash }); // Send existing hash if found.
            return;
        }

        // Generate a new hash for the shareable link.
        const hash = random(10);
        //@ts-ignore
        await LinkModel.create({ userId: req.userId, hash });
        res.json({ hash }); // Send new hash in the response.
    } else {
        // Remove the shareable link if share is false.
        //@ts-ignore
        await LinkModel.deleteOne({ userId: req.userId });
        res.json({ message: "Removed link" }); // Send success response.
    }


})
app.post("/api/v1/share",(req,res)=>{

})

app.listen(3000);