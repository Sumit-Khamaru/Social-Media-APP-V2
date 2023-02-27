import User from "../model/user.js";
import Post from "../model/post.js";
import { sendEmail } from "../middlewares/sendEmail.js";
import crypto from "crypto";
import cloudinary from 'cloudinary';
export const register = async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;
    let user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User alreay exsists" });
    }
    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: 'avatar'
    })
    user = await User.create({
      name,
      email,
      password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    });

    const token = await user.generateToken();
    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "none",
      secure: true
    };
    res.status(201).cookie("token", token, options).json({
      success: true,
      user,
      token,

    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // if(!email || !password) {
    //     return res.status(400).json({
    //         success: false,
    //         message: "Email & Password Field is Required!!!"
    //     })
    // }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User does not exists",
      });
    }
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }
    // we use jsonwebtoken to generate token, till the time user is logged in the token stores in users cookies
    // How we know that the user is logged in for that we use jsonWebToken
    const token = await user.generateToken();
    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "none",
      secure: true,
    };
    res.cookie("token", token, options);
    return res.status(201).cookie("token", token, options).json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout
export const logout = (req, res) => {
  const options = {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: "none",
    secure: true
  };
  try {
    res.status(200).cookie("token", null, options).json({
      success: true,
      message: "Logged Out",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update password
export const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+password");

    const { oldPassword, newPassword } = req.body;
    // if user doen't input any-thing
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide old and new password",
      });
    }

    const isMatch = await user.matchPassword(oldPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Old Password",
      });
    }
    // we don't have to hash the new password cause when the password is updated it hashby pre defined in the models.user
    (user.password = newPassword), await user.save();

    res.status(200).json({
      success: true,
      message: "Password updates",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update profile\
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, email, avatar } = req.body;
    if (name) {
      user.name = name;
    }

    if (email) {
      user.email = email;
    }


    if (avatar) {
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);

      const myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: 'avatar'
      });

      user.avatar.public_id = myCloud.public_id;
      user.avatar.url = myCloud.secure_url;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile Updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = user.post;
    const followers = user.followers;
    const following = user.following;
    const userId = user._id;
    // Logout user after deleting the profile casue the user doen't exists

    await user.remove();

    res
      .status(200)
      .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true });

    // to remove all the associate post with the user
    for (let i = 0; i < posts.length; i++) {
      const po = await Post.findById(posts[i]);
      await po.remove();
    }
    // removing users from Followers following
    for (let index = 0; index < followers.length; index++) {
      const follow = await User.findById(followers[index]);

      const ind = follow.following.indexOf(userId);
      follow.following.splice(ind, 1);

      await follow.save();
    }

    // removing users from Following followers
    for (let index = 0; index < following.length; index++) {
      const followi = await User.findById(following[index]);

      const ind = followi.followers.indexOf(userId);
      followi.followers.splice(ind, 1);

      await followi.save();
    }
    // removing all the comments of the User
    const postss = await Post.find();
    for (let i = 0; i < postss.length; i++) {
      const ps = await Post.findById(postss[i]._id);

      for (let j = 0; j < ps.comments.length; j++) {
        if (ps.comments[j].user === userId) {
          ps.comments.splice(j, 1);
        }
        await ps.save();

      }
    }
    // removing all the Likes of the User
    for (let i = 0; i < postss.length; i++) {
      const allps = await Post.findById(postss[i]._id);

      for (let j = 0; j < allps.likes.length; j++) {
        if (allps.likes[j] === userId) {
          allps.likes.splice(j, 1);
        }
        await allps.save();

      }
    }

    res.status(200).json({
      success: true,
      message: "Profile Deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Show my Profile
export const showMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("post followers following");

    res.status(200).json({
      success: true,
      user,

    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// TO FOLLOW THE
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is trying to follow themselves
    if (req.params.id === req.user._id) {
      return res.status(400).json({
        success: false,
        message: "User cannot follow themselves",
      });
    }
    // we have to find the user we have to follow
    const userToFollow = await User.findById(userId);
    const loggedInUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // we can follow a user only once
    if (loggedInUser.following.includes(userToFollow._id)) {
      const indexfollowing = loggedInUser.following.indexOf(userToFollow._id);
      loggedInUser.following.splice(indexfollowing, 1);

      const indexfollowers = userToFollow.followers.indexOf(loggedInUser._id);
      userToFollow.followers.splice(indexfollowers, 1);

      await loggedInUser.save();
      await userToFollow.save();

      res.status(200).json({
        success: true,
        message: "User Unfollowed",
      });
    } else {
      loggedInUser.following.push(userId);
      userToFollow.followers.push(req.user._id);

      await loggedInUser.save();
      await userToFollow.save();

      res.status(200).json({
        success: true,
        message: "User followed",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// SEE ANY USER
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate("post followers following");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Imporve :  to show the Users that are famous
export const getAllUserProfile = async (req, res) => {
  try {
    const currentUser = req.user._id;

    const user = await User.find({ _id: { $ne: currentUser } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const searchUserProfile = async (req, res) => {
  try {
    const currentUser = req.user._id;

    const user = await User.find({ name: { $regex: req.query.name, $options: "i" } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Forgot Password : we generate the restPassword Token the encrypt it and store it in the database and send a email to user

export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const resetPasswordToken = user.getResetPasswordToken();

    await user.save();

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/password/reset/${resetPasswordToken}`;

    const message = `Reset Your Password by clicking on the link below: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Reset Password",
        message,
      });

      res.status(200).json({
        success: true,
        message: `Email sent to ${user.email}`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.tokenId)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid or has expired",
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: false,
      message: "Password Updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const posts = [];

    for (let i = 0; i < user.post.length; i++) {
      const post = await Post.findById(user.post[i]).populate(
        "likes comments.user owner"
      );
      posts.push(post);
    }

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
