import supabase from "../config/supabaseConn";
import { TopicTask } from "../models/rooms";

export function getRoles(): string[] {
  const roles = ["A", "B"];
  return Math.random() > 0.5 ? roles : roles.reverse();
}

export async function getRandomTopic() {
  const { data, error } = await supabase.from("dialogue_topics").select();

  const topics = data as TopicTask[];

  if (error || topics.length === 0) {
    console.log("error while fetching topics:", error);
    return;
  }
  const index = Math.floor(Math.random() * topics.length);
  return topics![index];
}
