import { io } from "socket.io-client";
interface User {
  userID: string;
  username: string;
  connected?: boolean; // Can be true, false, or undefined
  self?: boolean;
  messages?: { content: string; fromSelf: boolean; time: string }[];
  hasNewMessages?: boolean;
}

class MySocket {
  public socket: any;
  public URL: string;
  private onDataChange: (users: User[]) => void = () => {};
  public users: any[] = [];
  public selectedUser: any = null;
  constructor() {
    this.URL = "http://localhost:3001";
    this.socket = io(this.URL, { autoConnect: false, });
    this.socket.onAny((event: any, ...args: any) => {
      console.log(event, args);
    });
    this.socket.on("connect_error", (err: any) => {
      if (err.message === "invalid username") {
        console.log("++++++++++++++", err);
      }
    });
    this.socket.on("users", (users: any) => {
      users.forEach((user: any) => {
        user.self = user.userID === this.socket.userID;
      });
      this.users = users;
      this.onDataChange(this.users);
    });
    this.socket.on("user connected", (userData: any) => {
      let isUserAlreadyExist = false;
      for (let i = 0; i < this.users.length; i++) {
        const user = this.users[i];
        if (user.userID === userData.userID) {
          user.connected = true;
          isUserAlreadyExist = true;
          break;
        }
      }
      if (!isUserAlreadyExist) {
        this.users.push(userData);
      }
      this.onDataChange(this.users);
    });

    this.socket.on("private message", ({ content, from, time }: any) => {
      const messageTime = time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const userIndex = this.users.findIndex((user) => user.userID === from);
      if (userIndex !== -1) {
        const user = this.users[userIndex];
        if (!user.messages) user.messages = [];
        user.messages.push({ content, fromSelf: false, time: messageTime });
        if (user !== this.selectedUser) user.hasNewMessages = true;
    
        const [movedUser] = this.users.splice(userIndex, 1);
        this.users.unshift(movedUser);
        this.onDataChange(this.users);
      }
    });
    
    
    this.socket.on("connect", () => {
      this.users.forEach((user) => {
        if (user.self) {
          user.connected = true;
        }
      });
    });

    this.socket.on("user disconnected", (userID: string) => {
      this.users.forEach((user) => {
        if (user.userID === userID) {
          user.connected = false;
        }
      });
      this.onDataChange(this.users);
    });
    this.socket.on("session", ({ sessionID, userID }: any) => {
      // attach the session ID to the next reconnection attempts
      this.socket.auth = { sessionID };
      localStorage.setItem("sessionID", sessionID);
      this.socket.userID = userID;
    });
  }
  onUsernameSelection(username: string) {
    this.socket.auth = { username };
    this.socket.connect();
  }

  setUserDataChange(callback: (users: User[]) => void) {
    this.onDataChange = callback;
  }

  setSelectedUser(userID: string) {
    const user = this.users.find((user) => user.userID === userID);
    if (user) {
      this.selectedUser = user;

      user.hasNewMessages = false;
      this.onDataChange(this.users);
    }
  }

  onMessage(content: string) {
    if (!content.trim()) {
      return alert(`Empty message can't be sent`);
    }
  
    if (this.selectedUser) {
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
  
      // Emit the private message to the server
      this.socket.emit("private message", {
        content,
        to: this.selectedUser.userID,
        from: this.socket.userID,
        time,
      });
  
      // Add the message to the current user's chat
      if (!this.selectedUser.messages) {
        this.selectedUser.messages = [];
      }
      this.selectedUser.messages.push({
        content,
        fromSelf: true,
        time,
      });
  
      this.selectedUser.hasNewMessages = false;
  
      // Move the selected user to the top of the array
      const userIndex = this.users.findIndex((user) => user.userID === this.selectedUser.userID);
      if (userIndex !== -1) {
        const [user] = this.users.splice(userIndex, 1); // Remove the user
        this.users.unshift(user); // Add them to the top
      }
        
      this.onDataChange(this.users);
    }
  }
  connectToSocket(sessionID: string) {
    this.socket.auth = { sessionID };
    this.socket.connect();
  }
}

export default MySocket;
