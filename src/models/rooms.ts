export interface CallRoom {
  id: string;
  participants: string[];
  roles: string[];
  createdAt: number;
  timerStopVotes: Set<string>;
}

export interface TopicTask {
  id: number;
  topic: string;
  type: string;
  question: string;
}
