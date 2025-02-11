import masthead from './../assets/masthead.png'
import { FaFacebook, FaXTwitter, FaInstagram, FaTiktok, FaLinkedin} from "react-icons/fa6";

function Navbar() {
    return (
        <div>
            <img src={masthead} className="w-[500px] m-auto" />
            <p className="mt-4 flex gap-2 w-full justify-center items-center"><FaFacebook /><FaXTwitter /><FaInstagram /><FaTiktok /><FaLinkedin /></p>
        </div>
    )
}

export default Navbar