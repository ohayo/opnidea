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

        if (virtualSelf == null) {
            fetchSelf();
        }
    });

    function handleSearch(ev) {
        if (ev.key === "Enter") {
            fetch(`/api/admin/users/${searchQuery}`, {
                method: 'GET',
                headers: {
                  'Content-Type' : 'application/json',
                  'Authorization' : localStorage.getItem('opnidea-session'),
                }
            }).then(response => response.json()).then(data => {
                if (data.message) {
                    setError(true);
                    setNotif(data.message);
    
                    setTimeout(() => {
                        setNotif(null);
                    }, 5000);
                } else {
                    setUser(data);
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
    }

    function deleteUser() {
        fetch(`/api/admin/users/${searchQuery}`, {
            method: 'DELETE',
            headers: {
              'Content-Type' : 'application/json',
              'Authorization' : localStorage.getItem('opnidea-session'),
            }
        }).then(response => response.json()).then(data => {
            if (data.message) {
                setError(true);
                setNotif(data.message);

                setTimeout(() => {
                    setNotif(null);
                }, 5000);
            } else {
                setError(false);
                setNotif('User has been deleted.');

                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                setUser(null);
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

    function saveChanges() {

    }

    let [noAccess, setNoAccess] = useState(true);
    let [editingInfo, setEditingInfo] = useState(false);
    let [searchQuery, setQuery] = useState("");
    let [newEmail, setNewEmail] = useState("");
    let [user, setUser] = useState(null);
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
                    <h1>OPNIDEA ADMIN / USERS</h1>
                    <div id="adminusersmanagement">
                        <input type="text" placeholder="Lookup a user by their ID, username or email" className="truly-centered" onChange={(ev) => setQuery(ev.target.value)} onKeyDown={handleSearch}></input>
                        {(user != null ? (
                                <div className="admin-user-management-wrapper">
                                <div className="admin-user-selected">
                                    <img src={user.avatar}></img>
                                    <h1>@{user.username}</h1>
                                    <div className="admin-user-selected-category">
                                        <h1>USER ID</h1>
                                        <h2>{user.id}</h2>
                                    </div>
                                    <div className="admin-user-selected-category">
                                        <h1>EMAIL</h1>
                                        {!editingInfo ? (<h2>{user.email}</h2>) : (<input className="inputfield" type="text" style={{marginTop: '20px', width: '50%', marginBottom: '10px'}} placeholder="Enter new mail" value={newEmail} onChange={(ev) => setNewEmail(ev.target.value)}></input>)}
                                    </div>
                                    <div className="admin-user-selected-category">
                                        <h1>STAFF</h1>
                                        <h2>{user.moderator ? 'YES' : 'NO'}</h2>
                                    </div>
                                    <span>USER ACTIONS</span>
                                    {editingInfo ? <>
                                        <div className="admin-user-actions">
                                            <button className="submit-btn" onClick={saveChanges}>Save Changes</button>
                                            <button className="submit-btn" onClick={() => setEditingInfo(false)}>Cancel</button>
                                        </div>
                                    </> : <div className="admin-user-actions">
                                            <button className="submit-btn" onClick={() => setEditingInfo(true)}>Edit Info</button>
                                            <button className="submit-btn" onClick={deleteUser}>Delete</button>
                                            <button className="submit-btn">Restrict</button>
                                        </div>}
                                </div>
                            </div>
                        ) : <></>)}
                    </div>
                </div>
            </div>
        </div>
    )
}