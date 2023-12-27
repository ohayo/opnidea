import { useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useEffect } from "react";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";
import Alert from "../components/alert";

import '../css/admin.css';

export default function Admin() {
    useEffect(() => {
        if (!localStorage.getItem("opnidea-session")) {
          window.location.href = '/login';
        }

        async function fetchSelf() {
            const response = await fetch(`/api/myself`, {
                headers: {
                    'Authorization' : localStorage.getItem("opnidea-session")
                }
            });

            if (response.status != 200) {
                setError(true);
                setNotif('Something went wrong while fetching your account information. Try again later.');

                setTimeout(() => {
                    setNotif(null);
                }, 5000);

                return;
            }
            
            const data = await response.json();

            if (!data.moderator) {
                setError(true);
                setNotif('Something went wrong while fetching your account information. Try again later.');

                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                
                return;
            }

            setNoAccess(false);
            setVirtualSelf(data);

            console.log(data);
        }

        if (virtualSelf == null) {
            fetchSelf();
        }
    });

    let [noAccess, setNoAccess] = useState(true);
    let [virtualSelf, setVirtualSelf] = useState(null);
    let [notif, setNotif] = useState(null);
    let [error, setError] = useState(false);

    return noAccess ? (
        <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                <div className="header">
                    <h1>Uh oh!</h1>
                    <h2>Looks like you don't have access to this.</h2>
                    <Link to='/explore'>Try find something else.</Link>
                </div>
            </div>
            <Footer/>
        </div>
    ) : (
        <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                {notif != null ? (error ? <Alert message={notif} warning></Alert> : <Alert message={notif}></Alert>) : <></>}
                <div id="admin" className="truly-centered">
                    <h1>OPNIDEA ADMIN</h1>
                    <div id="admin-links">
                        <li>
                            <Link to="/admin/statistics">Statistics</Link>
                        </li>
                        <li>
                            <Link to="/admin/users">Users</Link>
                        </li>
                        <li>
                            <Link to="/admin/posts">Posts</Link>
                        </li>
                    </div>
                </div>
            </div>
            <Footer/>
        </div>
    )
}