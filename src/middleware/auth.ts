import { NextFunction, Request, Response } from "express";
import { jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";
import supabase from "../config/supabaseConn";

const url = process.env.SUPABASE_AUTH_URL!;
const jwks = createRemoteJWKSet(
  new URL(`${url}/auth/v1/.well-known/jwks.json`),
);

interface AuthRequest extends Request {
  userId?: string;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    console.log("no bearer found..");
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  const token = auth.split(" ")[1];
  try {
    // const { payload, protectedHeader } = await jwtVerify(token, jwks);
    // console.log("received payload: ", { payload });
    // console.log("received protectedHeader: ", { protectedHeader });
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.log("error: ", { error });
      return;
    }
    // req.userId = payload.sub;
    // req.claims = payload;
    req.userId = user.id;
    return next();
  } catch (err) {
    console.log("jwt verification failed: ", { err });
    res.status(401).json({ error: "Error: " + (err as Error).message });
    return;
  }
}
