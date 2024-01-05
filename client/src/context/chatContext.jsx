import { createContext, useCallback, useEffect, useState } from "react";
import { baseUrl, getRequest, postRequest } from "../utils/services";


export const ChatContex = createContext();

export const ChatContexProvider = ({children, user}) => {
    const [userChats, setUserChats] = useState(null);
    const [isUserChatsLoading, setIsUserChatsLoading] = useState(false);
    const [isUserChatsError, setIsUserChatsError] = useState(null);
    const [potentialChats, setPotentialChats] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState(null)
    const [isMessagesLoading, setIsMessagesLoading] = useState(false)
    const [isMessagesError, setIsMessagesError] = useState(null)
    const [sendTextMessageError, setSendTextMessageError] = useState(null);
    const [newMessage, setNewTextMessage] = useState(null);


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
    },[user])

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

    }}>{children}</ChatContex.Provider>
}