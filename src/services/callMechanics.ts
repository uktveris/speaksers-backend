import { TopicTask } from "../models/rooms";

export function getRoles(): string[] {
  const roles = ["A", "B"];
  return Math.random() > 0.5 ? roles : roles.reverse();
}

export function getRandomTopic(): TopicTask {
  const index = Math.floor(Math.random() * dummyTopicTasks.length);
  return dummyTopicTasks[index];
}

export const dummyTopicTasks: TopicTask[] = [
  // {
  //   id: 1,
  //   topic: "Hobbies",
  //   type: "Personal Experience",
  //   question:
  //     "What hobbies or leisure activities do you enjoy doing in your free time? Why do you like them?",
  // },
  // {
  //   id: 2,
  //   topic: "Education",
  //   type: "Discussion",
  //   question:
  //     "In many countries, students are taught in traditional classroom settings. Do you think modern technology, such as online learning, can replace traditional education? Why or why not?",
  // },
  {
    id: "031cdca4-414a-495b-9fa8-c583d041e638",
    title: "Social Media Age Limit",
    role1: "Ban under 16",
    arg1: "Give 2 dangers (mental health, cyberbullying, privacy).",
    tip1: "Use emotional examples like stress or online harassment.",
    role2: "Allow with supervision",
    arg2: "Show 2 benefits (connection, digital skills, access to communities).",
    tip2: "Suggest parental controls or rules instead of bans.",
  },
];
