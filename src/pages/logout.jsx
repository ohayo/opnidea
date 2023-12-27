import { Link } from "react-router-dom";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import React, { useState, useEffect } from "react";

export default function Logout() {
    useEffect(() => {
        if (!localStorage.getItem("opnidea-session")) {
          window.location.href = '/';
        }
    });

    localStorage.removeItem('opnidea-session');
    
    window.location.href = '/';

    return (
        <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                <div id="logout" className="truly-centered">
                    <h1>Logging you out..</h1>
                    <h2>Hope to see you again soon!</h2>
                </div>
            </div>
            <Footer/>
        </div>
    )
}