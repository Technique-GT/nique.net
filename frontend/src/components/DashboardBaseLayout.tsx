import { Camera, FilePlus, Home, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardDropdown from "../components/DashboardDropdown";

export default function DashboardBaseLayout(props: { children: any }) {
  const { children } = props;

  const [postsOpened, setPostsOpened] = useState<boolean>(false);
  const [authorOpened, setAuthorOpened] = useState<boolean>(false);
  const [mediaOpened, setMediaOpened] = useState<boolean>(false);

  const navigate = useNavigate();

  return (
    <div className="flex flex-row min-h-screen h-full">
      <div className="bg-nique-blue min-w-40 flex-1">
        <div
          className="my-10 flex flex-row justify-center items-center **:text-white text-2xl text-center hover:cursor-pointer"
          onClick={() => {
            navigate("/");
          }}
        >
          <Home />
          <h4 className="ml-3">Technique</h4>
        </div>
        <div
          className="bg-white text-center mx-5 my-10 rounded-2xl p-3 hover:cursor-pointer"
          onClick={() => {
            navigate("/dashboard");
          }}
        >
          <h6 className="text-lg font-bold text-nique-blue">Dashboard</h6>
        </div>

        <DashboardDropdown
          opened={postsOpened}
          setOpened={setPostsOpened}
          title={"Posts"}
          icon={<FilePlus className="stroke-white" />}
          choices={[
            {
              name: "All Posts",
              onClick: () => {
                navigate("/dashboard/all-posts");
              },
            },
            {
              name: "Add New Posts",
              onClick: () => {
                navigate("/dashboard/edit-article");
              },
            },
            {
              name: "Categories",
              onClick: () => {
                navigate("/dashboard/categories");
              },
            },
            { name: "Tags", onClick: () => navigate("/dashboard/tags") },
          ]}
        />
        <DashboardDropdown
          opened={authorOpened}
          setOpened={setAuthorOpened}
          title={"Author"}
          icon={<User className="stroke-white" />}
          choices={[
            {
              name: "All Authors",
              onClick: () => {
                navigate("/dashboard/all-authors");
              },
            },
            {
              name: "Add New Author",
              onClick: () => {
                navigate("/dashboard/add-new-author");
              },
            },
            {
              name: "Profile",
              onClick: () => {
                navigate("/dashboard/profile");
              },
            },
            {
              name: "User Role Editor",
              onClick: () => {
                navigate("/dashboard/user-role-editor");
              },
            },
          ]}
        />
        <DashboardDropdown
          opened={mediaOpened}
          setOpened={setMediaOpened}
          title={"Media"}
          icon={<Camera className="stroke-white" />}
          choices={[
            {
              name: "Library",
              onClick: () => {
                navigate("/dashboard/library");
              },
            },
            {
              name: "Add New Media File",
              onClick: () => {
                navigate("/dashboard/add-new-media-file");
              },
            },
          ]}
        />
      </div>
      <div className="flex-7 bg-gray-100 pb-20">{children}</div>
    </div>
  );
}

DashboardBaseLayout.defaultProps = {
  children: [],
};
