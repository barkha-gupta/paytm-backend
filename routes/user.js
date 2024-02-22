const express = require("express");
const zod = require("zod");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/user");
const authMiddleware = require("../middleware/auth");
const Account = require("../models/account");
const router = express.Router();
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/signup", async (req, res) => {
  try {
    const signupBody = zod.object({
      username: zod.string().email(),
      firstname: zod.string(),
      lastname: zod.string(),
      password: zod.string(),
    });

    const { success } = signupBody.safeParse(req.body);

    if (!success) {
      return res.status(411).json({
        message: "Email already taken / Incorrect inputs",
      });
    }

    const existingUser = await User.findOne({
      username: req.body.username,
    });

    if (existingUser) {
      return res.status(411).json({
        message: "Email already taken/Incorrect inputs",
      });
    }

    const { username, firstname, lastname, password } = req.body;

    bcrypt.hash(password, 10, async (err, hash) => {
      const user = await User.create({
        username,
        firstname,
        lastname,
        password: hash,
      });

      const userId = user._id; // used for account creation
      const token = jwt.sign(
        {
          userId,
        },
        JWT_SECRET
      );
      await Account.create({
        userId,
        balance: 1 + Math.random() * 1000,
      });

      res.json({
        message: "User created successfully",
        token,
      });
    });
  } catch (error) {
    res.status(401).json({
      message: error.message,
    });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const signinbody = zod.object({
      username: zod.string().email(),
      password: zod.string(),
    });

    const { success } = signinbody.safeParse(req.body);

    if (!success) {
      return res.status(411).json({
        message: "Email already taken / Incorrect inputs",
      });
    }

    const user = await User.findOne({
      username: req.body.username,
    });

    if (user) {
      const token = jwt.sign(
        {
          userId: user._id,
        },
        JWT_SECRET
      );

      res.json({
        message: "User logged in successfully",
        token,
      });
    } else {
      return res.status(411).json({
        message: "Error while logging in",
      });
    }
  } catch (error) {
    res.status(401).json({
      message: error.message,
    });
  }
});

router.put("/", authMiddleware, async (req, res) => {
  try {
    const updatebody = zod.object({
      password: zod.string().optional(),
      firstName: zod.string().optional(),
      lastName: zod.string().optional(),
    });

    const { success } = updatebody.safeParse(req.body);

    if (!success) {
      return res.status(411).json({
        message: "Error while updating information",
      });
    }

    const userupdate = await User.updateOne({ _id: req.userId }, req.body);

    res.json({
      message: "Updated successfully",
    });
  } catch (error) {
    res.status(401).json({
      message: error.message,
    });
  }
});

router.get("/bulk", async (req, res) => {
  try {
    const filter = req.query.filter || "";

    const users = await User.find({
      $or: [
        { firstname: { $regex: filter } },
        { lastname: { $regex: filter } },
      ],
    });

    res.json({
      users: users.map((user) => ({
        username: user.username,
        firstName: user.firstname,
        lastName: user.lastname,
        _id: user._id,
      })),
    });
  } catch (error) {
    res.status(401).json({
      message: error.message,
    });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  const user = await User.findOne({
    _id: req.userId,
  });
  if (!user) {
    return res.status(400).json({
      message: "Error while gettng user!",
    });
  }
  res.json({
    message: "User found",
    user,
  });
});
module.exports = router;
