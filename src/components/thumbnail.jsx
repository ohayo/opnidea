import { Link } from "react-router-dom";
import '../css/thumbnail.css'

export default function Thumbnail(props) {
    let is_hashtag = props.hashtag == true;
    let name = props.name;
    let category_name = props.category;
    let link = "";

    if (!is_hashtag && category_name) {
        link = `/category/${category_name}?includes=${name}`
    } else if (is_hashtag) {
        link = `/trending/${name}`
    } else {
        link = props.custom_url
    }

    let render_name = name.length > 15 ? name.slice(0, 15) + "..." : name;

    return (
        <div className="thumbnail">
            <Link to={link}>{is_hashtag ? "#" : ""}{render_name}</Link>
            <p>{props.posts} post(s)</p>
        </div>
    )
}