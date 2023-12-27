import { useParams } from "react-router-dom";
import Navbar from "../components/navbar";
import Message from "../components/message";
import { useState } from "react";
import { useEffect } from "react";
import Alert from "../components/alert";
import '../css/messages.css'
import { Link } from "react-router-dom";

export default function Conversation() {
    const { userid } = useParams();
    const [messages, setMessages] = useState([]);
    const [user, setUser] = useState(null);
    const [noMessages, setNoMessages] = useState(true);
    const [groupedMessages, setGroupedMessages] = useState({});
    const [message, setMessage] = useState("");
    const [notif, setNotif] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchMessages() {
            try {
                const response = await fetch(`/api/messages/${userid}`, {
                    headers: {
                        'Authorization': localStorage.getItem("opnidea-session")
                    }
                });
    
                if (response.status != 200) {
                    return;
                }
    
                const data = await response.json();
    
                if (data.length === 0) {
                    return;
                }
    
                setUser(data);
    
                let messages = data.messages;
    
                if (data.messages == null) {
                    messages = [];
                }
    
                setMessages(messages);
    
                let groupedMessages = messages;
    
                groupedMessages = groupedMessages.reduce((acc, message) => {
                    if (Array.isArray(message)) {
                        message.forEach((msg) => {
                            const formattedDate = new Date(msg.date).toISOString().slice(0, 10);
                            acc[formattedDate] = [...(acc[formattedDate] || []), msg];
                        });
                    } else {
                        const formattedDate = new Date(message.date).toISOString().slice(0, 10);
                        acc[formattedDate] = [...(acc[formattedDate] || []), message];
                    }
                
                    return acc;
                }, {});
    
                setNoMessages(false);
                setGroupedMessages(groupedMessages);
    
                window.grpm = groupedMessages;
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
            }
        }

        if (messages.length === 0 && noMessages) {
            fetchMessages();
        }
    }, [messages, noMessages]); 

    function sendMessage() {
        try {
            if (message == "" || message == null || !message) {
                setError(true);
                setNotif('You need to provide a valid message!');
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                return;
            }
    
            fetch(`/api/messages/${userid}`, {
                method: 'POST',
                headers: {
                  'Content-Type' : 'application/json',
                  'Authorization' : localStorage.getItem('opnidea-session'),
                },
                body: JSON.stringify({
                    content: message
                })
            }).then(response => response.json()).then(data => {
                if (data.message) {
                    setError(true);
                    setNotif(data.message);
        
                    setTimeout(() => {
                        setNotif(null);
                    }, 5000);
                } else {
                    setError(false);
                    setNotif('Message sent successfully!');
        
                    setTimeout(() => {
                        setNotif(null);
                    }, 5000);
                }
            }).catch(error => {
                setError(true);
                setNotif(error);
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                return;
            });
        }
        catch(error) {
            console.log(error);
            alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
        }
    }

    return (<div id="content">
        <Navbar/>
        <div id="body" className="centered">
            {notif != null ? (error ? <Alert message={notif} warning></Alert> : <Alert message={notif}></Alert>) : <></>}
            {user == null ? <>
                <div className="header">
                        <h1>Uh oh!</h1>
                        <h2>Looks like we couldn't find that user.</h2>
                        <Link to='/explore'>Try find something else.</Link>
                    </div>
            </> : <div id="messages-page" className='truly-centered'>
                <h1>Message {user.username}</h1>
                {user.messaging_privacy == 2 ? <p>{user.username}'s messaging privacy settings have made it so you cannot directly message them.</p> : user.messaging_privacy == 1 && !user.allowed_to_message ? <p>{user.username}'s messaging privacy settings have made it so you cannot directly message them unless they follow you.</p> : <>
                    <div id="messages-container">
                        {messages.length == 0 ? <p className="notice">You have received no messages from this person.</p> : <>
                            <div id="messages">
                                        {Object.keys(groupedMessages).map(date => (
                                            <div className="message-date-period" key={date}>
                                                <span>
                                                    {new Date(date).toLocaleString('en-US', { 
                                                        day: '2-digit', 
                                                        month: '2-digit', 
                                                        year: 'numeric' 
                                                    })}
                                                </span>
                                                {groupedMessages[date].map((message, index) => (
                                                    <Message
                                                        key={index}
                                                        id={message.author}
                                                        profile_id={user.id}
                                                        content={message.content}
                                                        time={message.time}
                                                        read={message.read}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                            </div>
                        </>}
                        {!user.read_only ? <>
                            <div id="send-message">
                                <textarea className="inputfield" placeholder={`Write a message for ${user.username}...`} value={message} onChange={(ev) => setMessage(ev.target.value)}></textarea>
                                <button onClick={sendMessage}>Send Message</button>
                            </div>
                        </> : <p className="notice">Sending messages to this user is restricted.</p>}
                    </div>
                </>}
            </div>}
            
        </div>
    </div>)
}