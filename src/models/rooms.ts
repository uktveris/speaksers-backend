export interface CallRoom {
  id: string;
  participants: string[];
  roles: string[];
  createdAt: number;
  timerStopVotes: Set<string>;
}

export interface TopicTask {
  id: string;
  title: string;
  role1: string;
  role2: string;
  arg1: string;
  arg2: string;
  tip1: string;
  tip2: string;
}

export interface StudentTopic {
  id: string;
  title: string;
  role: string;
  arg: string;
  tip: string;
}
