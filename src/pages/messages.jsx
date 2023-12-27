import Navbar from "../components/navbar"
import MessagePreview from "../components/message_preview";
import '../css/messages.css'
import { useState, useEffect } from "react";

export default function Messages() {
    const [messagePreviews, setMessagePreviews] = useState([]);
    const [noMessages, setNoMessages] = useState(false);

    useEffect(() => {
        async function fetchMessages() {
            try {
                const response = await fetch(`/api/messages`, {
                    headers: {
                        'Authorization': localStorage.getItem("opnidea-session")
                    }
                });
    
                if (response.status === 200) {
                    const data = await response.json();
    
                    if (data.length === 0) {
                        setNoMessages(true);
                    } else {
                        setMessagePreviews(data);
                    }
                }
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
            }
        }

        if (messagePreviews.length === 0 && !noMessages) {
            fetchMessages();
        }
    }, [messagePreviews, noMessages]); 

    return (
        <div id="content">
            <Navbar />
            <div id="body" className="centered">
                <div id="messages-page" className='truly-centered'>
                    <h1>Messages</h1>
                    {messagePreviews.length === 0 ? (
                        <p>You currently have no messages. You can message a user via their profile.</p>
                    ) : (
                        <div id="messages-container">
                            <div id="messages">
                                {messagePreviews.map((messagePreview, index) => {
                                    const lastMessage = messagePreview.messages[messagePreview.messages.length - 1];
                                    const markerText = lastMessage.read ? '' : 'UNREAD';

                                    return (
                                        <MessagePreview
                                            key={index}
                                            id={messagePreview.from.id}
                                            username={messagePreview.from.username}
                                            last_message={lastMessage.content}
                                            date={lastMessage.date}
                                            verified={messagePreview.from.verified}
                                            marker_text={markerText}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}