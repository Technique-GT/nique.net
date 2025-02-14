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
            <div className="max-w-7xl mx-auto p-6">
                {/* <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex justify-baseline" onClick={() => navigate('/')}> Go back</button> */}
                {/* <h1 className="text-3xl font-bold">
                    This is an article! Article id: {id}. Someone set up an actual db lol.
                </h1> */}
                <header className="flex justify-between items-center border-b pb-4 mb-6">
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={() => navigate('/')}>
                        Go back
                    </button>
                </header>
                <article>
                    <h2 className="text-4xl font-bold mb-2">Article Title</h2>
                    <p className="text-gray-600">By John Doe - November 12, 2023</p>
                    <div className="my-6">
                        <img src="https://via.placeholder.com/800x400" alt="Image" className="w-full rounded-lg shadow-md" />
                    </div>
                    <p className="text-lg text-gray-800 leading-relaxed mb-4">
                        paragraph 1 This is an article! Article id: {id}. Someone set up an actual db lol.
                    </p>
                    <p className="text-lg text-gray-800 leading-relaxed mb-4">
                        paragraph 2 (could possibly make separate paragraphs in one go)
                    </p>
                    <div className="mt-10 border-t pt-6">
                        <h3 className="text-2xl font-bold mb-4">Related Articles</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-100 p-4 rounded-lg shadow">
                                <p className="font-semibold">article 1</p>
                            </div>
                            <div className="bg-gray-100 p-4 rounded-lg shadow">
                                <p className="font-semibold">article 2</p>
                            </div>
                            <div className="bg-gray-100 p-4 rounded-lg shadow">
                                <p className="font-semibold">article 3</p>
                            </div>
                        </div>
                    </div>
                </article>
            </div>
            
        </>
    );
}