import "express";
import { JWTPayload } from "jose";

declare module "express" {
  interface Request {
    userId?: string;
    claims?: JWTPayload;
  }
}
