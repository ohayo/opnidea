import { useState } from 'react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import Cookies from 'js-cookie';
import '../css/post.css'
import Thumbnail from '../components/thumbnail';
import Preview from '../components/preview';
import Alert from "../components/alert";

export default function Collection() {
    const { collectionId } = useParams();

    const queryParams = new URLSearchParams(window.location.search);

    let at = 0;
    let to = 100;

    if (queryParams.get('at') && queryParams.get('to')) {
        at = parseInt(queryParams.get('at')) || 0;
        to = parseInt(queryParams.get('to')) || 100;
    }

    let [posts, setPosts] = useState([]);
    let [collection, setCollection] = useState({});
    let [noPosts, setnoPosts] = useState(false);
    let [privacy, setPrivacy] = useState("");
    let [myself, setMyself] = useState({});
    let [loading, setLoading] = useState(true);
    let [editingCollection, setEditingCollection] = useState(false);
    let [collectionName, setCollectionName] = useState("");
    let [notif, setNotif] = useState(null);
    let [error, setError] = useState(false);

    useEffect(() => {
        async function fetchCollection() {
            try {
                const response = await fetch(`/api/collections/${collectionId}`, {
                    headers: {
                        'Authorization' : localStorage.getItem("opnidea-session")
                    }
                });
    
                if (response.status != 200) {
                    setnoPosts(true);
                    setLoading(false);
                    return;
                }
    
                let data = await response.json();
    
                if (data.posts.length == 0) {
                    setnoPosts(true);
                    setLoading(false);
                    return;
                }
    
                setCollection(data);
                setCollectionName(data.name);
                setPosts(data.posts);
                setLoading(false);
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
            }
        }

        async function fetchMyself() {
            try {
                const response = await fetch(`/api/myself`, {
                    headers: {
                        'Authorization' : localStorage.getItem("opnidea-session")
                    }
                });
    
                if (response.status != 200) {
                    return;
                }
    
                let data = await response.json();
    
                setMyself(data);
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
            }
        }

        if (posts.length == 0 && !noPosts) {
            fetchCollection();
            fetchMyself();
        }
    }, []);

    const groupPostsIntoRows = (posts) => {
        const rows = [];
        for (let i = 0; i < posts.length; i += 5) {
            rows.push(posts.slice(i, i + 5));
        }
        return rows;
    };

    const getRemainingPosts = () => {
        const totalPosts = posts.length;
        const remainingPosts = totalPosts - to;
        const nextTo = remainingPosts > 0 ? to + 100 : totalPosts;
        const prevTo = at === 0 ? 0 : at - 100;

        return { nextTo, prevTo };
    };

    const { nextTo, prevTo } = getRemainingPosts();

    function deleteCollection() {
        try {
            fetch(`/api/collections/${collectionId}`, {
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
                    setnoPosts(true);
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

    function saveCollection() {
        try {
            fetch(`/api/collections/${collectionId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type' : 'application/json',
                  'Authorization' : localStorage.getItem('opnidea-session'),
                },
                body: JSON.stringify({
                    privacy: privacy,
                    name: collectionName
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
                    setNotif('Collection saved successfully.');
    
                    setTimeout(() => {
                        setNotif(null);
                    }, 5000);
    
                    let new_collection = collection;
    
                    new_collection.privacy = privacy.toLowerCase() == "public" ? 0 : (privacy.toLowerCase() == "semi-public" ? 1 : 2)
                    new_collection.name = collectionName;
                    
                    setEditingCollection(false)
                    setCollection(new_collection);
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
        noPosts ?
        <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                <div className="header">
                    <h1>Uh oh!</h1>
                    <h2 style={{fontSize: '13px'}}>Looks like there's either no posts in this collection or it couldn't be found.</h2>
                    <Link to='/explore'>Maybe go back?</Link>
                </div>
            </div>
            <Footer/>
        </div> : <div id="content">
            <Navbar/>
            {!loading ? <>
                <div id="body" className="centered">
                {notif != null ? (error ? <Alert message={notif} warning></Alert> : <Alert message={notif}></Alert>) : <></>}
                <div id="category" className='truly-centered'>
                    <h1>{!editingCollection ? collection.name : 'Editing ' + collection.name}</h1>
                    {
                        !editingCollection ? (<>
                            {myself.id == collection.author_id ? (
                                <p className='quick-notice'>
                                    {collection.privacy == 0 ? `This collection is public. It will show up in search, when someone uses its shared link, etc.` : (collection.privacy == 1 ? 'This collection is semi-public. It will only show when someone visits via its shared link.' : 'This collection is private. Only you can see it, no matter the context.')}
                                </p>
                            ) : <></>}
                            {myself.id == collection.author_id ? (<div id="collection-shit">
                                <button className='submit-btn' onClick={() => setEditingCollection(true)}>Edit Collection</button>
                                <button className='submit-btn' onClick={deleteCollection}>Delete Collection</button>
                            </div>) : <></>}
                            <div id='category-controls'>
                                {posts.length > 100 ? <>
                                    {at > 0 ? (<Link to={`/collections/${collectionId}?at=${prevTo}&to=${at}`}>Back</Link>) : <></>}
                                    <span>Showing {at + 1} to {to} of {posts.length} post(s)</span>
                                    <Link to={`/collections/${collectionId}?at=${nextTo}&to=${nextTo + 100}`}>Next</Link>
                                </> : <>
                                    <span>Showing {posts.length} of {posts.length} post(s)</span>
                                </>}
                            </div>
                            <div id="post-previews" style={{marginTop: '20px'}}>
                                    {groupPostsIntoRows((posts.slice(at, to))).map((row, rowIndex) => (
                                        <div id="post-preview-row" key={rowIndex}>
                                            {row.map((post) => (
                                                <Preview key={post.id} data={post} />
                                            ))}
                                    </div>
                        ))}
                        </div></>) : (<>
                                <div id='collection-creation'>
                                <input placeholder="New Name" type="text" className="inputfield" onChange={(ev) => setCollectionName(ev.target.value)} ></input>
                                <select className="inputselect" onChange={(ev) => setPrivacy(ev.target.value)} value={privacy}>
                                    <option value="Public">Public</option>
                                    <option value="Semi-Public">Semi-Public (Link Only)</option>
                                    <option value="Private">Private</option>
                                </select>
                                <button className="submit-btn" onClick={saveCollection}>Save Collection</button>
                                <button className="submit-btn" onClick={() => setEditingCollection(false)}>Cancel</button>
                            </div>
                        </>)
                    }
                </div>
            </div>
            </> : <>
            <div id="body" className="centered">
                <div className="header">
                    <h1>Loading collection</h1>
                    <h2>Please wait...</h2>
                </div>
            </div>
            </>}
            
        </div>
    )
}