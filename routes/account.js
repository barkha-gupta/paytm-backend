const express = require("express");
const zod = require("zod");
const authMiddleware = require("../middleware/auth");
const Account = require("../models/account");
const mongoose = require("mongoose");
const router = express.Router();

router.get("/balance", authMiddleware, async (req, res) => {
  try {
    const account = await Account.findOne({ userId: req.userId });

    res.json({
      balance: account.balance,
    });
  } catch (error) {
    res.status(401).json({
      message: error.message,
    });
  }
});

router.post("/transfer", authMiddleware, async (req, res) => {
  try {
    const session = await mongoose.startSession();

    session.startTransaction();
    const { to, amount } = req.body;
    const currentAccount = await Account.findOne({
      userId: req.userId,
    }).session(session);

    if (!currentAccount || currentAccount.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    const toAccount = await Account.findOne({
      userId: to,
    }).session(session);

    if (!toAccount) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Invalid account",
      });
    }

    await Account.updateOne(
      {
        userId: req.userId,
      },
      { $inc: { balance: -amount } }
    ).session(session);
    await Account.updateOne(
      {
        userId: to,
      },
      { $inc: { balance: amount } }
    ).session(session);

    await session.commitTransaction();
    res.json({
      message: "Transfer successful",
    });
  } catch (error) {
    res.status(401).json({
      message: error.message,
    });
  }
});

module.exports = router;
