// TODO: include this seeding script into cd/ci pipeline
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const node_env = process.env.NODE_ENV || "development";
const envFile = `.env.${node_env}`;

console.log("loading environment from : ", { envFile });
dotenv.config({ path: path.join(__dirname, "..", envFile) });

console.log("running default avatar seed script...");

const supabase = createClient(
  process.env.SUPABASE_AUTH_URL!,
  process.env.SUPABASE_AUTH_KEY!,
);

async function seedAvatars() {
  const dir = "./assets/";
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileBuffer = fs.readFileSync(filePath);

    const { error } = await supabase.storage
      .from("avatars")
      .upload(file, fileBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.log(
        "failed to upload default avatar file: ",
        { file },
        { error },
      );
      return;
    }
    console.log("default avatar successfully uploaded to the bucket: ", {
      file,
    });
  }
}

seedAvatars();
