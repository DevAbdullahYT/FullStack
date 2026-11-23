
import DBconnect from "@/lib/dbConnect";
import userModel from "@/models/user.model";
import bcrypt from "bcrypt";
import { sendVerificationEmail } from "@/helper/sendVerificationEmail";
import { randomInt } from "crypto";

export async function POST(request: Request) {
  try {
    // 1. Connect to database
    await DBconnect();

    // 2. Get user data
    const { username, email, password } = await request.json();

    // 3. Validate that all required fields are provided
    if (!username || !email || !password) {
      return Response.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    // 4. Check if a verified user with the same username already exists
    const existingUserVerifiedByUsername = await userModel.findOne({
      username,
      isVerified: true,
    });

    if (existingUserVerifiedByUsername) {
      return Response.json(
        {
          success: false,
          message: "Username is already taken",
        },
        { status: 400 }
      );
    }

    // 5. Generate a verification code and expiry date
    const verifyCode = randomInt(100000, 1000000).toString();

    const expiryDate = new Date(Date.now() + 60 * 60 * 1000);

    // 6. Check if a user with the same email already exists
    const existingUserVerifiedByEmail = await userModel.findOne({ email });

    if (existingUserVerifiedByEmail) {

      // 7. If the existing user is verified, return an error
      if (existingUserVerifiedByEmail.isVerified) {
        return Response.json(
          {
            success: false,
            message: "User with this email already exists",
          },
          { status: 400 }
        );
      }

      // 8. If the user is not verified, update their information
      const hashedPassword = await bcrypt.hash(password, 10);

      existingUserVerifiedByEmail.username = username;
      existingUserVerifiedByEmail.password = hashedPassword;
      existingUserVerifiedByEmail.verifyCode = verifyCode;
      existingUserVerifiedByEmail.verifyCodeExpiry = expiryDate;

      await existingUserVerifiedByEmail.save();

      // 9. Send a new verification email
      const emailResponse = await sendVerificationEmail(
        email,
        username,
        verifyCode
      );

      if (!emailResponse.success) {
        return Response.json(
          {
            success: false,
            message: emailResponse.message,
          },
          { status: 500 }
        );
      }

      return Response.json(
        {
          success: true,
          message: "New verification code sent. Please verify your account.",
        },
        { status: 200 }
      );
    }

    // 10. Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 11. Create a new user
    const newUser = new userModel({
      username,
      email,
      password: hashedPassword,
      verifyCode,
      verifyCodeExpiry: expiryDate,
      isVerified: false,
      isAcceptingMessages: true,
      messages: [],
    });

    // 12. Save the new user in the database
    await newUser.save();

    // 13. Send verification email
    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );

    if (!emailResponse.success) {
      return Response.json(
        {
          success: false,
          message: emailResponse.message,
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "User registered successfully. Please verify your account.",
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error registering user:", error);

    return Response.json(
      {
        success: false,
        message: "Error registering user",
      },
      { status: 500 }
    );
  }
}
