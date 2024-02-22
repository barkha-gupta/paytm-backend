const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({});
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(403).json({
      message: "User not authenticated",
    });
  } else {
    const decode = jwt.verify(token, JWT_SECRET);
    req.userId = decode.userId;
    next();
  }
};
module.exports = authMiddleware;
