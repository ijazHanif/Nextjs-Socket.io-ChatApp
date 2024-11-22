
export interface User {
    userID: string;
    username: string;
    connected?: boolean; // Can be true, false, or undefined
    self?: boolean;
    messages?: { content: string; fromSelf: boolean; time: string }[];
    hasNewMessages?: boolean;
  }
  