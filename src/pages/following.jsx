import { useState } from 'react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import Cookies from 'js-cookie';
import '../css/post.css'

export default function Following() {
    useEffect(() => {
        if (!localStorage.getItem("opnidea-session")) {
          window.location.href = '/login';
        }
    });

    const { userId } = useParams();

    let [profile, setProfile] = useState({});
    let [noFollowers, setNoFollowers] = useState(false);
    let [followers, setFollowers] = useState([]);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const response = await fetch(`/api/profiles/${userId}`, {
                    headers: {
                        'Authorization' : localStorage.getItem("opnidea-session")
                    }
                });
    
               if (response.status != 200) {
                    setNoFollowers(true);
                    return;
                }
    
                let data = await response.json();
    
                if (data.following.length == 0) {
                    setNoFollowers(true);
                    return;
                }
    
                setProfile(data);
                setFollowers(data.following);
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
            }
        }

        if (followers.length == 0 && !noFollowers) {
            fetchProfile();
        }
    });

    return (
        noFollowers ?
        <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                <div className="header">
                    <h1>Uh oh!</h1>
                    <h2 style={{fontSize: '13px'}}>This person isn't following anyone.</h2>
                    <Link to={`/profiles/${userId}`}>Maybe go back?</Link>
                </div>
            </div>
            <Footer/>
        </div> : <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                <div id="category" className='truly-centered'>
                    <h1><Link to={`/profiles/${userId}`} className='profile-link'>{profile.username}</Link>'s following</h1>
                    <div id="followers">
                        {followers.map((follower, index) => (
                            <div className='follower-detail' style={{width: '900px'}} key={index}>
                                <img src={follower.avatar}></img>
                                <h1><Link to={`/profiles/${follower.id}`} className='profile-link'>@{follower.username}</Link></h1>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}