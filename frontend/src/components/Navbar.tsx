import Masthead from './../assets/masthead.png';
import MastheadMobile from './../assets/masthead_mobile.png'
import { FaFacebook, FaXTwitter, FaInstagram, FaTiktok, FaLinkedin } from "react-icons/fa6";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IoMenuSharp, IoCloseSharp } from "react-icons/io5";

// Styling for each individual link in navbar
const ReactiveLink = ({ name, path }: { name: string, path: string }) => {
  return (
    <Link
      to={path}
      className="navbar-link text-black text-[16px] font-normal leading-[23.71px] tracking-[0%] px-4 py-2 hover:text-nique-blue-hover font-oswald text-center flex items-center justify-center"
      style={{ fontFamily: 'Oswald' }}
    >
      {name}
      <div className="navbar-link-bar" />
    </Link>
  );
};

// All navbar items
const NavLinks = () => {
  return (
    <>
      <ReactiveLink name="News" path="/news" />
      <ReactiveLink name="Life" path="/life" />
      <ReactiveLink name="Opinions" path="/opinions" />
      <ReactiveLink name="Entertainment" path="/entertainment" />
      <ReactiveLink name="Sports" path="/sports" />
      <ReactiveLink name="About" path="/about" />
      <ReactiveLink name="Submit an Ad" path="/submit-ad" />
      <ReactiveLink name="Contact Us" path="/contact" />
    </>
  );
};

// Main navbar component
export default function Navbar() {
  //Current date formatting
  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  //Current volume of Technique
  const currentVolume = 108;

  //Check whether navbar is open
  const [isOpen, setIsOpen] = useState(false);
  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  }

  // If page is scrolled past offset
  const [scrolled, setScrolled] = useState(false);
  const scrollThreshold = 95;

  //If nav is at top of page
  const [navAtTop, setNavAtTop] = useState(true);

  // Handle scroll event
  const onScroll = () => {
    //Check if page scrolled past offset
    setScrolled(window.scrollY > scrollThreshold);

    //Check if nav is at top of page
    const navbar = document.getElementById('navbar');
    const navbarTop = navbar ? navbar.getBoundingClientRect().top : 0;
    if (navbarTop <= 0) {
      setNavAtTop(true);
    } else {
      setNavAtTop(false);
    }
  };

  useEffect(() => {
    // Add scroll event listener
    window.addEventListener("scroll", onScroll);

    //Call onScroll on initial page load to set the correct state
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* header above navbar */}
      <div className="max-w-[1470px] gap-8 md:px-5 lg:px-8 hidden md:grid grid-cols-[1fr_500px_1fr] items-end mb-2 m-auto">
        {/* large masthead in header */}
        <a href ='/'><img src={Masthead} alt="Masthead" className="w-[500px] -mb-3 mt-4" /></a>

        {/* left of masthead */}
        <div className="order-first">
          {/* social media icons on large screens */}
          <p className="hidden lg:flex gap-2 justify-start items-center text-nique-blue">
            <a className='hover:text-nique-blue-hover' href='https://www.facebook.com/thenique' target='_blank'><FaFacebook /></a>
            <a className='hover:text-nique-blue-hover' href='https://twitter.com/the_nique' target='_blank'><FaXTwitter /></a>
            <a className='hover:text-nique-blue-hover' href='https://www.instagram.com/gt_nique' target='_blank'><FaInstagram /></a>
            <a className='hover:text-nique-blue-hover' href='https://www.tiktok.com/@gt_nique' target='_blank'><FaTiktok /></a>
            <a className='hover:text-nique-blue-hover' href='https://www.linkedin.com/company/technique-newspaper/' target='_blank'><FaLinkedin /></a>
          </p>
          {/* date on medium screens */}
          <h4 className='text-sm text-nique-blue'><span className="inline lg:hidden">{formattedDate}</span></h4>
        </div>

        {/* right of masthead */}
        <h4 className='text-right text-sm text-nique-blue'>
          {/* date and volume on large screens, date on medium screens */}
          <span className="hidden lg:inline">{formattedDate}</span>
          <span className="hidden xl:inline"> &bull; </span>
          <span className="inline xl:inline-block"><br></br></span>Volume {currentVolume}</h4>
      </div>

      {/* navbar section */}
      <div className="sticky top-0 z-50 ">
        <header id="navbar"
          className={`${scrolled ? "scrolled" : ""} ${navAtTop ? "bg-white" : "bg-transparent"}
        md:border-t border-b border-gray-400 md:border-black`}
        >
          {/* desktop nav links */}
          <div
            className={`hidden md:flex justify-evenly items-center w-full max-w-[1200px] m-auto`}
          >
            <NavLinks />
          </div>

          {/* mobile navbar with logo and burger */}
          <div className={`flex md:hidden py-1.5 px-4 w-full items-center justify-between `}>
            <a href ='/'><img src={MastheadMobile} alt="Technique Logo" className="w-[80%] max-w-[300px] my-3" /></a>
            <button onClick={toggleNavbar}>
              {isOpen ? <IoCloseSharp size={25} /> : <IoMenuSharp size={25} />}
            </button>
          </div>
        </header>
        <h4 className='block md:hidden border-b border-gray-400 bg-white px-4 py-1'>{formattedDate}</h4>
        {/* mobile navlinks */}
        {isOpen && (
          <div className='md:hidden h-screen pt-[5vh]'>
            <NavLinks />
          </div>
        )}
      </div>


    </>
  );
}