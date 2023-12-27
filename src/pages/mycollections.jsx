import { useState } from 'react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import Cookies from 'js-cookie';
import '../css/post.css'
import Preview from '../components/preview';
import Thumbnail from '../components/thumbnail';
import Alert from "../components/alert";

export default function MyCollections() {
    useEffect(() => {
        if (!localStorage.getItem("opnidea-session")) {
          window.location.href = '/login';
        }
    });

    let [collections, setCollections] = useState([]);
    let [noCollections, setNoCollections] = useState(false);
    let [creatingCollection, setCreatingCollection] = useState(false);
    let [creationName, setCreationName] = useState("");
    let [privacy, setPrivacy] = useState("Public");
    let [notif, setNotif] = useState(null);
    let [error, setError] = useState(false);

    async function fetchCollections() {
        try {
            const response = await fetch(`/api/myself/collections`, {
                headers: {
                    'Authorization' : localStorage.getItem("opnidea-session")
                }
            });
    
            if (response.status != 200) {
                setNoCollections(true);
                return;
            }
    
            let data = await response.json();
    
            if (data.length == 0) {
                setNoCollections(true);
                return;
            }
    
            setCollections(data);
        }
        catch(error) {
            console.log(error);
            alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
        }
    }

    useEffect(() => {
        if (collections.length == 0 && !noCollections) {
            fetchCollections();
        }
    });

    function createCollection() {
        try {
            fetch(`/api/myself/collections`, {
                method: 'POST',
                headers: {
                  'Content-Type' : 'application/json',
                  'Authorization' : localStorage.getItem('opnidea-session'),
                },
                body: JSON.stringify({
                    name: creationName,
                    privacy: privacy
                })
            }).then(response => response.json()).then(data => {
                if (data.message) {
                    setError(true);
                    setNotif(data.message);
    
                    setTimeout(() => {
                        setNotif(null);
                    }, 5000);
                } else {
                    fetchCollections();
                    setCreatingCollection(false);
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

    return (
        <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                {notif != null ? (error ? <Alert message={notif} warning></Alert> : <Alert message={notif}></Alert>) : <></>}
                <div id="mycollections" className='truly-centered'>
                    <h1>My Collections</h1>
                    {!creatingCollection ? <p>{collections.length == 0 ? 'You currently have no collections.' : `You have ${collections.length} collection(s). Click on one to explore further actions.`}</p>: <></>}
                    {collections.length > 0 ? (
                        <div id='collections'>
                            <div id='collections-preview'>
                                {collections.map((collection, index) => (
                                    <Thumbnail key={index} name={collection.name} hashtag={false} posts={collection.posts.length} custom_url={`/collections/${collection.id}`}></Thumbnail>
                                ))}
                            </div>
                        </div>
                    ) : <></>}
                    {creatingCollection ? (
                        <div id='collection-creation'>
                            <input placeholder="Enter Name" type="text" className="inputfield" onChange={(ev) => setCreationName(ev.target.value)} ></input>
                            <select className="inputselect" onChange={(ev) => setPrivacy(ev.target.value)} value={privacy}>
                                <option value="Public">Public</option>
                                <option value="Semi-Public">Semi-Public (Link Only)</option>
                                <option value="Private">Private</option>
                            </select>
                            <button className="submit-btn" onClick={createCollection}>Create Collection</button>
                            <button className="submit-btn" onClick={() => setCreatingCollection(false)}>Cancel</button>
                        </div>) : (collections.length < 7 ? 
                            <div id='collection-controls'>
                                <button className='submit-btn' onClick={() => setCreatingCollection(true)}>New Collection</button>
                            </div> : <></>
                        )
                    }
                </div>
            </div>
            <Footer></Footer>
        </div>
    )
}