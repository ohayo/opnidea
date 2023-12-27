import { useState } from "react";
import { useEffect } from "react";
import '../css/notifications.css'

export default function Notifications() {
    let [notifications, setNotifications] = useState([]);
    let [noNotifications, setNoNotifications] = useState(false);
    let [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNotifications() {
            const response = await fetch("/api/myself/notifications", {
                headers: {
                    'Authorization' : localStorage.getItem("opnidea-session")
                }
            });

            if (response.status != 200) {
                setNoNotifications(true);
                setLoading(false);
                return;
            }

            const data = await response.json();

            if (data.length == 0) {
                setNoNotifications(true);
                setLoading(false);
                return;
            }

            setNotifications(data);
            setLoading(false);
        }

        if (notifications.length == 0 && !noNotifications) {
            fetchNotifications();
        }
    });

    return (loading ? <>
        <div id="overlay">
            <div id="notifications-wrapper" style={{'--notifications-text': `You have no notifications.`}}>
                <div id="notifications">
                    <p>Loading notifications...</p>
                </div>
            </div>
        </div>
    </> : noNotifications ? <>
        <div id="overlay">
            <div id="notifications-wrapper"  style={{'--notifications-text': `You have no notifications.`}}>
                <div id="notifications">
                    <p>You have no notifications.</p>
                </div>
            </div>
        </div>
    </> : <>
        <div id="overlay">
            <div id="notifications-wrapper" style={{'--notifications-text': `You have no notifications.`}}>
                <div id="notifications">
                    <div className="notification">
                        <p>hey</p>
                    </div>
                </div>
                <button>Close</button>
            </div>
        </div>
    </>)
}