export function getRoles(): string[] {
  const roles = ["A", "B"];
  return Math.random() > 0.5 ? roles : roles.reverse();
}

export function getRandomTopic(): TopicTask {
  const index = Math.floor(Math.random() * dummyTopicTasks.length);
  return dummyTopicTasks[index];
}

export interface TopicTask {
  id: number;
  topic: string;
  type: string;
  question: string;
}

export const dummyTopicTasks: TopicTask[] = [
  {
    id: 1,
    topic: "Hobbies",
    type: "Personal Experience",
    question:
      "What hobbies or leisure activities do you enjoy doing in your free time? Why do you like them?",
  },
  {
    id: 2,
    topic: "Education",
    type: "Discussion",
    question:
      "In many countries, students are taught in traditional classroom settings. Do you think modern technology, such as online learning, can replace traditional education? Why or why not?",
  },
];
