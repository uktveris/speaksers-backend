import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface ExtendedRequest extends Request {
  user?: string;
}

const jwtSecret = process.env.SUPABASE_JWT_SECRET as string;

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Error: " + (err as Error).message });
  }
}
