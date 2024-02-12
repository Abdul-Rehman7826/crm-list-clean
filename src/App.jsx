import { useState } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import "./App.css";

function App() {
  const zip = new JSZip();
  const [IDS_Groups, setIDS_Groups] = useState([]);
  const [IDS_Pages, setIDS_Pages] = useState([]);
  const [D7_Pages, setD7_Pages] = useState([]);

  const [cusLabel, setCusLabel] = useState("L - Leads In");
  const [tages, setTages] = useState("");

  const [numFiles, setNumFiles] = useState(0);
  const [next, setNext] = useState(0);

  const [fileName, setFileName] = useState(`Output ${fileNum()}`);
  const [loading, setLoading] = useState(false);

  function fileNum() {
    const ydate = new Date();
    return `${ydate.getFullYear()}${
      ydate.getMonth() > 10 ? ydate.getMonth() : "0" + ydate.getMonth()
    }${ydate.getDate() > 10 ? ydate.getDate() : "0" + ydate.getDate()}${
      ydate.getHours() > 10 ? ydate.getHours() : "0" + ydate.getHours()
    }${
      ydate.getMinutes() > 10 ? ydate.getMinutes() : "0" + ydate.getMinutes()
    }${
      ydate.getSeconds() > 10 ? ydate.getSeconds() : "0" + ydate.getSeconds()
    }`;
  }
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
    // console.log(e.target);
    const [file] = e.target.files;
    const controlId = e.target.id;
    const data = await processExcelFile(file);
    setLoading(false);
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
      var ind = data[0].indexOf("x1i10hfl");
      data.shift();
      var arr = data.map((v) => {
        return [v[0], v[ind]];
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

  const handleClick = async () => {
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
        cusLabel,
        tages,
        v[2] ? v[2] : "N/A",
      ];
    });

    var headers = [
      "Facebook ID",
      "Facebook Profile link",
      "Name",
      "Label Name",
      "Tags",
      "Email",
    ];

    // console.log(newArr);
    // [headers, ...newArr.slice(5, 10)]
    var dataArray = [];
    var n = Math.ceil(newArr.length / numFiles);

    for (var i = 0; i < newArr.length; i += n) {
      dataArray.push([headers, ...newArr.slice(i, i + n)]);
    }
    console.log(dataArray);
    const promises = dataArray.map(async (d) => {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(d);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });

      return blob;
    });
    const res = await Promise.all(promises);

    res.forEach((blob, i) => {
      zip.file(`${fileName} (${i}).xlsx`, blob);
    });
    const zipFile = await zip.generateAsync({ type: "blob" });
    console.log(zipFile);

    const url = URL.createObjectURL(zipFile);
    downloadFile(url);
    URL.revokeObjectURL(url);
    console.log("Done ! ");
  };

  function downloadFile(url) {
    const a = document.createElement("a");
    a.href = url;
    a.download = "export files.zip";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

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

          {next === 0 && (
            <>
              <hr className="hr-text" />
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
                  <div className="form-group w-100">
                    <div className="form-group w-100">
                      <div className="mt-3">
                        <hr className="hr-text" />
                        {/* <hr className="hr-text" data-content="OR" /> */}
                      </div>
                      <button
                        type="button"
                        className=" btn btn-info w-100"
                        onClick={() => setNext((i) => i + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
            </>
          )}

          {next === 1 && (
            <>
              <button className="btn" onClick={() => setNext((i) => i - 1)}>
                {"<--Back"}
              </button>
              <hr className="hr-text" />
              <div className="form-group">
                <label htmlFor="fileName" className="form-label">
                  Name of OutPut File :
                </label>
                <input
                  className="form-control"
                  type="text"
                  id="fileName"
                  placeholder={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
                <label htmlFor="cuslabel" className="form-label">
                  Custom Label :
                </label>
                <input
                  className="form-control"
                  type="text"
                  id="cuslabel"
                  placeholder={cusLabel}
                  onChange={(e) => setCusLabel(e.target.value)}
                />
                <label htmlFor="fileName" className="form-label">
                  Tags :
                </label>
                <input
                  className="form-control"
                  type="text"
                  id="fileName"
                  placeholder={tages}
                  onChange={(e) => setTages(e.target.value)}
                />
                <label htmlFor="numFiles" className="form-label">
                  Number of Files :
                </label>
                <input
                  className="form-control"
                  min={0}
                  value={numFiles}
                  onChange={(e) => {
                    console.log(numFiles);
                    setNumFiles(e.target.value);
                    console.log(e.target.value);
                  }}
                  type="number"
                  id="numFiles"
                />
              </div>
              <hr className="mb-3" />
              <button
                type="button"
                className=" btn btn-success w-100"
                onClick={handleClick}
              >
                Download File
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
