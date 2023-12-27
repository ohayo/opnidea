import { useState } from 'react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import Cookies from 'js-cookie';
import '../css/post.css'
import Thumbnail from '../components/thumbnail';
import Alert from "../components/alert";
import Comment from '../components/comment';

export default function Post() {
    const { postId } = useParams();

    let [post, setPost] = useState(null);
    let [currentFile, setCurrentFile] = useState({});
    let [loading, setLoading] = useState(true);
    let [collections, setCollections] = useState([]);
    let [noCollections, setNoCollections] = useState(false);
    let [collectionAdd, setCollectionAdd] = useState("");
    let [collecting, setCollecting] = useState(false);
    let [showingCaption, setShowingCaption] = useState(false);
    let [postIndex, setPostIndex] = useState(0);
    let [comments, setComments] = useState(false);
    let [context, setContext] = useState({});
    let [likes, setLikes] = useState(0);
    let [notif, setNotif] = useState(null);
    let [comment, setComment] = useState("");
    let [error, setError] = useState(false);

    useEffect(() => {
        async function fetchPostInfo() {
            try {
                const response = await fetch(`/api/posts/${postId}`, {
                    headers: {
                        'Authorization' : localStorage.getItem("opnidea-session")
                    }
                });
    
                if (response.status != 200) {
                    setPost(null);
                    setLoading(false);
                } else {
                    const data = await response.json();
    
                    setPostIndex(postIndex + 1);
                    setCurrentFile(data.attachments[postIndex]);
    
                    setPost(data);
                    setContext(data.context);
    
                    setLikes(data.likes);
                    fetchCollections();
                    checkCommentsPreference();
                }
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
            }
        }

        if (post == null) {
            fetchPostInfo();
        }
    });

    function backAttachment() {
        if (postIndex == 0) {
            return;
        }

        setPostIndex(postIndex - 1);

        if (!post.attachments[postIndex]) {
            setPostIndex(0);
            setCurrentFile(post.attachments[0]);
            return;
        }

        setCurrentFile(post.attachments[postIndex]);
    }

    function nextAttachment() {
        if (postIndex == post.attachments.length) {
            return;
        }

        if (!post.attachments[postIndex]) {
            setPostIndex(0);
            setCurrentFile(post.attachments[0]);
            return;
        }

        setPostIndex(postIndex + 1);
        setCurrentFile(post.attachments[postIndex]);
    }

    function like() {
        try {
            fetch(`/api/posts/${postId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type' : 'application/json',
                  'Authorization' : localStorage.getItem('opnidea-session'),
                },
                body: JSON.stringify({
                  action: "like"
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
                        liked: data.result == "liked",
                        posted_by_you: context.posted_by_you
                   })
    
                   setLikes(data.result == "liked" ? likes + 1 : likes - 1);
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
    
            data = data.filter(x => x.name != "Your Liked Posts");
    
            data = data.filter(x => x.posts.filter(y => y.id == postId).length == 0);
    
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

    async function checkCommentsPreference() {
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
    
            setComments(data.preferences.comments_enabled);
        }
        catch(error) {
            console.log(error);
            alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
        }
    }

    function addToCollection() {
        try {
            fetch(`/api/collections/${collectionAdd}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type' : 'application/json',
                  'Authorization' : localStorage.getItem('opnidea-session'),
                },
                body: JSON.stringify({
                    add_post: postId
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
                    setNotif(`Added to collection successfully!`);
    
                    setTimeout(() => {
                        setNotif(null);
                    }, 5000);
    
                   setCollecting(false);
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

    function reportPost() {
        try {
            fetch(`/api/posts/${postId}`, {
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

    function publishComment() {
        try {
            if (comment == "" || comment == null || !comment) {
                alert('You need to provide a valid comment!');
                return;
            }
    
            fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                  'Content-Type' : 'application/json',
                  'Authorization' : localStorage.getItem('opnidea-session'),
                },
                body: JSON.stringify({
                    content: comment
                })
            }).then(response => response.json()).then(data => {
                if (data.message) {
                    alert(data.message);
                } else {
                    alert('Comment posted successfully!');
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

    function deletePost() {
        try {
            fetch(`/api/posts/${postId}`, {
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
                    window.location.reload();
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

    function isVideo(thing) {
        return thing && (thing.includes(".mp4") || thing.includes(".mov") || thing.includes(".webm"))
    }

    return (
        post == null ?
        (<div id="content">
            <Navbar/>
            <div id="body" className="centered">
                {notif != null ? (error ? <Alert message={notif} warning></Alert> : <Alert message={notif}></Alert>) : <></>}
                {loading ? (
                    <>
                        <div className="header">
                            <h1>Loading post</h1>
                            <h2>Please wait...</h2>
                        </div>
                    </>
                ) : <>
                    <div className="header">
                        <h1>Uh oh!</h1>
                        <h2>Looks like we couldn't find that post.</h2>
                        <Link to='/explore'>Try find something else.</Link>
                    </div>
                </>}
            </div>
            <Footer/>
        </div>) : (<div id="content">
            <Navbar/>
            {collecting ? <>
                <div id="overlay">
                    <div className='collection-add-wrapper'>
                        <div id='add-to-collection'>
                            <h1>Add This Post To A Collection</h1>
                            <select className="inputselect" onChange={(ev) => setCollectionAdd(ev.target.value)} value={collectionAdd}>
                                <option value="">Select a Collection</option>
                                {collections.map((collection, index) => (
                                    <option value={collection.id} key={index}>{collection.name}</option>
                                ))}
                            </select>
                            <button className='submit-btn' onClick={addToCollection} hidden={collectionAdd == ""}>Add To Collection</button>
                            <button className='submit-btn' onClick={() => setCollecting(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            </> : showingCaption ? <>
                <div id="overlay">
                        <div className='caption-container'>
                            <div id='full-caption'>
                                <p>
                                    {post.caption}
                                </p>
                                <button className='submit-btn' onClick={() => setShowingCaption(false)}>Close</button>
                            </div>
                        </div>
                    </div>
            </> : <></>}
            <div id="other-wrapper" className="centered">
                <div id="post-container" className='truly-centered'>
                    <div className='post'>
                        <div className='post-top'>
                            <h1>Posted by <Link to={`/profiles/${post.author.id}`}>@{post.author.username}</Link></h1>
                            <span>On {new Date(post.date).toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric' })}</span>
                            <h3>{post.attachments.length} attachment(s)</h3>
                        </div>
                        <div className='post-body'>
                            <div className='post-caption'>
                                "{post.caption.length > 40 ? post.caption.slice(0, 40): post.caption}
                                {post.caption.length > 40 ? <span class='view-more-caption' title='View whole post caption' onClick={() => setShowingCaption(true)}>...</span> : <></>}"
                            </div>
                            <div className='post-attachments'>
                                {!isVideo(currentFile.link) ? (<a href={currentFile.link}><img src={currentFile.link} alt={currentFile.original}></img></a>) : <video src={currentFile.link} controls></video>}
                            </div>
                            {post.attachments.length > 1 ? <>
                                <div className='post-attachment-controls'>
                                    <button onClick={backAttachment} style={postIndex == 0 ? {color: 'transparent', border: 'none'} : {}}>Back</button>
                                    <button onClick={nextAttachment} style={postIndex == post.attachments.length ? {color: 'transparent', border: 'none'} : {}}>Next</button>
                                </div>
                            </> : <></>}
                            <div className='post-quick-click' style={post.attachments.length > 1 ? {} : {marginTop: '-5px'}}>
                                <button id="like" onClick={like}>{context && context.liked ? `Unlike` : 'Like'}</button>
                                {!noCollections ? <button id="collect" onClick={() => setCollecting(true)}>Collect</button> : <></>}
                                {context.posted_by_you ? <button id="delete" onClick={deletePost}>Delete</button> : <></>}
                                <button id="report" onClick={reportPost}>Report</button>
                            </div>
                            <div className='post-stats'>
                                {likes} likes / {post.collections.length} collections
                            </div>
                        </div>
                    </div>
                    {post.collections.length > 0 ? 
                    <>
                        <div id='collections'>
                            <h1>In {post.collections.length} public collection(s)</h1>
                            {post.collections.length > 6 ? 
                            <>
                                <div id='view-all'>
                                    <Link to={`/more-like?post=${post.id}`}>View All</Link>
                                </div>
                            </> : <></>}
                            <div id='collections-preview'>
                                {post.collections.map((collection, index) => (
                                    <Thumbnail key={index} name={collection.name} hashtag={false} posts={collection.posts.length} custom_url={`/collections/${collection.id}`}></Thumbnail>
                                ))}
                            </div>
                        </div>
                    </> : <></>}
                </div>
                {post.comments != undefined && comments ? <>
                    <div id="comments-container">
                        <div id="comments" style={{'--comments-amount-text': `'${post.comments.length} COMMENT(S)'`}}>
                            {post.comments.map((comment, index) => (
                                <Comment props={comment} key={index}></Comment>
                            ))}
                        </div>
                        <div id="leave-comment">
                            <textarea id="comment-content" maxLength={500} placeholder='Leave a comment' value={comment} onChange={(ev) => setComment(ev.target.value)}></textarea>
                            <button onClick={publishComment}>Add Comment</button>
                        </div>
                    </div>
                </> : <></>}
            </div>
        </div>)
    )
}