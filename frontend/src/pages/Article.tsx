import { useEffect } from "react";
import { useParams } from "react-router-dom";

export default function Article() {
        const {id}=useParams();

        useEffect(()=>{
            console.log(id)
        },[])
    return (
        <>
            <h1 className="text-3xl font-bold">
                This is an article! Article id: {id}. Someone set up an actual db lol.
            </h1>
        </>
    );
}