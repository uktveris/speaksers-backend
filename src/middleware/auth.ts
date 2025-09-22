import { NextFunction, Request, Response } from "express";
import { jwtVerify, createRemoteJWKSet } from "jose";

const url = process.env.SUPABASE_AUTH_URL!;
const jwks = createRemoteJWKSet(
  new URL(`${url}/auth/v1/.well-known/jwks.json`),
);

export async function authMiddleware(
  req: any,
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
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${url}/auth/v1`,
      audience: "authenticated",
    });
    req.user = payload.sub;
    console.log("set user");
    return next();
  } catch (err) {
    console.log("jwt verification failed: ", { err });
    res.status(401).json({ error: "Error: " + (err as Error).message });
    return;
  }
}
