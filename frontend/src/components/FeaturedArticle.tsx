import { EllipsisVertical } from "lucide-react";

const FeaturedArticle = ({
  title,
  category,
  author,
}: {
  title: string;
  category: string;
  author: string;
}) => {
  return (
    <div className="max-w-100">
      <div className="bg-white rounded-lg flex p-6 mt-1 border-1 border-gray-300">
        <div className="flex-auto">
          <h5 className="font-bold text-2xl">{title}</h5>
          <h5 className="font-light text-gray-400 mt-3">
            <em>{category}</em> | {author}
          </h5>
        </div>
        <div className="mt-1 ml-5">
          <EllipsisVertical />
        </div>
      </div>
    </div>
  );
};

export default FeaturedArticle;
