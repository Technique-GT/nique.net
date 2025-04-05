import {
  XIcon,
  SquarePen,
  Trophy,
  MessageCircleMore,
  Monitor,
  EllipsisVertical,
} from "lucide-react";
import DashboardTable from "../../components/DashboardTable";
import FeaturedArticle from "../../components/FeaturedArticle";
import { BsSpotify } from "react-icons/bs";

export default function DashboardHome() {
  return (
    <div className="mx-10">
      <div className="flex flex-row shadow-black shadow-lg">
        <div className="bg-nique-blue w-2 rounded-l-lg" />
        <div className="bg-white flex-auto p-5 min-h-25 flex flex-row">
          <h5 className="flex-auto text-black">
            Notice: <b>[Story]</b> is updated!
          </h5>
          <XIcon />
        </div>
      </div>
      <div className="mx-5 flex">
        <div className="flex-2">
          <h4 className="my-10 text-3xl tracking-wider text-nique-blue">
            Activity & Metrics
          </h4>
          <DashboardTable
            headers={[
              <div className="ml-5">Icon</div>,
              "Article & Category",
              "Time",
              "Status",
              "Sessions",
              "Session Duration",
              "Page Views",
              "",
            ]}
            minWidth={[0, 40, 150, 0, 0, 0, 0, 0]}
            data={[
              [
                <div className="bg-blue-200 rounded-full p-2 w-10 h-10 ml-3">
                  <Trophy />
                </div>,
                <>
                  <b>GT Badminton Team Reaches DIV 1A</b>
                  <br />
                  <div className="font-light text-sm">
                    <em>Sports</em>
                  </div>
                </>,
                <em>10:00pm</em>,
                <em>PUBLISHED</em>,
                <em>35</em>,
                <em>10 min</em>,
                <em>50</em>,
                <MessageCircleMore />,
              ],
              [
                <div className="bg-pink-200 rounded-full p-2 w-10 h-10 ml-3">
                  <Monitor />
                </div>,
                <>
                  <b>Chinese Traditional Dance returns at Lantern Fest</b>
                  <br />
                  <div className="font-light text-sm">
                    <em>Entertainment</em>
                  </div>
                </>,
                <em></em>,
                <em></em>,
                <em></em>,
                <em></em>,
                <em></em>,
                <MessageCircleMore />,
              ],
            ]}
          />
        </div>
        {/* <div className="flex-1 ml-5">
            <h4 className="my-10 text-4xl tracking-wider">Activity</h4>
            <DashboardTable
              headers={["Featured", "Title", "Edit"]}
              minWidth={[40, 150]}
              data={[
                [
                  "Featured 1",
                  "Pro Volleyball has a new vibe",
                  <SquarePen className="text-nique-blue hover:cursor-pointer hover:text-nique-blue-hover" />,
                ],
                [
                  "Featured 2",
                  "Pro Volleyball has a new vibe",
                  <SquarePen className="text-nique-blue hover:cursor-pointer hover:text-nique-blue-hover" />,
                ],
                [
                  "Featured 3",
                  "Pro Volleyball has a new vibe",
                  <SquarePen className="text-nique-blue hover:cursor-pointer hover:text-nique-blue-hover" />,
                ],
                [
                  "Featured 4",
                  "Pro Volleyball has a new vibe",
                  <SquarePen className="text-nique-blue hover:cursor-pointer hover:text-nique-blue-hover" />,
                ],
              ]}
            />
          </div> */}
      </div>
      <div className="mx-5">
        <h4 className="my-10 text-3xl tracking-wider text-nique-blue">
          Miscellaneous Updates
        </h4>
        <h5 className="font-light">
          <em>Main Featured Story</em>
        </h5>
        <FeaturedArticle
          title={"Ashlyn Goolsby reflects on volleyball season thus far"}
          category={"SPORTS"}
          author={"Priyali Bandla"}
        />
        <h5 className="font-light mt-10">
          <em>Sub Features</em>
        </h5>
        <div className="flex gap-5">
          <FeaturedArticle
            title={"Tech students help establish a mobile laundry"}
            category={"Life"}
            author={"Ryan Zimmerman"}
          />
          <FeaturedArticle
            title={"Tech students help establish a mobile laundry"}
            category={"Life"}
            author={"Ryan Zimmerman"}
          />
        </div>
        <div className="flex gap-5 mt-5">
          <FeaturedArticle
            title={"Tech students help establish a mobile laundry"}
            category={"Life"}
            author={"Ryan Zimmerman"}
          />
          <FeaturedArticle
            title={"Tech students help establish a mobile laundry"}
            category={"Life"}
            author={"Ryan Zimmerman"}
          />
        </div>
        <h5 className="font-light mt-10">
          <em>News</em>
        </h5>
        <FeaturedArticle
          title={"Ashlyn Goolsby reflects on volleyball season thus far"}
          category={"SPORTS"}
          author={"Priyali Bandla"}
        />
        <h5 className="font-light mt-10">
          <em>Entertainment</em>
        </h5>
        <FeaturedArticle
          title={"Ashlyn Goolsby reflects on volleyball season thus far"}
          category={"SPORTS"}
          author={"Priyali Bandla"}
        />
        <h5 className="font-light mt-10">
          <em>Life</em>
        </h5>
        <FeaturedArticle
          title={"Ashlyn Goolsby reflects on volleyball season thus far"}
          category={"SPORTS"}
          author={"Priyali Bandla"}
        />
        <h5 className="font-light mt-10">
          <em>Opinion</em>
        </h5>
        <FeaturedArticle
          title={"Ashlyn Goolsby reflects on volleyball season thus far"}
          category={"SPORTS"}
          author={"Priyali Bandla"}
        />
        <h5 className="font-light mt-10">
          <em>Sports</em>
        </h5>
        <FeaturedArticle
          title={"Ashlyn Goolsby reflects on volleyball season thus far"}
          category={"SPORTS"}
          author={"Priyali Bandla"}
        />
        <h5 className="font-light mt-10">
          <em>Spotify</em>
        </h5>
        <div className="max-w-100">
          <div className="bg-white rounded-lg flex p-6 mt-1 border-1 border-gray-300">
            <div className="flex-auto">
              <h5 className="font-bold text-2xl">Enter the new embed link:</h5>
              <input className="bg-gray-100 rounded-md" placeholder="link" />
            </div>
            <div className="mt-1 ml-5">
              <BsSpotify className="w-10 h-10 text-green-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
