import { useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useEffect } from "react";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";
import Alert from "../components/alert";

import '../css/admin.css';

export default function AdminPosts() {
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
            fetch(`/api/admin/posts/${searchQuery}`, {
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
                    setPost(data);
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

    function deletePost() {
        fetch(`/api/admin/posts/${searchQuery}`, {
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
                setNotif('Post has been deleted.');

                setTimeout(() => {
                 setNotif(null);
                }, 5000);

                setPost(null);
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

    let [noAccess, setNoAccess] = useState(true);
    let [searchQuery, setQuery] = useState("");
    let [post, setPost] = useState(null);
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
                    <h1>OPNIDEA ADMIN / POSTS</h1>
                    <div id="adminusersmanagement">
                        <input type="text" placeholder="Lookup a post by its ID" className="truly-centered" onChange={(ev) => setQuery(ev.target.value)} onKeyDown={handleSearch}></input>
                        {(post != null ? (
                                <div className="admin-user-management-wrapper">
                                <div className="admin-user-selected">
                                    <img src={post.attachments[0].link}></img>
                                    <h1>by @<Link to={`/profiles/${post.author.id}`}>{post.author.username}</Link></h1>
                                    <div className="admin-user-selected-category">
                                        <h1>Post ID</h1>
                                        <h2>{post.id}</h2>
                                    </div>
                                    <div className="admin-user-selected-category">
                                        <h1>Caption</h1>
                                        <h2>{post.caption}</h2>
                                    </div>
                                    <div className="admin-user-selected-category">
                                        <h1>UNDER CATEGORY</h1>
                                        <h2>{post.category}</h2>
                                    </div>
                                    <span>POST ACTIONS</span>
                                    <div className="admin-user-actions">
                                        <button className="submit-btn" onClick={deletePost}>Delete</button>
                                        <button className="submit-btn">Censor</button>
                                    </div>
                                </div>
                            </div>
                        ) : <></>)}
                    </div>
                </div>
            </div>
        </div>
    )
}