import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface ExtendedRequest extends Request {
  user?: string;
}

const jwtSecret = process.env.SUPABASE_JWT_SECRET as string;

function authMiddleware(req: any, res: Response, next: NextFunction) {
  console.log("using auth..");
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    console.log("no bearer found..");
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, jwtSecret);
    console.log("payload: " + payload);
    req.user = payload.sub as string;
    console.log("set user");
    next();
  } catch (err) {
    res.status(401).json({ error: "Error: " + (err as Error).message });
    return;
  }
}

export { authMiddleware };
