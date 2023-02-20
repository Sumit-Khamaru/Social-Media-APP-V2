import express from "express";
import {
  deleteProfile,
  followUser,
  forgotPassword,
  getAllUserProfile,
  getMyPosts,
  getUserProfile,
  login,
  logout,
  register,
  resetPassword,
  searchUserProfile,
  showMyProfile,
  updatePassword,
  updateProfile,
} from "../controllers/user.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot/password", forgotPassword);

router.delete("/delete/me",isAuthenticated, deleteProfile);

router.put("/update/password", isAuthenticated, updatePassword);
router.put("/update/profile", isAuthenticated, updateProfile);
router.put("/password/reset/:tokenId", resetPassword);

router.get("/search/users", isAuthenticated, searchUserProfile);
router.get("/my/posts", isAuthenticated, getMyPosts);
router.get("/logout", logout);
router.get("/follow/:userId", isAuthenticated, followUser);
router.get("/me", isAuthenticated, showMyProfile);
router.get("/user/:userId", isAuthenticated, getUserProfile);
router.get("/users", isAuthenticated, getAllUserProfile);

export default router;
