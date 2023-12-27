import '../css/footer.css'
import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <div id="footer">
            <p>
                Files uploaded are copyright of their respective creators.
            </p>
            <ul>
                <li>
                    <Link to="/copyright">Submit Copyright Complaint</Link>
                </li>
                <li>
                    <a href="/changelog">View Changelog</a>
                </li>
                <li>
                    <Link to="/privacy">Privacy Policy</Link>
                </li>
                <li>
                    <Link to="/tos">Terms of Service</Link>
                </li>
            </ul>
            <p>
                Est. 2023
            </p>
        </div>
    )
}