import { useState } from 'react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import Cookies from 'js-cookie';
import '../css/post.css'
import Preview from '../components/preview';
import Thumbnail from '../components/thumbnail';
import Alert from "../components/alert";

export default function Profile() {
    useEffect(() => {
        if (!localStorage.getItem("opnidea-session")) {
          window.location.href = '/login';
        }
    });

    const { userid } = useParams();

    let [user, setUser] = useState(null);
    let [posts, setPosts] = useState([]);
    let [collections, setCollections] = useState([]);
    let [context, setContext] = useState({});
    let [preferences, setPreferences] = useState(null);
    let [loading, setLoading] = useState(true);
    let [followingCount, setFollowingCount] = useState(0);
    let [followerCount, setFollowerCount] = useState(0);
    let [notif, setNotif] = useState(null);
    let [error, setError] = useState(false);

    useEffect(() => {
        async function fetchProfileInfo() {
            try {
                const response = await fetch(`/api/profiles/${userid}`, {
                    headers: {
                        'Authorization' : localStorage.getItem("opnidea-session")
                    }
                });
    
                if (response.status != 200) {
                    setUser(null);
                    setLoading(false);
                } else {
                    const data = await response.json();
    
                    setUser(data);
                    setFollowingCount(data.following.length);
                    setContext(data.context);
                    setFollowerCount(data.followers.length);
                }
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
            }
        }

        async function fetchPosts() {
            try {
                const response = await fetch(`/api/profiles/${userid}/posts`, {
                    headers: {
                        'Authorization' : localStorage.getItem("opnidea-session")
                    }
                });
    
                if (response.status != 200) {
                    setPosts([]);
                } else {
                    const data = await response.json();
    
                    setPosts(data);
                }
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
            }
        }

        async function fetchCollections() {
            try {
                const response = await fetch(`/api/profiles/${userid}/collections`, {
                    headers: {
                        'Authorization' : localStorage.getItem("opnidea-session")
                    }
                });
    
                if (response.status != 200) {
                    setCollections([]);
                } else {
                    const data = await response.json();
    
                    setCollections(data);
                }
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
            }
        }

        async function fetchPreferences() {
            try {
                const response = await fetch(`/api/myself`, {
                    headers: {
                        'Authorization' : localStorage.getItem("opnidea-session")
                    }
                });
    
                if (response.status != 200) {
                    setCollections([]);
                } else {
                    const data = await response.json();
    
                    setPreferences(data.preferences);
                    setLoading(false);
                }
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
            }
        }

        if (user == null && posts.length == 0 && collections.length == 0 && preferences == null) {
            fetchProfileInfo();
            fetchPosts();
            fetchCollections();
            fetchPreferences();
        }
    });

    const groupPostsIntoRows = (posts) => {
        const rows = [];
        for (let i = 0; i < posts.length; i += 5) {
            rows.push(posts.slice(i, i + 5));
        }
        return rows;
    };

    function follow() {
        try {
            fetch(`/api/profiles/${userid}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type' : 'application/json',
                  'Authorization' : localStorage.getItem('opnidea-session'),
                },
                body: JSON.stringify({
                  action: "follow"
                })
            }).then(response => response.json()).then(data => {
                if (data.message) {
                    setError(true);
                    setNotif(data.message);
    
                    setTimeout(() => {
                        setNotif(null);
                    }, 5000);
                } else {
                   setContext({
                        following: data.result == "followed",
                        you: context.you
                   })
    
                   setFollowerCount(data.result == "followed" ? followerCount + 1 : followerCount - 1);
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

    function report() {
        try {
            fetch(`/api/profiles/${userid}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type' : 'application/json',
                  'Authorization' : localStorage.getItem('opnidea-session'),
                },
                body: JSON.stringify({
                  action: "report"
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
                    setNotif(`Thank you for your report! A member of our moderation team will respond as soon as possible.`);
    
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

    function editProfile() {
        window.location.href = '/settings';
        //idk to-do make quick access
    }

    function playMusicIfAny() {
        if (!preferences || !preferences.music_enabled) {
            return;
        }

        if (document.getElementById("profile-music")) {
            document.getElementById("profile-music").play();
        }
    }

    return (
        user == null ?
        <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                {notif != null ? (error ? <Alert message={notif} warning></Alert> : <Alert message={notif}></Alert>) : <></>}
                {loading ? <>
                    <div className="header">
                        <h1>Loading profile</h1>
                        <h2>Please wait...</h2>
                    </div>
                </> : <>
                    <div className="header">
                        <h1>Uh oh!</h1>
                        <h2>Looks like we couldn't find that user.</h2>
                        <Link to='/explore'>Try find something else.</Link>
                    </div>
                </>}
            </div>
            <Footer/>
        </div> : <div id="content" onMouseOver={playMusicIfAny}>
            <Navbar/>
            {user.music_url != null ? <audio src={user.music_url} loop={true} volume={(preferences && preferences.music_volume) ? parseFloat(preferences.music_volume.toString()) / 100 : 0.3} id="profile-music"></audio> : <></>}
            <div id="body" className="centered">
                {notif != null ? (error ? <Alert message={notif} warning></Alert> : <Alert message={notif}></Alert>) : <></>}
                <div id="profile-container" className='truly-centered'>
                    <div id='profile-details'>
                        {user.banner != null ? 
                        <>
                            <div id="profile-banner" style={{background: `url('${user.banner}')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'cover'}}>
                                <img src={user.avatar}></img>
                            </div>
                        </> : <img src={user.avatar}></img>}
                        <h1 style={user.banner != null ? {marginTop: '-40px'} : {}}>@{user.username}</h1>
                        {user.badges.length > 0 ? (
                            <h1>
                                {user.badges.map((badge, index) => (
                                    <span key={index}>{badge.toUpperCase()}</span>
                                ))}
                            </h1>
                        ) : <></>}
                        {user.pronouns != null && user.pronouns.length > 0 ? (
                            <h1>
                                {user.pronouns.map((pronoun, index) => (
                                    <span key={index}>{pronoun}</span>
                                ))}
                            </h1>
                        ) : <></>}
                        {user.bio != null ? <h2>{user.bio}</h2> : <></>}
                        <div id='popularity'>
                            <h1><Link to={`/profiles/${userid}/followers`} className='profile-href'>{followerCount} follower(s)</Link>  - <Link to={`/profiles/${userid}/following`} className='profile-href'>{followingCount} following</Link></h1>
                            <h2>{posts.length} post(s) - {collections.length} collection(s)</h2>
                        </div>
                        <div id="profile-action-buttons">
                            {!context.you ? (<button className='submit-btn' onClick={follow}>{context.following ? "Unfollow" : "Follow"}</button>) : (<button className='submit-btn' onClick={editProfile}>Edit Profile</button>)}
                            {!context.you && context.can_message ? (<button className='submit-btn' onClick={() => window.location.href = `/messages/${user.id}`}>Message</button>) : <></>}
                            {!context.you ? (<button className='submit-btn' onClick={report}>Report</button>) : <></>}
                        </div>
                    </div>
                    {user.privacy != 0 && !context.following && !context.you ? <></> : (
                        <div id="post-previews">
                        {groupPostsIntoRows(posts).map((row, rowIndex) => (
                            <div id="post-preview-row" key={rowIndex}>
                                {row.map((post) => (
                                    <Preview key={post.id} data={post} />
                                ))}
                            </div>
                        ))}
                        </div>
                    )}
                    {collections.length > 0 && !context.you ? (
                        <div id='collections'>
                            <h1>@{user.username}'s public collection(s)</h1>
                            {collections.length > 6 ? 
                            <>
                                <div id='view-all'>
                                    <Link to={`/profiles/${userid}/collections`}>View All</Link>
                                </div>
                            </> : <></>}
                            <div id='collections-preview'>
                                {collections.map((collection, index) => (
                                    <Thumbnail key={index} name={collection.name} hashtag={false} posts={collection.posts.length} custom_url={`/collections/${collection.id}`}></Thumbnail>
                                ))}
                            </div>
                        </div>
                    ) : <></>}
                </div>
            </div>
        </div>
    )
}