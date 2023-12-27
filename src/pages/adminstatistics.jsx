import { useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useEffect } from "react";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";
import Alert from "../components/alert";

import '../css/admin.css';

export default function AdminStats() {
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
        }

        async function fetchStats() {
            const response = await fetch(`/api/admin/stats`, {
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

            setStats(data);
        }

        if (virtualSelf == null && stats == null) {
            fetchSelf();
            fetchStats();
        }
    });

    let [noAccess, setNoAccess] = useState(true);
    let [stats, setStats] = useState(null);
    let [virtualSelf, setVirtualSelf] = useState(null);
    let [notif, setNotif] = useState(null);
    let [error, setError] = useState(false);

    return noAccess || stats == null ? (
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
                    <h1>OPNIDEA ADMIN / STATISTICS</h1>
                    <div id="admin-stats">
                        <div className="admin-statblock" id="admin-users">
                            <h1>There are <span className="admin-important">{stats.users_registered}</span> user(s) registered.</h1>
                            <Link to="/admin/users">Moderate</Link>
                        </div>
                        <div className="admin-statblock" id="admin-users">
                            <h1>With <span className="admin-important">{stats.fallen_users}</span> of those banned.</h1>
                        </div>
                        <div className="admin-statblock" id="admin-posts">
                            <h1>There are <span className="admin-important">{stats.posts_made}</span> post(s).</h1>
                            <Link to="/admin/posts">Moderate</Link>
                        </div>
                        <div className="admin-statblock" id="admin-files">
                            <h1>With <span className="admin-important">{stats.size_used}</span>/<span className="admin-important">310.09GB</span> used over <span className="admin-important">{stats.attachments_exist}</span> post attachment(s).</h1>
                            <span className="admin-important">{stats.attachments_censored} of those actively censored.</span>
                        </div>
                        <div className="admin-statblock" id="admin-mods">
                            <h1>With <span className="admin-important">{stats.moderators_assigned}</span> moderator(s) assigned.</h1>
                        </div>
                    </div>
                </div>
            </div>
            <Footer/>
        </div>
    )
}