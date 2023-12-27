import { Link } from "react-router-dom";
import '../css/thumbnail.css'

export default function Preview(props) {
    let post = props.data;

    function isVideo(thing) {
        return thing.includes(".mp4") || thing.includes(".mov") || thing.includes(".webm")
    }

    return (
        <div className="post-preview">
            <Link to={`/posts/${post.id}`}>{!isVideo(post.attachments[0].link) ? (<img src={post.attachments[0].link}></img>) : <video src={post.attachments[0].link}></video>}</Link>
        </div>
    )
}