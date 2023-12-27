import Footer from "../components/footer";
import Navbar from "../components/navbar";

export default function Changelog() {
    return (
        <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                <div className="important-notice">
                    <h1>OPNIDEA Changelog</h1>
                    <h2>Update 0.1m [FOR BETA]</h2>
                    <h2>(Dated 5/11/2023)</h2>
                    <p>
                        <b>IMPORTANT NOTICE (PLEASE READ):</b>
                        <br></br>
                        [-] Mailgun has temporarily disabled my account.
                        <br></br>
                        I also will be taking a break from using social media for a while so please take that into consideration when you attempt to contact me.
                    </p>
                </div>
            </div>
            <Footer/>
        </div>
    )
}