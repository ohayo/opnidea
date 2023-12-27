import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/navbar.css";

export default function Navbar() {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

  const toggleHamburger = () => {
    setIsHamburgerOpen(!isHamburgerOpen);
  };

  return (
    <div id="nav">
      <div className="section" id="logo">
        <Link to="/">
          <img src={`/files/logo-trans.png`} id="logo-img" alt="Logo" />
        </Link>
      </div>
      <div className="section centered" id="general">
        <ul>
          {localStorage.getItem("opnidea-session") != null ? (
            <>
              <li>
                <Link to="/explore">Explore</Link>
              </li>
              <li>
                <Link to="/publish">Publish</Link>
              </li>
            </>
          ) : (
            <></>
          )}
        </ul>
      </div>
      <div className="section" id="you">
        {localStorage.getItem("opnidea-session") != null ? (
          <>
            <ul>
              <li>
                <Link to="/mycollections">Collections</Link>
              </li>
              <li>
                <Link to="/notifications">Notifications</Link>
              </li>
              <li>
                <Link to="/messages">Messages</Link>
              </li>
              <li>
                <Link to="/settings">Settings</Link>
              </li>
              <li>
                <Link to="/logout">Logout</Link>
              </li>
            </ul>
          </>
        ) : (
          <>
            <ul>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </ul>
          </>
        )}
      </div>

        {isHamburgerOpen && (
        <div className="hamburger-menu">
            <ul className="hamburger-links">
            {localStorage.getItem("opnidea-session") != null ? (
                <>
                <li>
                    <Link to="/explore">Explore</Link>
                </li>
                <li>
                    <Link to="/publish">Publish</Link>
                </li>
                <li>
                    <Link to="/mycollections">Collections</Link>
                </li>
                <li>
                  <Link to="/notifications">Notifications</Link>
                </li>
                <li>
                    <Link to="/messages">Messages</Link>
                </li>
                <li>
                    <Link to="/settings">Settings</Link>
                </li>
                <li>
                    <Link to="/logout">Logout</Link>
                </li>
                </>
            ) : (
                <>
                <li>
                    <Link to="/login">Login</Link>
                </li>
                <li>
                    <Link to="/register">Register</Link>
                </li>
                </>
            )}
            </ul>
        </div>
    )}

      <div className="hamburger" onClick={toggleHamburger}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>
    </div>
  );
}