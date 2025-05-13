import { Request, Response } from "express";
import supabase from "../../config/supabaseConn";

const deleteUser = async (req: Request, res: Response) => {
  console.log("accessing delete user endpoint");
  const { userId } = req.body;
  try {
    const { data, error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      res.status(400).json({ msg: error.message });
      console.log("error details: ", error);
      return;
    }

    res.status(201).json({ msg: data });
  } catch (err) {
    console.log((err as Error).message);
    res.status(400).json({ msg: (err as Error).message });
  }
};

export default deleteUser;
