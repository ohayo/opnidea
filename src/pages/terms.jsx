import Footer from "../components/footer";
import Navbar from "../components/navbar";

export default function Terms() {
    return (
        <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                <div className="important-notice">
                    <h1>Terms of Service (ToS)</h1>
                    <h2>Last Updated: 12/09/2023</h2>
                    <p>While using OPNIDEA, you agree to the following: <br></br>
                        <b>You will not</b> post anything which breaks the law, or is obscene. (E.g illegal imagery, graphic content, etc)<br></br>
                        <b>We have the right</b> to delete or take other moderative actions against your accout and/or content in the case you break the aforementioned.<br></br>
                        <b>We also have the right</b>, although very unlikely, to shutdown at any time, with or without prior notice.
                    </p>
                </div>
            </div>
            <Footer/>
        </div>
    )
}