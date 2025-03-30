import { useEffect, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import './edit-article-styles.css';

export default function Editor() {
  const [lastModified, setLastModified] = useState<Date | string>("");


  const myColors = [
    "black",
    "#003057",
    "gray",
    "#5C8EB7",
    "#BAC0FF",
    "#1A1E47",
    "#133F91"
  ];
  const modules = {
    toolbar: [
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ align: ["", "right", "center", "justify"] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      [{ color: myColors }, { background: myColors }],
      ['clean']
    ]
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "link",
    "color",
    "image",
    "background",
    "align"
  ];

  const [code, setCode] = useState("");

  const handleProcedureContentChange = (content: never) => {
    setCode(content);
  };
  

  useEffect(() => {
    if (code != "<p><br></p>" && code != "") {
      console.log("Code" + code)
      setLastModified(new Date());
    }
  }, [code]);

  return (
    <div className="pb-4">
      <ReactQuill
        theme="snow"
        modules={modules}
        formats={formats}
        value={code}
        onChange={handleProcedureContentChange}
        className="h-100 mb-15 sm:mb-11"
      />
      {lastModified && <h1 className="text-sm text-nique-blue/50">Last Modified: {lastModified.toLocaleString()}</h1>}
    </div>
  );
}
