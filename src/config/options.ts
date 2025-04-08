import { CookieOptions } from "express";

const corsOptions = {
  origin: ["http://localhost:8081"],
  optionsSuccessStatus: 200,
  credentials: true,
};

const corsSocketOptions = {
  origin: ["http://localhost:8081", "http://localhost:5173"],
  methods: ["GET", "POST"],
  // credentials: true,
};

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
};

export { corsOptions, cookieOptions, corsSocketOptions };
