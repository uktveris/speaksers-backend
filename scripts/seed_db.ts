import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const node_env = process.env.NODE_ENV || "development";
const envFile = `.env.${node_env}`;

console.log("loading environment from : ", { envFile });
dotenv.config({ path: path.join(__dirname, "..", envFile) });

console.log("running default avatar seed script...");

const supabase = createClient(process.env.SUPABASE_AUTH_URL!, process.env.SUPABASE_SECRET_KEY!);

// seed languages & levels
async function seedLanguages() {
  try {
    const { data: exists } = await supabase.from("language_courses").select("id").limit(1);
    if (exists && exists.length > 0) {
      console.log("skipping languages seeding, db already has initial data");
      return;
    }

    console.log("seeding languages...");

    const dir = "./seedData/";
    const filePath = path.join(dir, "languages.json");
    const topics = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const { error } = await supabase.from("language_courses").upsert(topics, { onConflict: "name" });
    if (error) {
      console.log("failed to upload languages from json: ", { error });
      return;
    }
  } catch (error) {
    console.log("error occurred during languages seeding:", error);
  }
}

// seed dialogue topics
async function seedDialogueTopics() {
  try {
    const { data: exists } = await supabase.from("dialogue_topics").select("id").limit(1);
    if (exists && exists.length > 0) {
      console.log("skipping dialogue topics seeding, db already has initial data");
      return;
    }
    console.log("seeding dialogue topics...");

    const dir = "./seedData/";
    const filePath = path.join(dir, "dialogue_topics.json");
    const topics = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const { error } = await supabase.from("dialogue_topics").upsert(topics, { onConflict: "title" });
    if (error) {
      console.log("failed to upload dialogue topics from json: ", { error });
      return;
    }
  } catch (error) {
    console.log("error occurred during dialog topics seeding:", error);
  }
}

// seed avatars from ./assets
async function seedAvatars() {
  try {
    const { data: exists } = await supabase.schema("storage").from("objects").select("id").limit(1);
    if (exists && exists.length > 0) {
      console.log("skipping avatar seeding, db already has initial data");
      return;
    }
    console.log("seeding default avatars...");

    const dir = "./assets/";
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const fileBuffer = fs.readFileSync(filePath);

      const { error } = await supabase.storage.from("avatars").upload(file, fileBuffer, {
        contentType: "image/png",
        upsert: true,
      });

      if (error) {
        console.log("failed to upload default avatar file: ", { file }, { error });
        return;
      }
      console.log("default avatar successfully uploaded to the bucket: ", {
        file,
      });
    }
  } catch (error) {
    console.log("error occurred during avatar seeding:", error);
  }
}

seedAvatars();
seedDialogueTopics();
seedLanguages();
