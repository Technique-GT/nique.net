import Navbar from '../components/Navbar';
import { useState } from 'react';
import MediaKit from '../assets/media-kit-2024.pdf';
import PDFViewer from '../components/PDFViewer';

const adPricePlans = [
    {
        type: "Campus Organization Ads",
        price: "$50-$495",
        link: "https://epay.gatech.edu/C20793_ustores/web/product_detail.jsp?PRODUCTID=5817"
    },
    {
        type: "Local Advertisers Ads",
        price: "$180-$1150",
        link: "https://epay.gatech.edu/C20793_ustores/web/product_detail.jsp?PRODUCTID=5818"
    },
    {
        type: "National Advertisers Ads",
        price: "$135-$1510",
        link: "https://epay.gatech.edu/C20793_ustores/web/product_detail.jsp?PRODUCTID=5819"
    },
    {
        type: "RSO Ads",
        price: "$35-$420",
        link: "https://epay.gatech.edu/C20793_ustores/web/product_detail.jsp?PRODUCTID=5820"
    }
]    

function SubmitAd() {
    const [showPDF, setShowPDF] = useState(false);

    const onClick = () => {
        setShowPDF(!showPDF);
    }

    return (
        <>
            <Navbar />
            <div className="max-w-5xl mx-auto p-5">
                <div className="my-4">
                    <h4 className="text-2xl font-bold mb-2 text-nique-blue">Submit an Ad</h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 justify-between radius-md">
                        <div className="border rounded-md border-nique-blue py-12 px-20">
                            <h4 className="text-4xl font-bold mb-4 text-nique-blue">1.</h4>
                            <h4 className="text-xl font-bold text-nique-blue">Check out our media kit!</h4>
                            <h6 className="mb-4">Take time to review the rules of entry to ensure your campaign qualifies.</h6>
                            <button className='bg-nique-blue hover:bg-nique-blue-hover rounded-md text-white px-2 py-1' onClick={onClick}>
                                <h4>Read the rules</h4>
                            </button>
                        </div>
                        
                        <div className="border rounded-md border-nique-blue py-12 px-20">
                            <h4 className="text-4xl font-bold mb-4 text-nique-blue">2.</h4>
                            <h4 className="text-xl font-bold text-nique-blue">Submit online</h4>
                            <h6 className="mb-4">View the price plans below and place an order for your ad.</h6> 
                            <a href="https://epay.gatech.edu/C20793_ustores/web/store_main.jsp?STOREID=13&FROMQRCODE=true" 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                <button className='bg-nique-blue hover:bg-nique-blue-hover rounded-md text-white px-2 py-1'>
                                    <h4>Submit your ad</h4>
                                </button>
                            </a>
                        </div>
                    </div>
                </div>

                <PDFViewer 
                  isOpen={showPDF}
                  onClose={() => setShowPDF(false)}
                  pdfFile={MediaKit}
                  title="Media Kit 2024"
                />

                <div className="my-4">
                    <h4 className="text-2xl font-bold mb-2 text-nique-blue mt-6">Price Plans</h4>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 justify-between radius-md">
                        {adPricePlans.map((ad) => (
                            <a href={ad.link} target="_blank" rel="noopener noreferrer">
                            <div className="border rounded-md border-nique-blue aspect-square p-4 lg:p-6 flex flex-col justify-center hover:shadow-xl hover:bg-nique-blue-hover/4 transition duration-300">
                                <h4 className="text-4xl font-bold text-nique-blue text-center">{ad.price}</h4>
                                <h6 className="text-sm mb-4 text-nique-blue text-center">(price depends on color & size)</h6>
                                <h6 className="text-center">{ad.type}</h6>
                             </div>
                            </a>
                        ))}
                    </div>
                </div>

                <div className="my-4">
                    <h4 className="text-2xl font-bold mb-2 text-nique-blue mt-6">Need help?</h4>
                    <a href="/contact" className="block">
                        <h6 className="hover:text-nique-blue-hover">
                            <u>Contact Us.</u>
                        </h6>
                    </a>
                </div>
            </div>
        </>
    );
};

export default SubmitAd;