import express from "express";
import {
    commentOnPost,
    createPost,
    deleteComment,
    deletePost,
    getAllPosts,
    getPostOfFollowing,
    likeAndUnlikePost,
    updateCaption,
} from "../controllers/post.js";
import { isAuthenticated } from "../middlewares/auth.js";


const router = express.Router();

router.get("/post/allposts", getAllPosts);
router.post("/post/upload", isAuthenticated, createPost);
router.patch("/post/:id", isAuthenticated, likeAndUnlikePost);
router.put("/post/:id", isAuthenticated, updateCaption);
router.delete("/post/:id", isAuthenticated, deletePost);
// we are getting only the posts that we followed but what i want is show the popular peoples posts in home page when user is not logged in else show the post of the following as well as the famous people posts randomly
router.get('/posts', isAuthenticated, getPostOfFollowing);

router.put('/post/comment/:id', isAuthenticated, commentOnPost);
router.delete('/post/comment/:id', isAuthenticated, deleteComment);

export default router;
