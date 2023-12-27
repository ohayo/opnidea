import Footer from "../components/footer";
import Navbar from "../components/navbar";

export default function Privacy() {
    return (
        <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                <div className="important-notice">
                    <h1>Privacy Policy</h1>
                    <h2>Last Updated: 12/09/2023</h2>
                    <p>We do not sell or disclose your information to any third party (Unless it's law enforcement related). <br></br>
                        We have <b>strict</b> protocols to ensure your data is kept <b>safe and secure</b> while using OPNIDEA. <br></br>
                        <b>At any given moment</b> while using our services you wish to opt out of data collection, you can email contactnoia@protonmail.com to request a <b>full data deletion</b> from our servers.<br></br>
                        <b>We are required to give your information</b> to government agencies, when requested, <b>in the case of a federal investigation.</b>
                    </p>
                </div>
            </div>
            <Footer/>
        </div>
    )
}