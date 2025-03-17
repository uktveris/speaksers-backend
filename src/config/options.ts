import { CookieOptions } from "express";

const corsOptions = {
  origin: ["http://localhost:8081"],
  optionsSuccessStatus: 200,
  credentials: true,
};

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
};

export { corsOptions, cookieOptions };
