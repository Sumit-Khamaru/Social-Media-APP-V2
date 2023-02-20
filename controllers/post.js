import Post from '../model/post.js';
import User from '../model/user.js';
import cloudinary from 'cloudinary';
export const createPost = async (req, res) => {
    try {

        const myCloud = await cloudinary.v2.uploader.upload(req.body.image, {
            folder: 'mernSocialPosts',
        })
        const newPostData = {
            caption: req.body.caption,
            image: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            },
            owner: req.user._id,
        };
        // mongodb create id for every object
        const post = await Post.create(newPostData);


        const user = await User.findById(req.user._id);
        // we push that id to user so that we can verify that user made that post
        user.post.unshift(post._id);

        await user.save();
        res.status(201).json({
            success: true,
            message: "Post Created !"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// Delete Post
export const deletePost = async (req, res) => {
    try {

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }
        // means the user who create the post can delete the post
        if (post.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        await cloudinary.v2.uploader.destroy(post.image.public_id);
        await post.remove();
        // we have to remove the post from user array also
        const user = await User.findById(req.user._id);

        const index = user.post.indexOf(req.params.id);
        user.post.splice(index, 1);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Post deleted"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// Like and Unlike post
export const likeAndUnlikePost = async (req, res) => {
    try {

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }



        if (post.likes.includes(req.user._id)) {
            const index = post.likes.indexOf(req.user._id);
            // delete the post
            post.likes.splice(index, 1);
            await post.save();

            return res.status(200).json({
                success: true,
                message: "Post Unliked",
            });
        }

        else {
            post.likes.push(req.user._id);
            await post.save();


            return res.status(200).json({
                success: true,
                message: "Post Liked",
            });
        }


    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// we can see the post of the users which we are following
export const getPostOfFollowing = async (req, res) => {
    try {
        // which user we following we just take the post of that user
        const user = await User.findById(req.user._id);
        // the user can follow many users and they can have many post. so, we use $in take the ids from the arrays and find the post made by them then add it to post[which will be an array]
        const posts = await Post.find({
            owner: {
                $in: user.following,
            }
        }).populate("owner likes comments.user")

        res.status(200).json({
            success: true,
            posts: posts.reverse(),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Caption
export const updateCaption = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        if (post.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        post.caption = req.body.caption;

        await post.save();

        res.status(200).json({
            success: true,
            message: "Post Updated"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Comment

export const commentOnPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        let commentIndex = -1;

        // Checking if comment already exists

        post.comments.forEach((item, index) => {
            if (item.user.toString() === req.user._id.toString()) {
                commentIndex = index;
            }
        });

        if (commentIndex !== -1) {
            post.comments[commentIndex].comment = req.body.comment;

            await post.save();

            return res.status(200).json({
                success: true,
                message: "Comment Updated",
            });
        } else {
            post.comments.push({
                user: req.user._id,
                comment: req.body.comment,
            });

            await post.save();
            return res.status(200).json({
                success: true,
                message: "Comment added",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// delete Comment : the post-owner can delete the comment or the comment maker can delete the comment
export const deleteComment = async (req, res) => {

    try {

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        if (post.owner.toString() === req.user._id.toString()) {

            if (req.body.commentId === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Comment Id id required!"
                });
            }

            post.comments.forEach((item, index) => {
                if (item._id.toString() === req.body.commentId.toString()) {
                    return post.comments.splice(index, 1);
                }
            });

            await post.save();
            return res.status(200).json({
                success: true,
                message: "You deleted comment on your post"
            });
        }
        else {
            post.comments.forEach((item, index) => {
                if (item.user.toString() === req.user._id.toString()) {
                    return post.comments.splice(index, 1);
                }
            });

            await post.save();
            return res.status(200).json({
                success: true,
                message: "Your Comment deleted!"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().populate("owner likes comments.user");
        res.status(200).json({
            success: true,
            message: "Posts retrieved successfully.",
            posts
        });


    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}