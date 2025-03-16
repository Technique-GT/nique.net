import Navbar from "../components/Navbar";
import { staff } from "../types/staff";
import Print from "../assets/print_issues.png";

function Contact() {
  return (
    <div>
        <Navbar />
        <div className='max-w-[1470px] m-auto p-5 grid grid-cols-1 md:grid-cols-[auto_65%] gap-4'>
            <div className="flex justify-center items-center">
                <img src={Print} alt="The Technique"/> {/* place holder image, intended to be something about the Technique, like one of the article posts on their insta */}
            </div>
            <div>
            <h4 className="font-bold mb-2 text-2xl text-nique-blue">Contact The Technique</h4>
            <p> 
                If you're trying to get in touch with a member of the Technique staff, please see below. 
                If you're unsure whom to contact, email <a href={`mailto:${staff[0].email}`} className="hover:text-nique-light-blue"><u>{staff[0].name}</u></a> or call (678) 713-1980.
            </p>

            <p>
                To submit a letter to the editor, email <a href={`mailto:${staff[8].email}`} className="hover:text-nique-light-blue"><u>{staff[8].name}</u></a>, our opinions editor. 
                For other inquiries please choose the appropriate contact from the list below.
            </p>

            
            <h4 className="font-bold my-2 text-2xl text-nique-blue">Editorial Staff</h4>
            <p>{staff[0].role}: <a href={`mailto:${staff[0].email}`} className="hover:text-nique-light-blue"><u>{staff[0].name}</u></a></p>
            <p>{staff[1].role}: <a href={`mailto:${staff[1].email}`} className="hover:text-nique-light-blue"><u>{staff[1].name}</u></a></p>
            <p>{staff[2].role}: <a href={`mailto:${staff[2].email}`} className="hover:text-nique-light-blue"><u>{staff[2].name}</u></a></p>
            <p>{staff[3].role}: <a href={`mailto:${staff[3].email}`} className="hover:text-nique-light-blue"><u>{staff[3].name}</u></a></p>
            <p>{staff[4].role}: <a href={`mailto:${staff[4].email}`} className="hover:text-nique-light-blue"><u>{staff[4].name}</u></a></p>
            <p>{staff[5].role}: <a href={`mailto:${staff[5].email}`} className="hover:text-nique-light-blue"><u>{staff[5].name}</u></a></p>
            <p>{staff[6].role}: <a href={`mailto:${staff[6].email}`} className="hover:text-nique-light-blue"><u>{staff[6].name}</u></a></p>
            <p>{staff[7].role}: <a href={`mailto:${staff[7].email}`} className="hover:text-nique-light-blue"><u>{staff[7].name}</u></a></p>
            <p>{staff[8].role}: <a href={`mailto:${staff[8].email}`} className="hover:text-nique-light-blue"><u>{staff[8].name}</u></a></p>
            <p>{staff[9].role}: <a href={`mailto:${staff[9].email}`} className="hover:text-nique-light-blue"><u>{staff[9].name}</u></a></p>
            <p>{staff[10].role}: <a href={`mailto:${staff[10].email}`} className="hover:text-nique-light-blue"><u>{staff[10].name}</u></a></p>
            <p>{staff[11].role}: <a href={`mailto:${staff[11].email}`} className="hover:text-nique-light-blue"><u>{staff[11].name}</u></a></p>

            <h4 className="font-bold my-2 text-2xl text-nique-blue">Georgia Tech Student Media Administrative Staff</h4>
            <p>{staff[12].role}: <a href={`mailto:${staff[12].email}`} className="hover:text-nique-light-blue"><u>{staff[12].name}</u></a> ({staff[12].contact})</p>
            <p>Student Media Marketing and Advertising Coordinator: <a href={`mailto:${staff[0].email}`} className="hover:text-nique-light-blue"><u>{staff[0].name}</u></a> & <a href={`mailto:${staff[1].email}`} className="hover:text-nique-light-blue"><u>{staff[1].name}</u></a></p>
            </div>
        </div>
    </div>
  );
}

export default Contact;