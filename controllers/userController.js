import User from "../schema/userSchema.js";
import asyncHandler from "express-async-handler";
import { handleErrorResponse } from "../utils/responseHandlers.js";
import { sendSms } from "../utils/smsSender.js";

export const triggerOtp = asyncHandler(async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    let user = await User.findOne({ phone });

    const otp = Math.floor(1000 + Math.random() * 9000);

    if (user) {
      user.otp = otp;
      await user.save();
    } else {
      user = new User({
        phone,
        otp,
        // Do NOT set email or businessPhone as null
        // Only required fields
      });
      await user.save();
    }

    const message = `Your Login OTP for verification is: ${otp}. OTP is confidential, refrain from sharing it with anyone. By Edumarc Technologies`;
    await sendSms(phone, message);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      user,
    });
  } catch (error) {
    handleErrorResponse(res, error);
  }
});

export const verifyOtp = asyncHandler(async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.otp !== parseInt(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      user,
    });
  } catch (error) {
    handleErrorResponse(res, error);
  }
});

export const registerUser = asyncHandler(async (req, res) => {
  try {
    const { username, phone, email, password, profilePic } = req.body;

    if (!username || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, phone, and password are required",
      });
    }

    // Check if phone is already registered
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Phone number is already registered",
      });
    }

    // Check if email is already registered (optional)
    if (email && (await User.findOne({ email }))) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const user = await User.create({
      username,
      phone,
      email,
      password,
      profilePic,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong during registration",
    });
  }
});

export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, msg: "Invalid email" });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, msg: "Invalid password" });
    }

    // Respond with user details (no token)
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return handleErrorResponse(res, error, "Error during login");
  }
});

export const updateUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phone, profilePic, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check for duplicate phone
    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: "Phone number is already in use",
        });
      }
      user.phone = phone;
    }

    // Check for duplicate email
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use",
        });
      }
      user.email = email;
    }

    if (username) user.username = username;
    if (profilePic) user.profilePic = profilePic;

    // Update password if provided
    if (password) {
      user.password = password; // Will be hashed by schema pre-save hook
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while updating user",
    });
  }
});

export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    await user.remove();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    handleErrorResponse(res, error);
  }
});

export const countOfUser = asyncHandler(async (req, res) => {
  try {
    const count = await User.countDocuments({ role: "USER" });
    return res.status(200).json({
      success: true,
      message: "Count of users found successfully",
      count,
    });
  } catch (error) {
    handleErrorResponse(res, error);
  }
});

export const updateFcmToken = asyncHandler(async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;

    const userDoc = await User.findById(userId);
    if (!userDoc) {
      console.log("User id not found :" + userId);
      return res.status(404).json({
        success: false,
        msg: "User id not found :" + userId,
      });
    }
    userDoc.fcmToken = fcmToken;
    await userDoc.save();

    return res.status(200).json({
      success: true,
      msg: "FCM token updated",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error,
    });
  }
});
