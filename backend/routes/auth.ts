import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// followed instructions from https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs
function generateAccessToken(username: string) {
  return jwt.sign({name: username}, process.env.JWT_SECRET!, { expiresIn: 30 * 60 });
}

// middleware for verifying JWT
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(
    token,
    process.env.JWT_SECRET as string,
    (err: any, user: any) => {
      console.log(err);
      if (err) return res.sendStatus(403);
      req.body.user = user;
      next();
    }
  );
}

router.post("/login", (req, res) => {
  const data = req.body;
  if (data.username == "EthanLi1360" && data.password == "supersecret") {
    res.status(200).json(generateAccessToken(data.username));
  } else {
    res.sendStatus(401);
  }
});

router.get("/test_token", authenticateToken, (req, res) => {
  res.status(200).json({user: req.body.user});
});

export default router;