import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useEffect } from "react";
import Cookies from "js-cookie";
import { useState } from "react";
import Alert from "../components/alert";

export default function Copyright() {
    useEffect(() => {
        if (!localStorage.getItem("opnidea-session")) {
          window.location.href = '/login';
        }
    });

    let [links, setLinks] = useState("");
    let [acknowledgedFaithful, setAcknowledgedFaithful] = useState(false);
    let [acknowledgedNoAbuse, setAcknowledgedNoAbuse] = useState(false);
    let [notif, setNotif] = useState(null);
    let [error, setError] = useState(false);

    function submitComplaint() {
        try {
            fetch(`/api/other/submit_copyright_complaint`, {
                method: 'POST',
                headers: {
                  'Content-Type' : 'application/json',
                  'Authorization' : localStorage.getItem('opnidea-session'),
                },
                body: JSON.stringify({
                    allegedCopyrightedContent: links,
                    acknowledgedReportMustBeFaithful: acknowledgedFaithful,
                    acknowledgedReportsCantBeAbused: acknowledgedNoAbuse
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
                    setNotif('Copyright complaint submitted successfully. Please watch the email linked to your account over the upcoming days for updates.');
    
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
                <div id="copyright" className="truly-centered">
                    <h1>Submit Copyright Complaint</h1>
                    <textarea placeholder="Link(s) to offending content, separated by new line." className="inputarea" onChange={(ev) => setLinks(ev.target.value)}></textarea>
                    <div id="acknowledge">
                        <input type="checkbox" onChange={(ev) => setAcknowledgedFaithful(ev.target.checked)}></input> I acknowledge that the information I have provided is faithful and is copyright of myself. 
                    </div>
                    <div id="acknowledge">
                        <input type="checkbox" onChange={(ev) => setAcknowledgedNoAbuse(ev.target.checked)}></input> I acknowledge that abuse of the copyright complaint system can result in legal prosecution and the termination of my OPNIDEA account.
                    </div>
                    <button className="submit-btn" onClick={submitComplaint}>Submit</button>
                </div>
            </div>
            <Footer/>
        </div>
    )
}