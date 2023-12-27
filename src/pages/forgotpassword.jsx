import { Link } from "react-router-dom";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useRef } from "react";
import Alert from "../components/alert";

export default function ForgotPassword() {
    const [emailValue, setEmailValue] = useState("");
    const [passwordValue, setPasswordValue] = useState("");
    const [captchaValue, setCaptchaValue] = useState(null);
    const captchaRef = useRef(null);
    let [notif, setNotif] = useState(null);
    let [error, setError] = useState(false);

    const onLoad = () => {
        captchaRef.current.execute();
    };

    function handleTempPw() {
        try {
            if (emailValue === null || emailValue === "" || !emailValue) {
                setError(true);
                setNotif('Email is required.');
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                return;
            }
    
            if (captchaValue == null) {
                setError(true);
                setNotif("You haven't solved the captcha!");
    
                setTimeout(() => {
                    setNotif(null);
                }, 5000);
                return;
            }
    
            fetch(`/api/auth/forgot`, {
                method: 'POST',
                headers: {
                  'Content-Type' : 'application/json'
                },
                body: JSON.stringify({
                  email: emailValue,
                  captcha: captchaValue
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
                    setNotif('A new password has been e-mailed to you. Please check your spam if nothing arrives.');
    
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
                <div id="auth" className="truly-centered">
                    <h1>Forgot your password?</h1>
                    <input placeholder="Email" id="email" className="inputfield" onChange={(ev) => {setEmailValue(ev.target.value)}}></input>
                    <HCaptcha sitekey="636f7e01-53de-4733-bc51-ecdaff3e7169" onLoad={onLoad} onVerify={setCaptchaValue} ref={captchaRef}/>
                    <button className="submit-btn" onClick={handleTempPw}>Send temporary password</button>
                </div>      
            </div>
            <Footer/>
        </div>
    )
}