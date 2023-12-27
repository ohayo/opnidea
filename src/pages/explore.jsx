import { Link } from "react-router-dom";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import Thumbnail from "../components/thumbnail";
import Category from "../components/category";
import { useEffect } from "react";
import { useState } from "react";
import Cookies from "js-cookie";
import Alert from "../components/alert";

export default function Explore() {
    let [categories, setCategories] = useState([])
    let [query, setQuery] = useState("");
    let [SearchRecommendations, setSearchRecommendations] = useState([]);

    useEffect(() => {
        async function fetchCategories() {
            try {
                const response = await fetch(`/api/categories`, {
                    headers: {
                        'Authorization' : localStorage.getItem("opnidea-session")
                    }
                });
                const data = await response.json();
    
                setCategories(data);
            }
            catch(error) {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
            }
        }

        if (categories.length == 0) {
            fetchCategories();
        }
    });

    function lookForRecommendations(ev) {
        try {
            setQuery(ev.target.value);

            fetch(`/api/search/recommendations?query=${ev.target.value}`, {
                method: 'GET',
                headers: {
                  'Content-Type' : 'application/json',
                  'Authorization' : localStorage.getItem('opnidea-session'),
                }
            }).then(response => response.json()).then(data => {
                if (data.message) {
                  alert(data.message);
                } else {
                    setSearchRecommendations(data);
                }
            }).catch(error => {
                console.log(error);
                alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
                return;
            });
        }
        catch(error) {
            console.log(error);
            alert('Something went wrong, please try again in a bit. You might be ratelimited also.');
        }
    }

    function handleSearch(ev) {
        if (ev.key === "Enter") {
            window.location.href = `/results?query=${query}`
        }
    }

    return (
        <>
        <div id="content">
            <Navbar/>
            <div id="explore">
                <h1>Explore posts and ideas</h1>
                <input type="text" placeholder="Nothing here fit your interest? Search for anything here!" className="truly-centered" onChange={lookForRecommendations} onKeyDown={handleSearch}></input>
                {SearchRecommendations.length > 0 ? (
                    <div id="search-recommendations">
                        <div id="search-rows">
                            {SearchRecommendations.map((recommendation, index) => (
                                <div id="search-row" key={index} onClick={() => window.location.href = `/posts/${recommendation.id}`}>
                                   {recommendation.caption.length > 15 ? recommendation.caption.slice(0, 15) + "..." : recommendation.caption} <span>(in {recommendation.category})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : <></>}
            </div>
            <div id="categories">
                {categories.length == 0 ? (
                    <>
                        <h1>Loading</h1>
                        <p>Please wait...</p>
                    </>
                ) : <></>}
                <Category></Category>
                {categories?.map((category, index) => (
                    <Category key={index} name={category}></Category>
                ))}
            </div>
        </div>
        </> 
    )
}