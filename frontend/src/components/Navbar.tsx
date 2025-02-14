import masthead from './../assets/masthead.png'
import { FaFacebook, FaXTwitter, FaInstagram, FaTiktok, FaLinkedin} from "react-icons/fa6";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';


const ReactiveLink = ({ name, path }: { name: string, path: string }) => {
    return (
     <Link 
        to={path} 
        className="navbar-link text-black text-[16px] font-normal leading-[23.71px] tracking-[0%] px-4 py-2 transition-all hover:text-gray-300 hover:underline font-oswald text-center flex items-center justify-center"
        style={{ fontFamily: 'Oswald' }}
      >
        {name}
        <div className="navbar-link-bar" />
    </Link>
    );
};
export default function Navbar({ transparent }: { transparent?: boolean }) {
    const [scrolled, setScrolled] = useState(false);
    const scrollThreshold = 80;
  
    // Handle scroll event
    const onScroll = () => {
      setScrolled(window.scrollY > scrollThreshold);
    };
  
    useEffect(() => {
      // Add scroll event listener
      window.addEventListener("scroll", onScroll);
      return () => window.removeEventListener("scroll", onScroll);
    }, []);
  
    return (
      <div>
        {/* section for social media icons */}
        <div className="masthead-section">
          <img src={masthead} alt="Masthead" className="w-[500px] m-auto" />
          <p className="mt-4 flex gap-2 w-full justify-center items-center">
            <FaFacebook />
            <FaXTwitter />
            <FaInstagram />
            <FaTiktok />
            <FaLinkedin />
          </p>
        </div>
  
        {/* navbar section */}

        <header
        className={`navbar-outer ${scrolled ? "scrolled" : ""} ${
        transparent ? "" : "navbar-background"
        } border-t-[1px] border-b-[1px] border-black-300 mt-2`}
        >
          <div
            className={`nav-container ${scrolled ? "scrolled" : ""} flex justify-center items-center w-full gap-x-16`}
          >
            <ReactiveLink name="News" path="/news" />
            <ReactiveLink name="Life" path="/life" />
            <ReactiveLink name="Opinions" path="/opinions" />
            <ReactiveLink name="Entertainment" path="/entertainment" />
            <ReactiveLink name="Sports" path="/sports" />
            <ReactiveLink name="About" path="/about" />
            <ReactiveLink name="Submit an Ad" path="/submit-ad" />
            <ReactiveLink name="Contact Us" path="/contact" />
          </div>
  
          {!transparent && (
            <div className={`navbar-gradient ${scrolled ? "scrolled" : ""}`}></div>
          )}

        </header>
      </div>
    );
  }
  