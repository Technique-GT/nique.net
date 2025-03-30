export default function FeaturedImage() {

    return (
        <div className="section p-4">
            <h2 className="font-bold mt-0 mb-2">Featured Image</h2>
            <input className="max-w-full" type="file" id="img" name="img" accept="image/*" />
            <h2 className="mt-4 mb-1">Image caption</h2>
            <textarea className="w-full border border-gray-300 rounded-md p-2 h-30" placeholder="Enter caption here..."></textarea>
            <h2 className="mt-4 mb-1">Photographer</h2>
            <input type="text" className="w-full border border-gray-300 rounded-md p-2"></input>
            <h2 className="mt-4 mb-1">Photographer Affiliation</h2>
            <input type="text" className="w-full border border-gray-300 rounded-md p-2"></input>
        </div>
    );
}