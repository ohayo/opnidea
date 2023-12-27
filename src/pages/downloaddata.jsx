import { Link } from "react-router-dom";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import React, { useState, useEffect } from "react";

export default function DownloadData() {
    let [downloaded, setDownloaded] = useState(false);

    useEffect(() => {
        async function downloadData() {
            try {
                fetch(`/api/myself/data`, {
                    method: 'GET',
                    headers: {
                      'Authorization' : localStorage.getItem('opnidea-session'),
                    },
                });

                setDownloaded(true);
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong downloading your data. Try again later.');
                setDownloaded(true);
            }
        }
        
        if (!downloaded) {
            downloadData();
        }
    });

    return (
        <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                <div id="logout" className="truly-centered">
                    <h1>Data download in progress</h1>
                    <h2>Thank you</h2>
                </div>
            </div>
            <Footer/>
        </div>
    )
}