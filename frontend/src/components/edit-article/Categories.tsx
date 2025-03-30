export default function Categories() {
    const categories = ["News", "Life", "Opinion", "Entertainment", "Sports"];

    return (
        <div className="section p-4">
            <h2 className="font-bold mt-0 mb-2">Categories</h2>
            {categories.map(category =>
                <>
                    <input key={category} className="mr-3" type="checkbox" />
                    <label>{category}</label>
                    <br />
                </>
            )}

        </div>
    );
}