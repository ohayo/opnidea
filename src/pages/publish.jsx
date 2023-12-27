import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useEffect } from "react";
import Cookies from "js-cookie";
import { useState } from "react";
import { useRef } from "react";
import Alert from "../components/alert";

export default function Publish() {
    useEffect(() => {
        if (!localStorage.getItem("opnidea-session")) {
          window.location.href = '/login';
        }
    });

    let [caption, setCaption] = useState("")
    let [category, setCategory] = useState("")
    let [categories, setCategories] = useState([]);
    let [customCategory, setCustomCategory] = useState("")
    let [privacy, setPrivacy] = useState("Public");
    let [comments, setComments] = useState("Enabled");
    let [noCategories, setNoCategories] = useState(false);
    let [selectedFiles, setSelectedFiles] = useState([]);
    let [notif, setNotif] = useState(null);
    let [error, setError] = useState(false);

    const fileInputRef = useRef(null);
  
    const handleFileChange = (e) => {
        const files = e.target.files;
        const newSelectedFiles = [...selectedFiles];
    
        for (let i = 0; i < files.length; i++) {
          newSelectedFiles.push(files[i]);
        }
    
        setSelectedFiles(newSelectedFiles);
    };

    useEffect(() => {
        async function fetchCategories() {
            try {
                const response = await fetch(`/api/categories`, {
                    headers: {
                        'Authorization' : localStorage.getItem("opnidea-session")
                    }
                });
                
                const data = await response.json();
    
                if (data.length == 0) {
                    setNoCategories(true);
                    return;
                }
    
                setCategories(data);
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
            }
        }

        if (categories.length == 0 && !noCategories) {
            fetchCategories();
        }
    });

    function handlePublish() {
        try {
            if (caption === null || caption === "" || !caption) {
                setError(true);
                setNotif('Caption is required.');
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                return;
            }
          
            if (category === null || category === "" || category.toLowerCase() === "select category" || !category) {
                setError(true);
                setNotif('Category is required.');
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                return;
            }
    
            if (privacy === null || privacy === "" || !privacy) {
                setError(true);
                setNotif('Privacy is required.');
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                return;
            }
    
            if (selectedFiles.length === 0) {
                setError(true);
                setNotif('At least one file is required to post.');
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                return;
            }
    
            if (selectedFiles.length > 4) {
                setError(true);
                setNotif('There is a maximum of 4 files per post.');
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                return;
            }
    
            let set_category = category.toLowerCase();
    
            if (category.toLowerCase() === "other") {
                if (customCategory === null || customCategory === "" || !customCategory) {
                    setError(true);
                    setNotif('Custom category is required.');
        
                    setTimeout(() => {
                        setNotif(null);
                    }, 5000);
                    return;
                }
    
                set_category = customCategory.toLowerCase();
            }
    
            const formData = new FormData();
            
            formData.append('caption', caption);
            formData.append('category', set_category);
            formData.append('privacy', privacy);
            formData.append('comments', comments);
          
            for (let i = 0; i < selectedFiles.length; i++) {
              formData.append('files', selectedFiles[i]);
            }
    
            fetch(`/api/publish`, {
                method: 'POST',
                headers: {
                  'Authorization' : localStorage.getItem("opnidea-session")
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
                  window.location.href = data.url;
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
                <div id="publish">
                    <h1>Publish New Post</h1>
                    <p className="notice">Exif data is removed from .jpg and .png files, but not from .mov and .mp4 videos, we are still working on it!</p>
                    <select className="inputselect" onChange={(ev) => setCategory(ev.target.value)} value={category}>
                        <option value="Select Category">Select Category</option>
                        {categories.map((category, index) => (
                            <option value={category} key={index}>{category}</option>
                        ))}
                        <option value="Other">Other Category</option>
                    </select>
                    {category.toLowerCase() === "other" ? <input placeholder="Enter Category" type="text" className="inputfield" onChange={(ev) => setCustomCategory(ev.target.value)}></input> : <></>}
                    <select className="inputselect" style={category.toLowerCase() === 'other' ? {marginTop: '20px'} : {}} onChange={(ev) => setPrivacy(ev.target.value)} value={privacy}>
                        <option value="Public">Public</option>
                        <option value="Semi-Public">Semi-Public (Link Only)</option>
                        <option value="Private">Private</option>
                    </select>
                    <select className="inputselect" onChange={(ev) => setComments(ev.target.value)} value={comments}>
                        <option value="Enabled">Comments Enabled</option>
                        <option value="Disabled">Comments Disabled</option>
                    </select>
                    <input placeholder="Enter Caption" type="text" className="inputfield" onChange={(ev) => setCaption(ev.target.value)}></input>
                    <div className="filebox">
                        <h2>File Box</h2>
                        <p>{selectedFiles.length}/4 files selected.</p>
                        {selectedFiles.length < 4 ? (
                            <>
                                <button className="submit-btn" onClick={() => fileInputRef.current.click()}>Attach File</button>
                                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange}/>
                            </>
                        ) : <></>}
                    </div>
                    <button className="submit-btn" onClick={handlePublish}>Publish</button>
                </div>
            </div>

        </div>
    )
}