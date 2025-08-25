import { Link } from "react-router";

export default function Navbar() {
    return (
        <nav className="navbar">
            <Link to="/">
                <p className="text-lg sm:text-2xl  font-bold text-gradient">RESUMIND</p>
            </Link>
            <Link to="/upload" className="primary-button w-fit text-sm sm:text-2xl">Upload Resume</Link>
        </nav>
    );
}
