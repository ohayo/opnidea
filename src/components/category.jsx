import { Link } from "react-router-dom";
import Thumbnail from "./thumbnail";
import { useEffect } from "react";
import { useState } from "react";
import Cookies from "js-cookie";

export default function Category(props) {
    let name = props.name ? props.name : "trending"
    let link = props.name ? `/category/${props.name}` : '/trending'
    let api_url = `api/${props.name ? 'categories/' + props.name : "trending"}/thumbnails`;
    let [thumbnails, setThumbnails] = useState([]);
    let [noThumbnails, setnoThumbnails] = useState(false);

    useEffect(() => {
        async function fetchThumbnails() {
            const response = await fetch(api_url, {
                headers: {
                    'Authorization' : localStorage.getItem("opnidea-session")
                }
            });

            if (response.status != 200) {
                setnoThumbnails(true);
                return;
            }

            const data = await response.json();

            if (data.length == 0) {
                setnoThumbnails(true);
                return;
            }

            setThumbnails(data)
        }

        if (thumbnails.length == 0 && !noThumbnails) {
            fetchThumbnails();
        }
    });

    return (
        <div className="category" id={name}>
            <Link to={link}>{name}</Link>
            <div id="thumbnails">
            {thumbnails.length > 0 ? (
                thumbnails.map((thumbnail, index) => (
                    <Thumbnail
                        key={index}
                        name={thumbnail.name}
                        hashtag={thumbnail.hashtag}
                        posts={thumbnail.posts}
                        category={thumbnail.category}
                    ></Thumbnail>
                ))
            ) : (
                <>
                    <h3>
                        {name === "trending" ? (
                            <>No hashtag is trending at the moment. Why not <Link to="/publish">get one trending</Link>?</>
                        ) : (
                            <>Not enough posts under this category share similar content within their captions to be recommended to you. Why not <Link to="/publish">publish more</Link>?</>
                        )}
                    </h3>
                </>
            )}
            </div>
        </div>
    )
}   