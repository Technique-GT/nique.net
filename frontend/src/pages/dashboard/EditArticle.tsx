import AddAuthors from '../../components/edit-article/Authors';
import Categories from '../../components/edit-article/Categories';
import Comments from '../../components/edit-article/Comments';
import Editor from '../../components/edit-article/Editor';
import FeaturedImage from '../../components/edit-article/FeaturedImage';
import Slug from '../../components/edit-article/Slug';
import Tags from '../../components/edit-article/Tags';

export default function EditArticle() {

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Edit Article</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="gap-4 w-full md:w-3/4">
          <input className="section p-2 mb-4" placeholder="Article Title"></input>
          <Editor />
          <Tags />
        </div>
        <div className="flex flex-col sm:flex-row md:flex-col gap-4 w-full md:w-1/4">
          <div className="flex w-full flex-col gap-4">
            <FeaturedImage />
            <AddAuthors />
            <Slug />
          </div>
          <div className="flex w-full flex-col gap-4">
            <Comments />
            <Categories />
          </div>
        </div>
      </div>
    </div>
  );
};