import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useEffect } from "react";
import Cookies from "js-cookie";
import { useState } from "react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import Alert from "../components/alert";

export default function Settings() {
    useEffect(() => {
        if (!localStorage.getItem("opnidea-session")) {
          window.location.href = '/login';
        }
    });

    let [virtualSelf, setSelf] = useState(null);
    let [tab, setTab] = useState("Account");
    let [changingPassword, setChangingPassword] = useState(false);
    let [changingEmail, setChangingEmail] = useState(false);
    let [newEmail, setEmail] = useState("");
    let [newPassword, setNewPassword] = useState("");
    let [musicUrl, setMusicUrl] = useState("");
    let [musicEnabled, setMusicEnabled] = useState(true);
    let [profilePrivacy, setProfilePrivacy] = useState("Public");
    let [DMPrivacy, setDMPrivacy] = useState("Everyone");
    let [pronouns, setPronouns] = useState("");
    let [profileBio, setprofileBio] = useState("");
    let [musicVolume, setMusicVolume] = useState(0.3);
    let [notif, setNotif] = useState(null);
    let [error, setError] = useState(false);
    let [oldPassword, setOldPassword] = useState("");
    let [username, setUsername] = useState("");
    let [loading, setLoading] = useState(true);
    let [postComments, setPostComments] = useState(true);
    let [selectedFile, setSelectedFile] = useState(null);
    let [bannerFile, setBannerFile] = useState(null);

    const fileInputRef = useRef(null);
    const bannerFileInputRef = useRef(null);
  
    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleBannerFileChange = (e) => {
        setBannerFile(e.target.files[0]);
    }

    useEffect(() => {
        async function fetchSelf() {
            try {
                const response = await fetch(`/api/myself`, {
                    headers: {
                        'Authorization' : localStorage.getItem("opnidea-session")
                    }
                });
    
                if (response.status != 200) {
                    setError(true);
                    setNotif('Something went wrong while fetching your account information. Try again later.')
    
                    setTimeout(() => {
                        setNotif(null);
                    }, 5000);
    
                    return;
                }
                
                const data = await response.json();
    
                setMusicEnabled(data.preferences.music_enabled);
                setPostComments(data.preferences.comments_enabled);
                setMusicVolume(data.preferences.music_volume);
    
                const response2 = await fetch(`/api/profiles/${data.id}`, {
                    headers: {
                        'Authorization' : localStorage.getItem("opnidea-session")
                    }
                });
                
                const data2 = await response2.json();
    
                data.profile = data2;
    
                setSelf(data);
                setPronouns(data.pronouns);
                setMusicUrl(data.music_url);
                setprofileBio(data.bio);
                setProfilePrivacy(data.privacy == 2 ? 'Private' : 'Public');
                setDMPrivacy(data.dm_privacy == 0 ? 'Everyone' : (data.dm_privacy == 1 ? 'Following' : 'NoOne'));
                setUsername(data.profile.username);
                setLoading(false);
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
            }
        }

        if (virtualSelf == null) {
            fetchSelf();
        }
    });

    function handleEmailChange(ev) {
        if (!changingEmail) {
            setChangingEmail(true);
        }

        if (ev.target.value == "") {
            setChangingEmail(false);
        }

        setEmail(ev.target.value);
    }

    function updateEmail() {
        try {
            if (!newEmail || newEmail == "") {
                setError(true);
                setNotif('An email address is required for you to update!');
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
    
                return;
            }
    
            if (newEmail.toLowerCase() == virtualSelf.email.toLowerCase()) {
                setError(true);
                setNotif('New Email must not be the same as old one.');
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                return;
            }
    
            const formData = new FormData();
            
            formData.append('email', newEmail);
    
            fetch(`/api/myself`, {
                method: 'PATCH',
                headers: {
                  'Authorization' : localStorage.getItem('opnidea-session'),
                },
                body: formData,
            }).then(response => response.json()).then(data => {
                if (data.message) {
                    setError(true);
                    setNotif(data.message);
    
                    setTimeout(() => {
                        setNotif(null);
                    }, 5000);
                } else {
                    setError(false);
                    setNotif('Email updated successfully! As a result, your auth cookie has changed.');
    
                    setTimeout(() => {
                     setNotif(null);
                    }, 5000);
    
                   window.location.href = '/logout';
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

    function deleteAccount() {
        try {
            fetch(`/api/myself`, {
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
                    setNotif('Your account, posts, attachments and collections, have been successfully wiped. Goodluck on your journey.');
    
                    setTimeout(() => {
                     setNotif(null);
                    }, 5000);
    
                   window.location.href = '/logout';
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

    function updatePassword() {
        try {
            if (!oldPassword || oldPassword == "") {
                setError(true);
                setNotif('Old password is required for you to update!');
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                return;
            }
    
            if (!newPassword || newPassword == "") {
                setError(true);
                setNotif('New password is required for you to update!');
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                return;
            }
    
            if (newPassword.toLowerCase() == oldPassword.toLowerCase()) {
                setError(true);
                setNotif('New Password must not be the same as the old one.');
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                return;
            }
    
            const formData = new FormData();
            
            formData.append('new_password', newPassword);
            formData.append('old_password', oldPassword);
    
            fetch(`/api/myself`, {
                method: 'PATCH',
                headers: {
                    'Authorization' : localStorage.getItem('opnidea-session'),
                },
                body: formData,
            }).then(response => response.json()).then(data => {
                if (data.message) {
                    setError(true);
                    setNotif(data.message);
    
                    setTimeout(() => {
                        setNotif(null);
                    }, 5000);
                } else {
                    setError(false);
                    setNotif('Password updated successfully! As a result, your auth cookie has changed.');
    
                    setTimeout(() => {
                     setNotif(null);
                    }, 5000);
    
                   window.location.href = '/logout';
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

    function updateProfile() {
        try {
            if (!username || username == "") {
                setError(true);
                setNotif('A username is required for you to update!');
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                return;
            }
    
            if (!profilePrivacy || profilePrivacy == "") {
                setError(true);
                setNotif('A profile privacy is required for you to update!');
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                return;
            }
    
            let new_musicurl = musicUrl;
    
            if (new_musicurl == "" || !new_musicurl) {
                new_musicurl = null;
            }
    
            let new_bio = profileBio;
    
            const formData = new FormData();
            
            formData.append('username', username);
            formData.append('bio', new_bio);
            formData.append('pronouns', pronouns);
            formData.append('privacy', profilePrivacy);
            formData.append('music_url', new_musicurl);
            formData.append('avatar', selectedFile);
            formData.append('banner', bannerFile);
            formData.append('dm_privacy', DMPrivacy);
    
            fetch(`/api/myself`, {
                method: 'PATCH',
                headers: {
                  'Authorization' : localStorage.getItem('opnidea-session'),
                },
                body: formData
            }).then(response => response.json()).then(data => {
                if (data.message) {
                    setError(true);
                    setNotif(data.message);
    
                    setTimeout(() => {
                        setNotif(null);
                    }, 5000);
                } else {
                    setError(false);
                    setNotif('Profile updated successfully!');
    
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

    function updatePreferences() {
        try {
            fetch(`/api/myself/preferences`, {
                method: 'PATCH',
                headers: {
                  'Content-Type' : 'application/json',
                  'Authorization' : localStorage.getItem('opnidea-session'),
                },
                body: JSON.stringify({
                  object: {
                     music_enabled: (musicEnabled == "true" || musicEnabled == true) ? true : false,
                     music_volume: musicVolume,
                     comments_enabled: (postComments == "true" || postComments == true) ? true : false,
                  }
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
                   setNotif('Preferences updated successfully!');
    
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

    function removeAvatar() {
        try {
            const formData = new FormData();
        
            formData.append('avatar', 'default');
    
            fetch(`/api/myself`, {
                method: 'PATCH',
                headers: {
                  'Authorization' : localStorage.getItem('opnidea-session'),
                },
                body: formData
            }).then(response => response.json()).then(data => {
                if (data.message) {
                    setError(true);
                    setNotif(data.message);
    
                    setTimeout(() => {
                        setNotif(null);
                    }, 5000);
                } else {
                    setError(false);
                    setNotif('Avatar removed successfully!');
    
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

    function removeBanner() {
        try {
            const formData = new FormData();
        
            formData.append('banner', 'default');
    
            fetch(`/api/myself`, {
                method: 'PATCH',
                headers: {
                  'Authorization' : localStorage.getItem('opnidea-session'),
                },
                body: formData
            }).then(response => response.json()).then(data => {
                if (data.message) {
                    setError(true);
                    setNotif(data.message);
    
                    setTimeout(() => {
                        setNotif(null);
                    }, 5000);
                } else {
                    setError(false);
                    setNotif('Banner removed successfully!');
    
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

    function resendVerifEmail() {
        try {
            fetch(`/api/auth/verify/resend`, {
                method: 'POST',
                headers: {
                  'Authorization' : localStorage.getItem("opnidea-session")
                },
                body: null
            }).then(response => response.json()).then(data => {
                if (data.message) {
                    setError(true);
                    setNotif(data.message);
    
                    setTimeout(() => {
                        setNotif(null);
                    }, 5000);
                } else {
                    setError(false);
                    setNotif('Verification e-mail resent. Please check your spam if nothing arrives.');
    
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

    return (
        <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                {notif != null ? (error ? <Alert message={notif} warning></Alert> : <Alert message={notif}></Alert>) : <></>}
                <div id="settings">
                    <h1>Personal Settings</h1>
                    <p>Here you can manage information related to your account with OPNIDEA.</p>
                    <div id="knobs">
                        <div id="knob" onClick={() => setTab('Account')} className={`${tab == 'Account' ? 'knob-clicked' : ''}`}>Account</div>
                        <div id="knob" onClick={() => setTab('Profile')} className={`${tab == 'Profile' ? 'knob-clicked' : ''}`}>Profile</div>
                        <div id="knob" onClick={() => setTab('Preferences')} className={`${tab == 'Preferences' ? 'knob-clicked' : ''}`}>Preferences</div>
                    </div>
                    <div id="knob-content">
                        {loading ? (<p>Loading...</p>) : tab == 'Account' ? (
                            <>
                            {!changingEmail ? (
                                (!changingPassword ? (
                                    <>
                                        <h1>Email: {virtualSelf.verified ? <>
                                            <input type="text" className="inputfield" placeholder={virtualSelf.email} onChange={handleEmailChange} value={newEmail}></input>
                                        </> : <>
                                            <button className="submit-btn" onClick={resendVerifEmail} style={{marginLeft: '10px'}}>Resend Verification Email</button>
                                        </>}</h1>
                                        <div id="knob-content-buttons">
                                            {virtualSelf.verified ? <button className='submit-btn' onClick={() => setChangingPassword(true)}>Change Password</button> : <></>}
                                            <button className='submit-btn' onClick={deleteAccount}>Delete Account</button>
                                        </div>
                                    </>
                                ) : <>
                                        <input type="password" className="inputfield" placeholder="Old Password" onChange={(ev) => setOldPassword(ev.target.value)} value={oldPassword}></input>
                                        <input type="password" className="inputfield" placeholder="New Password" onChange={(ev) => setNewPassword(ev.target.value)} value={newPassword}></input>
                                        <div id="knob-content-buttons">
                                            <button className='submit-btn' onClick={updatePassword}>Save Changes</button>
                                            <button className='submit-btn' onClick={() => setChangingPassword(false)}>Cancel</button>
                                        </div>
                                </>)
                            ) : <>
                                <h1>Email: <input type="text" className="inputfield" placeholder={virtualSelf.email} onChange={handleEmailChange} value={newEmail}></input></h1>
                                <div id="knob-content-buttons">
                                    <button className='submit-btn' onClick={updateEmail}>Save Changes</button>
                                </div>
                            </>}
                         </>
                        ) : (tab == 'Profile' ? 
                            <>
                                {!virtualSelf.verified ? <p>Your account isn't verified and is restricted, you can re-send the email under 'Account'.</p> :<></>}
                                <>
                                {virtualSelf.verified ? <>
                                    <h1>Avatar: 
                                        {virtualSelf.profile.avatar == '/files/default_pfp.png' ? 
                                        (
                                            <>
                                                <button className="submit-btn" onClick={() => fileInputRef.current.click()} style={{marginLeft: '10px'}}>{selectedFile == null ? 'Add' : 'Change'}</button>
                                                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange}/>
                                            </>
                                        ) 
                                    : <>
                                        <button className="submit-btn" onClick={() => fileInputRef.current.click()} style={{marginLeft: '10px'}}>Change</button>
                                        <button className="submit-btn" onClick={removeAvatar} style={{marginLeft: '10px'}}>Remove</button>
                                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange}/>
                                    </>}
                                    </h1>
                                </> : <></>}
                            {virtualSelf.verified ? <>
                                    <h1>Banner: {virtualSelf.profile.banner == null ? (<>
                                    <button className="submit-btn" onClick={() => bannerFileInputRef.current.click()} style={{marginLeft: '10px'}}>{bannerFile == null ? 'Add' : 'Change'}</button>
                                    <input type="file" accept="image/*" ref={bannerFileInputRef} style={{ display: 'none' }} onChange={handleBannerFileChange}/>
                                </>) : <>
                                    <button className="submit-btn" onClick={() => bannerFileInputRef.current.click()} style={{marginLeft: '10px'}}>Change</button>
                                    <button className="submit-btn" onClick={removeBanner} style={{marginLeft: '10px'}}>Remove</button>
                                    <input type="file" accept="image/*" ref={bannerFileInputRef} style={{ display: 'none' }} onChange={handleBannerFileChange}/>
                                </>}</h1>
                            </> : <></>}
                            {virtualSelf.verified ? <h1>Username: <input type="text" className="inputfield" placeholder={virtualSelf.profile.username} value={username} onChange={(ev) => setUsername(ev.target.value)}></input></h1> : <></>}
                                    {virtualSelf.verified ? <>
                                        <h1>Visibility: 
                                        <select className="inputselect" onChange={(ev) => setProfilePrivacy(ev.target.value)} value={profilePrivacy}>
                                            {profilePrivacy == "Private" ? <>
                                                <option value="Private">Private</option>
                                                <option value="Public">Public</option>
                                            </> : <>
                                                <option value="Public">Public</option>
                                                <option value="Private">Private</option>
                                            </>}
                                        </select>
                                    </h1>
                                    <h1>Allow direct messaging from: 
                                        <select className="inputselect" onChange={(ev) => setDMPrivacy(ev.target.value)} value={DMPrivacy}>
                                            {DMPrivacy == "Everyone" ? <>
                                                <option value="Everyone">Everyone</option>
                                                <option value="Following">People You're Following</option>
                                                <option value="NoOne">No One</option>
                                            </> : DMPrivacy == "Following" ? <>
                                                <option value="Following">People You're Following</option>
                                                <option value="Everyone">Everyone</option>
                                                <option value="NoOne">No One</option>
                                            </> : <>
                                                <option value="NoOne">No One</option>
                                                <option value="Everyone">Everyone</option>
                                                <option value="Following">People You're Following</option>
                                            </>}
                                        </select>
                                    </h1>
                                    <h1>Pronouns: 
                                        <select className="inputselect" onChange={(ev) => setPronouns(ev.target.value)} value={pronouns}>
                                            <option value="">Select Pronouns</option>
                                            <option value="she/her">she/her</option>
                                            <option value="he/him">he/him</option>
                                            <option value="they/them">they/them</option>
                                            <option value="xe/xem">xe/xem</option>
                                            <option value="ze/zem">ze/zem</option>
                                            <option value="they/them">Not Listed? Email contactnoia@protonmail.com</option>
                                        </select>
                                    </h1>
                                    </> : <></>}
                                    
                                    {virtualSelf.verified ? <>
                                        <h1>Bio: 
                                        <input type="text" className="inputfield" placeholder={virtualSelf.bio == null ? 'Stuck in a daydream.' : virtualSelf.bio} value={profileBio} onChange={(ev) => setprofileBio(ev.target.value)}></input>
                                    </h1>  
                                    </> : <></>}
                                    {virtualSelf.verified ? <>
                                        <h1>Profile Music URL: 
                                        <input type="text" className="inputfield" placeholder={virtualSelf.music_url == null ? 'https://uploads.celestial.host/music.mp3' : virtualSelf.music_url} value={musicUrl} onChange={(ev) => setMusicUrl(ev.target.value)}></input>
                                    </h1>      
                                    </> : <></>}
                                    {virtualSelf.verified ? <button className='submit-btn' onClick={updateProfile}>Save Changes</button> : <></>}   
                                </>
                        </> : <>
                            <h1>Profile Music: 
                            <select className="inputselect" onChange={(ev) => setMusicEnabled(ev.target.value)} value={musicEnabled}>
                                {musicEnabled ? (
                                    <>
                                        <option value={true}>Enabled</option>
                                        <option value={false}>Disabled</option>
                                    </>
                                ) : (
                                    <>
                                        <option value={false}>Disabled</option>
                                        <option value={true}>Enabled</option>
                                    </>
                                )}
                            </select>
                            </h1>
                            <h1>Post Comments: 
                            <select className="inputselect" onChange={(ev) => setPostComments(ev.target.value)} value={postComments}>
                                {postComments ? (
                                    <>
                                        <option value={true}>Enabled</option>
                                        <option value={false}>Disabled</option>
                                    </>
                                ) : (
                                    <>
                                        <option value={false}>Disabled</option>
                                        <option value={true}>Enabled</option>
                                    </>
                                )}
                            </select>
                            </h1>
                            <h1>Music Volume: 
                                <input type="range" min="1" max="100" className="inputrange" onChange={(ev) => setMusicVolume(ev.target.value)} value={musicVolume}></input>
                            </h1>
                            <span>({musicVolume}%)</span>
                            <button className='submit-btn' onClick={updatePreferences}>Save Changes</button>
                        </>)}
                    </div>
                </div>
            </div>
        </div>
    )
}