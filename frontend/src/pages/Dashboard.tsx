import axios from "axios";
import cookie from "js-cookie";
import {
  Camera,
  FilePlus,
  Home,
  User,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardDropdown from "../components/DashboardDropdown";

export default function Dashboard() {
  const [postsOpened, setPostsOpened] = useState<boolean>(false);
  const [authorOpened, setAuthorOpened] = useState<boolean>(false);
  const [mediaOpened, setMediaOpened] = useState<boolean>(false);

  const navigate = useNavigate();
  useEffect(() => {
    const jwt_token = cookie.get("jwt");
    if (cookie.get("jwt") === undefined) {
      // Not logged in
      navigate("/admin");
    } else {
      axios
        .get("http://127.0.0.1:5050/auth/test_token", {
          headers: { Authorization: `Bearer ${jwt_token}` },
        })
        .then(
          () => {
            // User logged in
          },
          () => {
            // Login session expired
            navigate("/admin");
          }
        );
    }
  }, []);

  return (
    <>
      <div className="flex flex-row h-screen">
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
          <div className="bg-white text-center mx-5 my-10 rounded-2xl p-3">
            <h6 className="text-lg font-bold text-nique-blue">Dashboard</h6>
          </div>

          <DashboardDropdown
            opened={postsOpened}
            setOpened={setPostsOpened}
            title={"Posts"}
            icon={<FilePlus className="stroke-white" />}
            choices={[
              { name: "All Posts", onClick: () => {} },
              { name: "Add New Posts", onClick: () => {} },
              { name: "Categories", onClick: () => {} },
              { name: "Tags", onClick: () => {} },
            ]}
          />
          <DashboardDropdown
            opened={authorOpened}
            setOpened={setAuthorOpened}
            title={"Author"}
            icon={<User className="stroke-white" />}
            choices={[{ name: "Todo", onClick: () => {} }]}
          />
          <DashboardDropdown
            opened={mediaOpened}
            setOpened={setMediaOpened}
            title={"Media"}
            icon={<Camera className="stroke-white" />}
            choices={[{ name: "Todo", onClick: () => {} }]}
          />
        </div>

        <div className="flex-7 bg-gray-200">
          <h4 className="px-15 py-8 text-4xl tracking-wider border-b-2 mb-5 border-b-gray-300">
            Dashboard
          </h4>
          <div className="mx-10">
            <div className="flex flex-row shadow-black shadow-lg">
              <div className="bg-nique-blue w-2 rounded-l-lg" />
              <div className="bg-white flex-auto p-5 min-h-25 flex flex-row">
                <h5 className="flex-auto text-gray-500">
                  Notice: <b>[Story]</b> is updated!
                </h5>
                <XIcon />
              </div>
            </div>
            <div className="mx-5">
              <h4 className="my-10 text-4xl tracking-wider">Activity</h4>
              <table className="table-auto text-left">
                <thead>
                  <tr>
                    <th className="border-2 border-gray-300 text-gray-600 p-2 min-w-40">Time Published</th>
                    <th className="border-2 border-gray-300 text-gray-600 p-2 min-w-150">Post</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td className="border-2 border-gray-300 text-gray-600 p-2">Today, 10:00am</td>
                    <td className="border-2 border-gray-300 text-gray-600 p-2">EXCEL</td>
                  </tr>
                  <tr>
                    <td className="border-2 border-gray-300 text-gray-600 p-2">Today, 8:00am</td>
                    <td className="border-2 border-gray-300 text-gray-600 p-2">Pro Volleyball has a new vibe</td>
                  </tr>
                  <tr>
                    <td className="border-2 border-gray-300 text-gray-600 p-2">Today, 8:00am</td>
                    <td className="border-2 border-gray-300 text-gray-600 p-2">Pro Volleyball has a new vibe</td>
                  </tr>
                  <tr>
                    <td className="border-2 border-gray-300 text-gray-600 p-2">Today, 8:00am</td>
                    <td className="border-2 border-gray-300 text-gray-600 p-2">Pro Volleyball has a new vibe</td>
                  </tr>
                  <tr>
                    <td className="border-2 border-gray-300 text-gray-600 p-2">Today, 8:00am</td>
                    <td className="border-2 border-gray-300 text-gray-600 p-2">Pro Volleyball has a new vibe</td>
                  </tr>
                  <tr>
                    <td className="border-2 border-gray-300 text-gray-600 p-2">Today, 8:00am</td>
                    <td className="border-2 border-gray-300 text-gray-600 p-2">Pro Volleyball has a new vibe</td>
                  </tr>
                  <tr>
                    <td className="border-2 border-gray-300 text-gray-600 p-2">Today, 8:00am</td>
                    <td className="border-2 border-gray-300 text-gray-600 p-2">Pro Volleyball has a new vibe</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
