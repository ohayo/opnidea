import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { Link } from "react-router-dom";

export default function EmailVerification() {
    let location = useLocation();
    let [verifySuccess, setVerifySuccess] = useState(false);
    let [verifying, setVerifying] = useState(true);
    
    const queryParams = new URLSearchParams(location.search);

    let passoffCode = null;

    if (queryParams.get('passoffcode')) {
        passoffCode = queryParams.get('passoffcode');
    }

    useEffect(() => {
        async function tryVerify() {
            try {
                const response = await fetch(`/api/auth/verify`, {
                    method: 'POST',
                    headers: {
                        'Authorization' : localStorage.getItem("opnidea-session"),
                        'Content-Type' : 'application/json',
                    },
                    body: JSON.stringify({
                        passoffcode: passoffCode
                    })
                });
    
                if (response.status != 200) {  
                    setVerifying(false);
                    setVerifySuccess(false);
                    return;
                }
    
                setVerifying(false);
                setVerifySuccess(true);
    
                setTimeout(() => {
                    window.location.href = '/settings';
                }, 5000);
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
            }  
        }

        if (verifying && !verifySuccess) {
            tryVerify();
        }
    });

    return (
        <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                <div id="emailverif" className="truly-centered">
                    {verifying ? <>
                        <h1>Verifying Email..</h1>
                        <p>Hold tight..</p>
                    </> : (
                        !verifying && !verifySuccess ? <>
                            <h1>Email failed to be verified!</h1>
                            <p>Looks like that pass off code is incorrect and/or has expired.</p>
                        </> : < >
                            <h1>Email verified!</h1>
                            <p>You will now be redirected back to your account settings in 5 seconds.. <Link to="/settings">click here if you can't wait.</Link></p> 
                        </>
                    )} 
                </div>
            </div>
            <Footer/>
        </div> 
    )
}