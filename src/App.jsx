import { useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";

function App() {
  const [IDS_Groups, setIDS_Groups] = useState([]);
  const [IDS_Pages, setIDS_Pages] = useState([]);
  const [D7_Pages, setD7_Pages] = useState([]);
  const [loading, setLoading] = useState(false);

  function readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        resolve(jsonData);
      };

      reader.onerror = function (error) {
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  async function processExcelFile(file) {
    try {
      const excelData = await readExcelFile(file);
      console.log("Excel file data:", excelData);
      return excelData;
    } catch (error) {
      console.error("Error reading Excel file:", error);
      return [];
    }
  }

  const onChange = async (e) => {
    const [file] = e.target.files;
    const controlId = e.target.id;
    const data = await processExcelFile(file);
    setLoading((loading) => !loading);
    console.log("++++++");
    if (controlId == "IDS_Groups") {
      data.shift();
      var arr = data.map((v) => {
        return [v[0], v[2]];
      });
      console.log(arr);
      if (arr.length > 0) setIDS_Groups(arr);
    }
    if (controlId == "IDS_Pages") {
      data.shift();
      var arr = data.map((v) => {
        return [v[0], v[2]];
      });
      console.log(arr);
      if (arr.length > 0) setIDS_Pages(arr);
    }
    if (controlId == "D7_Pages") {
      data.shift();
      data.shift();
      var arr = data.map((v) => {
        return [v[6], v[0], v[2]];
      });
      console.log(arr);
      if (arr.length > 0) setD7_Pages(arr);
    }
  };

  const handleClick = () => {
    var arr = [];

    arr.push(...IDS_Groups);
    arr.push(...IDS_Pages);
    arr.push(...D7_Pages);

    var newArr = [];

    arr.forEach((v, i, ar) => {
      if (v[0]) newArr.push(v);
    });

    newArr = removeDuplicatesByColumn(newArr, 1);

    newArr.forEach((v, i, arr) => {
      var aa = v[0].replace("?__tn__=%3C", "");
      aa = aa.replace("&__tn__=%3C", "");
      aa = aa.replace(/\/$/, "");

      var id_ = "";

      if (aa.toString().indexOf("?id=") !== -1) {
        id_ = aa.substring(aa.lastIndexOf("?id=") + 4);
      } else {
        id_ = aa.substring(aa.lastIndexOf("/") + 1);
      }

      arr[i] = [
        id_,
        "https://www.facebook.com/" + id_,
        v[1],
        "L - Leads In",
        "",
        v[2] ? v[2] : "N/A",
      ];
    });

    var data = [
      [
        "Facebook ID",
        "Facebook Profile link",
        "Name",
        "Label Name",
        "Tags",
        "Email",
      ],
    ];
    data.push(...newArr);
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.xlsx";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("Done ! ");
  };

  function removeDuplicatesByColumn(arr, columnIndex) {
    var uniqueArray = [];
    var seen = {};

    for (var i = 0; i < arr.length; i++) {
      var value = arr[i][columnIndex];

      if (!seen[value]) {
        uniqueArray.push(arr[i]);
        seen[value] = true;
      }
    }

    // console.log(seen);
    return uniqueArray;
  }

  return (
    <>
      <div className="p-3 d-flex flex-column justify-content-center">
        <div className="form-container">
          <h1 className="text-center">CRM List Clean</h1>
          <hr className="mb-3" />

          <div className="form-group">
            <label htmlFor="IDS_Groups" className="form-label">
              IDS Groups
            </label>
            <input
              className="form-control"
              type="file"
              id="IDS_Groups"
              accept=".xlsx"
              onChange={onChange}
              onClick={() => setLoading(true)}
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="IDS_Pages" className="form-label">
              IDS Pages
            </label>
            <input
              className="form-control"
              type="file"
              id="IDS_Pages"
              accept=".xlsx"
              onChange={onChange}
              onClick={() => setLoading(true)}
            />
          </div>
          <div className="mb-3 from-group">
            <label htmlFor="D7_Pages" className="form-label">
              D7 Pages
            </label>
            <input
              className="form-control"
              type="file"
              id="D7_Pages"
              accept=".xlsx"
              onChange={onChange}
              onClick={() => setLoading(true)}
            />
          </div>

          {(IDS_Groups.length > 0 ||
            IDS_Pages.length > 0 ||
            D7_Pages.length > 0) &&
            !loading && (
              <div className="form-group">
                <button
                  type="button"
                  className="btn btn-success btn-block"
                  onClick={handleClick}
                >
                  Download File
                </button>
              </div>
            )}
        </div>
      </div>
    </>
  );
}

export default App;
