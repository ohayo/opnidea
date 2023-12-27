import { useState } from 'react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import Cookies from 'js-cookie';
import '../css/post.css'
import Preview from '../components/preview';

export default function Trending() {
    const { hashtag } = useParams();

    let [posts, setPosts] = useState([]);
    let [noPosts, setnoPosts] = useState(false);

    useEffect(() => {
        async function fetchPosts() {
            try {
                const response = await fetch(`/api/trending`, {
                    headers: {
                        'Authorization' : localStorage.getItem("opnidea-session")
                    }
                });
    
                if (response.status != 200) {
                    setnoPosts(true);
                    return;
                }
    
                let data = await response.json();
    
                if (hashtag) {
                    data = data.filter(x => x.caption.toLowerCase().includes(hashtag.toLowerCase()));
                }
    
                if (data.length == 0) {
                    setnoPosts(true);
                    return;
                }
    
                setPosts(data)
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
            }
        }

        if (posts.length == 0 && !noPosts) {
            fetchPosts();
        }
    });

    const groupPostsIntoRows = (posts) => {
        const rows = [];
        for (let i = 0; i < posts.length; i += 5) {
            rows.push(posts.slice(i, i + 5));
        }
        return rows;
    };

    return (
        noPosts ?
        <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                <div className="header">
                    <h1>Uh oh!</h1>
                    <h2>Looks like there's nothing trending.</h2>
                    <Link to='/publish'>Why not get a hashtag trending?</Link>
                </div>
            </div>
            <Footer/>
        </div> : <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                <div id="category" className='truly-centered'>
                    <h1>Trending {hashtag ? 'under #' + hashtag : ''}</h1>
                    <div id='category-controls'>
                        <span>Showing {posts.length} of {posts.length} post(s)</span>
                    </div>
                    <div id="post-previews" style={{marginTop: '20px'}}>
                            {groupPostsIntoRows((posts.slice(0, 100))).map((row, rowIndex) => (
                                <div id="post-preview-row" key={rowIndex}>
                                    {row.map((post) => (
                                        <Preview key={post.id} data={post} />
                                    ))}
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    )
}