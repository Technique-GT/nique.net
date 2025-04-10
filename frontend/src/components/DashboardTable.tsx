import { ReactNode } from "react";

const DashboardTable = ({
  headers,
  data,
  minWidth = null,
}: {
  headers: (string | ReactNode)[]; // values that go in header row
  data: (string | ReactNode)[][];
  minWidth?: number[] | null; // width of each col (SAME LEN AS HEADERS)
}) => {
  return (
    <table className="table-auto text-left w-full">
      <thead>
        <tr>
          {headers.map((value, index) => {
            return (
              <th
                key={index}
                className={`text-gray-600 p-2 italic font-normal ${
                  minWidth === null ? "" : `min-width-${minWidth[index]}`
                }`}
              >
                {value}
              </th>
            );
          })}
        </tr>
      </thead>

      <tbody>
        {data.map((value, rowIndex) => {
          return (
            <tr key={rowIndex} className="text-gray-600">
              {value.map((value, index, arr) => {
                return (
                  <td key={index}>
                    <div
                      className={`${
                        index == 0
                          ? "rounded-l-lg border-l-2"
                          : index == arr.length - 1
                          ? "rounded-r-lg border-r-2"
                          : ""
                      } content-center min-h-18 p-2 border-y-2 border-gray-300 mb-1 truncate
                      ${rowIndex % 2 == 0 ? "bg-white" : "bg-gray-100"}`}
                    >
                      {value}
                    </div>
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default DashboardTable;
