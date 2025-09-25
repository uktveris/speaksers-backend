import { Request, Response } from "express";
import supabase from "../../config/supabaseConn";
import { logger } from "../../config/logging";

const context = "DELETE USER ENDPOINT";

const deleteUser = async (req: Request, res: Response) => {
  const { userId } = req.body;
  try {
    const { data, error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      res.status(400).json({ msg: error.message });
      console.log("ERROR IN DELETION: ", { error });
      logger.error({
        message: "Supabase user deletion error",
        context: context,
        meta: {
          req: { method: req.method, url: req.originalUrl },
          errorMsg: error.message,
          stack: error.stack,
        },
      });
      return;
    }
    logger.info({
      message: "User deleted",
      context: context,
      meta: {
        req: { method: req.method, url: req.originalUrl },
        additionalInfo: data.user,
      },
    });
    res.status(201).json({ msg: data });
  } catch (error) {
    console.log("user deletion error occurred: ", { error });
    logger.error({
      message: "Supabase user deletion error",
      context: context,
      meta: {
        req: { method: req.method, url: req.originalUrl },
        errorMsg: (error as Error).message,
        stack: (error as Error).stack,
      },
    });
    res.status(400).json({ msg: (error as Error).message });
  }
};

export default deleteUser;
