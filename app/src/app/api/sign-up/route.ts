import DBconnect from "@/lib/dbConnect";
import userModel from "@/models/user.model";
import bcrypt from "bcrypt"
import { sendVerificationEmail } from "@/helper/sendVerificationEmail";

export async function POST(request: Request) {
    //1:connect to db 
    await DBconnect()
    try {
        //2:get user data
        const {username,email,password} = await request.json()
        //3:validate user data exists
        if(!username || !email || !password) {
            return Response.json({
                success:false,
                message:"all fields ar erequired",
            },
        {status:400})
        }
        //4:check if user with same email already exits
        const existingUser = await userModel.findOne({
            email: email.toLowerCase().trim()
        })
        if(existingUser){
            return Response.json({
                success:false,
                message:"User is already signed up",
            },{status:400})
        }
        //5:Hash password
        const hashedPassword = await bcrypt.hash(password,10)
        //6: Generate verification code
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString()
        //7: Create User
        const newUser = await userModel.create({
            username,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            verifyCode,
            verifyCodeExpiry: new Date(Date.now() + 3600000), // 1 hour
        })
        //8:Send verification email
        await sendVerificationEmail(email, username, verifyCode)

        //8:Return successful response

        return Response.json({
            success:true,
            message:"User registered successfuly",
            userId:newUser._id
},{status:201})

    } catch (error) {
        console.error("Error while signing up user")
        return Response.json( 
            {
                success:false,
                message:"Error signing user"
            },
            {
                status:500
            }
        )
        
    }
}