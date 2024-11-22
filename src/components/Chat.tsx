"use client";
import React, { useState, useEffect, useRef } from "react";
import MySocket from "./MySocket";
import Image from "next/image";
import avatar from "@/images/avatar.png";
import notification from "@/images/notification.png";
import { Drawer, IconButton } from "@mui/material";
import { Menu as MenuIcon, EmojiEmotions as EmojiIcon } from "@mui/icons-material";
import EmojiPicker from "emoji-picker-react";
const mySocket = new MySocket();

interface Message {
  content: string;
  fromSelf: boolean;
  time: string;
}

interface User {
  userID: string;
  username: string;
  connected: boolean; 
  self?: boolean;
  messages?: Message[];
  hasNewMessages?: boolean;
}



const Chat = () => {
  const [chatView, setChatView] = useState(false);
  const [username, setUsername] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const connectionRef = useRef<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const callback = (data: any) => {
      setUsers((data as User[]).filter((user) => user.userID !== mySocket.socket.userID)); // Cast to User[] explicitly
    };
    mySocket.setUserDataChange(callback);
  }, []);
  
  useEffect(() => {
    if (!connectionRef.current) {
      const sessionID = localStorage.getItem("sessionID");
      if (sessionID) {
        mySocket.connectToSocket(sessionID);
        setChatView(true);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      mySocket.setSelectedUser(selectedUser.userID);
      setDrawerOpen(false);
    }
  }, [selectedUser]);

  // Scroll to the bottom of the chat messages when a new message arrives
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [users, selectedUser]);

  const handleRegister = () => {
    setChatView(true);
    mySocket.onUsernameSelection(username);
  };
  const handleEmojiClick = (emojiObject: any) => {
    setMessage((prev) => prev + emojiObject.emoji);
  };

  return (
    <>
      {!chatView ? (
        <div className="flex h-screen items-center justify-center gap-1">
          <input
            className="border-gray-300 rounded border-2 p-3 shadow-xl"
            placeholder="Username!"
            name="username"
            onChange={(event) => setUsername(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleRegister();
              }
            }}
          />
          <button
            className="bg-[#6E00FF] text-white rounded p-3"
            onClick={() => {
              setChatView(true);
              mySocket.onUsernameSelection(username);
            }}
          >
            Register
          </button>
        </div>
      ) : (
        <div className="grid grid-flow-col h-screen">
          {/* Left side with users in sidebar */}
          <div className="hidden lg:block bg-[#6E00FF] p-4 md:flex flex-col gap-4">
            {users.map((user) => (
              <div className="flex items-center" key={user.userID}>
                <button
                  className={`flex items-center gap-3 rounded-sm p-3 w-full ${
                    selectedUser &&
                    selectedUser.userID === user.userID &&
                    "bg-blue-400"
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <Image
                    src={avatar}
                    alt="User Avatar"
                    width={30}
                    height={30}
                    className="rounded-full"
                  />
                  <div>
                    <div className="text-white">
                      {user.username} {user.self && "(Me)"}
                    </div>
                    <div className="flex gap-2 items-center text-sm">
                      <div className="rounded h-2 w-2 bg-green-500"></div>
                      <div>online</div>
                    </div>
                  </div>
                </button>
                {user.hasNewMessages && (
                  <Image
                    src={notification}
                    alt="Notification"
                    width={30}
                    height={30}
                    className="rounded-full"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Drawer for mobile screens */}
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            sx={{
              display: { xs: "block", lg: "none" }, // Show drawer only on mobile
            }}
          >
            <div className="p-4 bg-[#6E00FF] h-screen space-y-4">
              {" "}
              {users.map((user) => (
                <div className="flex items-center" key={user.userID}>
                  <button
                    className={`flex items-center gap-3 rounded-sm p-3 w-full ${
                      selectedUser &&
                      selectedUser.userID === user.userID &&
                      "bg-blue-400"
                    }`}
                    onClick={() => {
                      setSelectedUser(user);
                      setDrawerOpen(false); // Close drawer after selecting a user
                    }}
                  >
                    <Image
                      src={avatar}
                      alt="User Avatar"
                      width={30}
                      height={30}
                      className="rounded-full"
                    />
                    <div>
                      <div className="text-white">
                        {user.username} {user.self && "(Me)"}
                      </div>
                      <div className="flex gap-2 items-center text-sm">
                        <div className="rounded h-2 w-2 bg-green-500"></div>
                        <div>online</div>
                      </div>
                    </div>
                  </button>
                  {user.hasNewMessages && (
                    <Image
                      src={notification}
                      alt="Notification"
                      width={30}
                      height={30}
                      className="rounded-full"
                    />
                  )}
                </div>
              ))}
            </div>
          </Drawer>

          {/* Right side with chat */}
          <div className="flex flex-col col-span-4 max-h-screen">
            <div className="p-6 border-solid border-b-2">
              {selectedUser ? (
                <div className="flex gap-2 items-center">
                  <div className="lg:hidden">
                    {chatView && (
                      <IconButton
                        className=""
                        onClick={() => setDrawerOpen(true)}
                      >
                        <MenuIcon />
                      </IconButton>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Image
                      src={avatar}
                      alt="User Avatar"
                      width={30}
                      height={30}
                      className="rounded-full"
                    />
                    <div>{selectedUser.username.charAt(0).toUpperCase() + selectedUser.username.slice(1)}</div>
                    <div className=" rounded h-2 w-2 bg-green-500"></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between lg:justify-center">
                  <div className="lg:hidden">
                    {chatView && (
                      <IconButton
                        className=""
                        onClick={() => setDrawerOpen(true)}
                      >
                        <MenuIcon />
                      </IconButton>
                    )}
                  </div>
                  <div className="text-center">
                    Select a user to start chat!
                  </div>
                  <div></div>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
            {selectedUser?.messages?.map((message, index) => (
  <div key={index} className={`flex mb-6 ${message.fromSelf ? 'justify-end' : 'justify-start'}`}>
    <div className={`p-3 rounded-lg max-w-xs flex flex-col space-x-16 w-48 lg:w-96 ${message.fromSelf ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}>
      <div className="self-start break-all">{message.content}</div>
      <div className="text-xs self-end">{message.time}</div>
    </div>
  </div>
))}

              <div ref={messagesEndRef} />
            </div>

            {selectedUser && (
              <div className="p-6 border-gray-300">
                <div className="flex gap-1">

                <IconButton
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className="mr-2 text-orange-500"
                >
                  <EmojiIcon />
                </IconButton>
                {showEmojiPicker && (
                  <div className="absolute bottom-16 text-orange-500">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}

                  <input
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        mySocket.onMessage(message);
                        setMessage("");
                      }
                    }}
                    value={message}
                    className="w-full border-solid border-2 border-gray-300 rounded p-2"
                    placeholder="Enter your message!"
                  />
                  <button
                    onClick={() => {
                      mySocket.onMessage(message);
                      setMessage("");
                    }}
                    className="bg-[#6E00FF] text-white rounded p-2 h-max"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* {chatView && (
        <IconButton
          className="lg:hidden absolute top-4 right-4"
          onClick={() => setDrawerOpen(true)}
        >
          <MenuIcon />
        </IconButton>
      )} */}
    </>
  );
};

export default Chat;
