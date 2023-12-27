import { Link } from "react-router-dom";
import Footer from "../components/footer";
import Navbar from "../components/navbar";

export default function Index() {
    return (
        <div id="content">
            <Navbar/>
            <div id="body" className="centered">
                <div className="header">
                    <h1>Read Me</h1>
                    <h2>Thank you for trying out OPNIDEA, however, there are some things I want to admit.</h2>
                    <p>I'm not one to talk about my psyche that much but life has been really hard as of recent, in an effort to get into better circumstances, I started working on this project.
                        <br></br>
                        My original goal was to connect with more people, this was my last ditch effort to form a purpose for my life. As someone struggling with gender dysphoria since a child (getting on hrt soon tho), things were never easy for me to connect with others.
                        <br></br>
                        Combined with ADHD and mental illnesses, I haven't been able to focus on a project of mine for a long enough period of time, at least not without medication.
                        <br></br>
                        With the collapse of this project, and the fact that I have started university full time, pursuing a bachelor of IT (majoring in software development stuff)
                        <br></br>
                        I feel as if it'd be disrespectful to continue lying to you that I can handle this right now with my current circumstances.
                        <br></br>
                        So until I get on medication, I will be discontinuing this project. <b>Until the cut-off date of the server running OPNIDEA, you will need to download any post attachments you may like.</b>
                        <br></br>
                        The platform will remain semi-functional for the time being, and I won't respond to emails as I just genuinely don't have motivation to do much anymore.
                        <br></br>
                        Which is pretty stupid since I am now studying at university.
                        <br></br>
                        Stay safe, thank you for everything in the short period this platform existed.
                        <br></br>
                    </p>
                    <h2>After the cut-off date (1st of December 2023), your posts and data will be <b>PERMANENTLY</b> deleted from the server and the project would have concluded.</h2>
                    <h2>- noia :(</h2>
                    <Link to="/explore" style={{fontSize: '32px'}}>Continue to OPNIDEA</Link>
                </div>
            </div>
        </div>
    )
}