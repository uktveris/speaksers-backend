import { CorsOptions, CorsOptionsDelegate } from "cors";
import { CookieOptions } from "express";

const corsOptions: CorsOptions = {
  origin: [process.env.CORS_ORIGIN!],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
  credentials: true,
};

const corsSocketOptions: CorsOptions | CorsOptionsDelegate | undefined = {
  origin: [process.env.CORS_ORIGIN!],
  methods: ["GET", "POST"],
  credentials: true,
};

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
};

export { corsOptions, cookieOptions, corsSocketOptions };
