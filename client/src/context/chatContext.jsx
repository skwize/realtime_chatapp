import { createContext, useCallback, useEffect, useState } from "react";
import { baseUrl, getRequest, postRequest } from "../utils/services";
import { io } from "socket.io-client";


export const ChatContex = createContext();

export const ChatContexProvider = ({children, user}) => {
    const [userChats, setUserChats] = useState(null);
    const [isUserChatsLoading, setIsUserChatsLoading] = useState(false);
    const [isUserChatsError, setIsUserChatsError] = useState(null);
    const [potentialChats, setPotentialChats] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState(null);
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);
    const [isMessagesError, setIsMessagesError] = useState(null);
    const [sendTextMessageError, setSendTextMessageError] = useState(null);
    const [newMessage, setNewTextMessage] = useState(null);
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [allUsers, setAllUsers] = useState([]);


    console.log("notify", notifications)

    useEffect(()=>{
        const newSocket = io("http://192.168.0.21:3001");
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        }
    }, [user])

    useEffect(()=>{
        if(socket === null) return;
        socket.emit("addNewUser", user?._id);
        socket.on("getOnlineUsers", (res)=>{
            setOnlineUsers(res);
        })

        return () => {
            socket.off("getOnlineUsers")
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket])

    //send message
    useEffect(()=>{
        if(socket === null) return;

        const recipientId = currentChat?.members?.find((id) => id !== user?._id)

        socket.emit("sendMessage", {...newMessage, recipientId});
       
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newMessage])


    //receive message & notification
    useEffect(()=>{
        if(socket === null) return;

        socket.on("getMessage", res => {
            if (currentChat?._id !== res.chatId) return;

            setMessages((prev)=> [...prev, res])
        });

        socket.on("getNotification", (res) => {
            const isChatOpened = currentChat?.members.some(id => id === res.senderId);

            if (isChatOpened) {
                setNotifications(prev => [{...res, isRead:true}, ...prev])
            }else{
                setNotifications(prev => [res, ...prev])
            }
        })

        return () => {
            socket.off("getMessage");
            socket.off("getNotification");
        }
       
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, currentChat])
    

    useEffect(()=>{

        const getUsers = async() => {
            const response = await getRequest(`${baseUrl}/users`);

            if(response.error){
                return console.log("Error fetching users", response);
            }

            const pChats = response.filter((u)=>{
                let isChatCreated = false;
                if(user?._id === u._id) return false

                if(userChats){
                    isChatCreated = userChats?.some((chat)=>{
                        return chat.members[0] === u._id || chat.members[1] === u._id
                    })
                }

                return !isChatCreated;
            });

            setPotentialChats(pChats);
            setAllUsers(response);
        }

        getUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userChats])

    useEffect(() => {
        const getUserChats = async () => {
            if (user?._id) {
                setIsUserChatsError(null)
                setIsUserChatsLoading(true)

                const response = await getRequest(`${baseUrl}/chats/${user?._id}`);

                setIsUserChatsLoading(false)

                if (response.error){
                    return setIsUserChatsError(response)
                }

                setUserChats(response)
            }
        }

        getUserChats();
    },[user, notifications])

    useEffect(() => {
        const getMessages = async () => {
            setIsMessagesError(null)
            setIsMessagesLoading(true)

            const response = await getRequest(`${baseUrl}/messages/${currentChat?._id}`);

            setIsMessagesLoading(false)

            if (response.error){
                return setIsMessagesError(response)
            }

            setMessages(response)
        }
        getMessages();
    },[currentChat])

    const updateCurrentChat = useCallback((chat) => {
        setCurrentChat(chat);
    },[])

    const createChat = useCallback(async (firstId, secondId)=> {
        const response = await postRequest(`${baseUrl}/chats`, JSON.stringify({
            firstId,
            secondId
        }));

        if(response.error) return console.log("Error creating chat", response);

        setUserChats((prev) => [...prev, response]);
    }, [])

    const sendTextMessage = useCallback(async(textMessage, sender, currentChatId, setTextMessage)=> {
        if (!textMessage) return console.log("Empty message no sending");

        const response = await postRequest(`${baseUrl}/messages`, JSON.stringify({
            chatId: currentChatId,
            senderId: sender._id,
            text: textMessage
        }));

        if (response.error) {
            return setSendTextMessageError(response);
        }

        setNewTextMessage(response);
        setMessages((prev)=> [...prev, response])
        setTextMessage("")
    }, [])

    const markAllNotificationsAsRead = useCallback((notifications)=>{
        const mNotifications = notifications.map(n => {
            return{...n, isRead: true}
        })

        setNotifications(mNotifications);
    }, [])

    const markNotificationAsRead = useCallback((n, userChats, user, notifications) => {
        const desiredChat = userChats.find(chat => {
            const chatMembers = [user._id, n.senderId];
            const isDesiredChat = chat?.members.every(member => {
                return chatMembers.includes(member);
            });

            return isDesiredChat;
        });

        const mNotifications = notifications.map(el => {
            if (n.senderId === el.senderId) {
                return {...n, isRead: true};
            }else{
                return el;
            }
        })
        
        updateCurrentChat(desiredChat);
        setNotifications(mNotifications);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const markThisUserNotificationsAsRead = useCallback((thisUserNotifications, notifications) => {
        const mNotifications = notifications.map(el => {
            let notification;

            thisUserNotifications.forEach(n => {
                if (n.senderId === el.senderId) {
                    notification = {...n, isRead: true}
                }else{
                    notification = el
                }
            })

            return notification
        })

        setNotifications(mNotifications)


    }, [])

    return <ChatContex.Provider value={{
        userChats,
        isUserChatsLoading,
        isUserChatsError,
        potentialChats,
        createChat,
        updateCurrentChat,
        messages,
        currentChat,
        isMessagesError,
        isMessagesLoading,
        sendTextMessage,
        onlineUsers,
        sendTextMessageError,
        notifications,
        allUsers,
        markAllNotificationsAsRead,
        markNotificationAsRead,
        markThisUserNotificationsAsRead

    }}>{children}</ChatContex.Provider>
}