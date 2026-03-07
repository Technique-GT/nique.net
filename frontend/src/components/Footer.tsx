import { staff } from "../types/staff";

function Footer() {
    return (
        <footer className="w-full bg-white text-sm">
            <div className="mx-auto max-w-[80%] py-10 px-5">
                <p className="text-left">Copyright &copy; {new Date().getFullYear()} {staff[0].name}, Editor-in-Chief, Technique</p>
            </div>
        </footer>
    );
}

export default Footer;