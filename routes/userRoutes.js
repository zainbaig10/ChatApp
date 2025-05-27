import express from "express";
import {
  triggerOtp,
  verifyOtp,
  registerUser,
  deleteUser,
  updateUser,
  countOfUser,
  updateFcmToken,
  loginUser,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/otp/trigger/:phone", triggerOtp);
userRouter.post("/otp/verify", verifyOtp);
userRouter.post("/register", registerUser);
userRouter.post("/loginUser", loginUser);
userRouter.patch("/update/:id", updateUser);
userRouter.delete("/delete/:id", deleteUser);
userRouter.get("/countOfUser", countOfUser);

//FCM
userRouter.route("/updateFcm").post(updateFcmToken);

export default userRouter;
