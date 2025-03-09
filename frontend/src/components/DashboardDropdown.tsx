import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";

const DashboardDropdown = ({
  opened,
  setOpened,
  title,
  icon,
  choices,
}: {
  opened: boolean;
  setOpened: (newOpened: boolean) => void;
  title: string;
  icon: any;
  choices: { name: string; onClick: () => void }[];
}) => {
  return opened ? (
    <div className="bg-nique-light-blue p-5 mb-5">
      <div
        className="flex flex-row mb-5 justify-center hover:cursor-pointer"
        onClick={() => setOpened(false)}
      >
        {icon}
        <h6 className="text-white font-bold text-xl tracking-wider ml-2">
          {title}
        </h6>
        <div className="flex-auto" />
        <ChevronUpIcon className="stroke-white" />
      </div>
      {choices.map((value, index) => {
        return (
          <h6
            key={index}
            className="text-nique-blue text-md my-3 mx-3 hover:text-nique-blue-hover hover:cursor-pointer"
            onClick={value.onClick}
          >
            {value.name}
          </h6>
        );
      })}
    </div>
  ) : (
    <div className="bg-nique-blue p-5">
      <div
        className="flex flex-row mb-5 justify-center hover:cursor-pointer"
        onClick={() => setOpened(true)}
      >
        {icon}
        <h6 className="text-white font-bold text-xl tracking-wider ml-2">
          {title}
        </h6>
        <div className="flex-auto" />
        <ChevronDownIcon className="stroke-white" />
      </div>
    </div>
  );
};

export default DashboardDropdown;
