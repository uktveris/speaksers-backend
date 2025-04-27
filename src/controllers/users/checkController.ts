import { Request, Response } from "express";

const checkUser = (req: Request, res: Response) => {
  console.log("user accessed check endpoint!");
  res.status(200).send({ data: "check endpoint reached!" });
  return;
};

export default checkUser;
