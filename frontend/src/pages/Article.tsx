import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function Article() {
        const {id}=useParams();
        const navigate = useNavigate()

        useEffect(()=>{
            console.log(id)
        },[])

    return (
        <>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={() => navigate('/')}> Go back</button>
            <h1 className="text-3xl font-bold">
                This is an article! Article id: {id}. Someone set up an actual db lol.
            </h1>
        </>
    );
}