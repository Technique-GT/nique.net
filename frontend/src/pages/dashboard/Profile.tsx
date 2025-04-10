import { MessageCircleMore, Monitor, Trophy } from "lucide-react";
import DashboardTable from "../../components/DashboardTable";

export default function Profile() {
  return (
    <div className="mx-15">
      <h4 className="my-10 text-3xl tracking-wider text-nique-blue">
        Articles Written
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
  );
}
