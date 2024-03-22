import { useState } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import "./App.css";

function App() {
  const zip = new JSZip();
  const [ES_Pages, setES_Pages] = useState([]);
  const [IDS_Groups, setIDS_Groups] = useState([]);
  const [IDS_Pages, setIDS_Pages] = useState([]);
  const [D7_Pages, setD7_Pages] = useState([]);
  const [IDS_Friends, setIDS_Friends] = useState([]);
  const [IDS_Ads, setIDS_Ads] = useState([]);
  const [allData, setAllData] = useState([]);

  const [cusLabel, setCusLabel] = useState("L - Leads In");
  const [tages, setTages] = useState("");

  const [numRows, setNumRows] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [next, setNext] = useState(0);

  const [arrSplit, setArrSplit] = useState([]);
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
      // console.log("Excel file data:", excelData);
      return excelData;
    } catch (error) {
      // console.error("Error reading Excel file:", error);
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
    var arr = [];
    if (controlId == "ES_Pages") {
      data.shift();
      var arr = data.map((v) => {
        return [v[3], v[2], v[1]];
      });

      arr = arr.filter((v) => v[0].includes("facebook.com/pages/"));

      // console.log(arr);
      if (arr.length > 0) setES_Pages(arr);
    }
    if (controlId == "IDS_Groups") {
      data.shift();
      var arr = data.map((v) => {
        return [v[3], v[2]];
      });
      // console.log(arr);
      if (arr.length > 0) setIDS_Groups(arr);
    }
    if (controlId == "IDS_Pages") {
      var ind = data[0].indexOf("x1i10hfl");
      data.shift();
      var arr = data.map((v) => {
        return [v[0], v[ind]];
      });
      // console.log(arr);
      if (arr.length > 0) setIDS_Pages(arr);
    }
    if (controlId == "D7_Pages") {
      data.shift();
      data.shift();
      var arr = data.map((v) => {
        return [v[6], v[0], v[2]];
      });
      // console.log(arr);
      if (arr.length > 0) setD7_Pages(arr);
    }
    if (controlId == "IDS_Friends") {
      var ind_Link = data[0].indexOf("x1i10hfl href");
      var ind_Nmae = data[0].indexOf("x193iq5w");
      data.shift();
      var arr = data.map((v) => {
        return [v[ind_Link], v[ind_Nmae]];
      });
      // console.log(arr);
      if (arr.length > 0) setIDS_Friends(arr);
    }
    if (controlId == "IDS_Ads") {
      var ind_Link = data[0].indexOf("x1i10hfl href 2");
      var ind_Nmae = data[0].indexOf("x1i10hfl");
      var ind_Nmae_2 = data[0].indexOf("x8t9es0 8");
      if (ind_Link < 0) ind_Link = data[0].indexOf("xt0psk2 href");
      //xt0psk2 href
      if (ind_Nmae < 0) ind_Nmae = data[0].indexOf("x8t9es0 11");
      // console.log(ind_Link, ind_Nmae);
      data.shift();
      var arr = data.map((v) => {
        return [
          v[ind_Link],
          useRegex(v[ind_Nmae]) ? v[ind_Nmae_2] : v[ind_Nmae],
        ];
      });
      // console.log("arr - -:", arr);
      if (arr.length > 0) setIDS_Ads(arr);
    }
  };

  const useRegex = (input) => {
    let regex = /[0-9]+\s+ads/i;
    // console.log(input.match(regex));
    return input.match(regex);
  };

  const handleClick = async () => {
    var newArr = allData;
    console.log(newArr);

    var headers = [
      "Facebook ID",
      "Facebook Profile link",
      "Name",
      "Label Name",
      "Tags",
      "Email",
    ];

    var dataArray = [];
    var n = Math.ceil(newArr.length / numRows);
    var c = 0;
    for (var i = 0; i < n; i++) {
      dataArray.push([headers, ...newArr.slice(c, c + numRows)]);
      c += numRows;
    }

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
    // console.log(zipFile);

    const url = URL.createObjectURL(zipFile);
    downloadFile(url);
    URL.revokeObjectURL(url);
    console.log("Done ! ");
  };

  function cleanAndMarg() {
    var arr = [];

    arr.push(...ES_Pages);
    arr.push(...IDS_Groups);
    arr.push(...IDS_Pages);
    arr.push(...D7_Pages);
    arr.push(...IDS_Friends);
    arr.push(...IDS_Ads);

    var newArr = [];

    arr.forEach((v) => {
      if (v[0] && !useRegex(v[1])) {
        newArr.push(v);
      }
    });
    // console.log("merged array : ", newArr);
    // console.log(arr);

    newArr.forEach((v, i, arr) => {
      var aa = v[0].replace("?__tn__=%3C", "");
      aa = aa.replace("&__tn__=%3C", "");
      aa = aa.replace(/\/$/, "");
      aa = aa.replace(/\/posts\/.*$/, "");
      aa = aa.replace(/\/app\/.*$/, "");
      aa = aa.replace(/\/Leto\/.*$/, "");
      aa = aa.replace("?ref=mf", "");
      aa = aa.replace("?_fb_noscript=1", "");
      aa = aa.replace(/\?.*$/, "");
      var id_ = "";
      if (aa.toString().indexOf("?id=") !== -1) {
        id_ = aa.substring(aa.lastIndexOf("?id=") + 4);
      } else {
        id_ = aa.substring(aa.lastIndexOf("/") + 1);
      }
      arr[i] = [
        id_,
        "https://www.facebook.com/" + id_,
        v[1].length > 1 ? v[1] : id_,
        cusLabel,
        tages,
        v[2] ? v[2] : "N/A",
      ];
    });
    newArr = removeDuplicatesByColumn(newArr, 0);
    setTotalRows(newArr.length);
    setNumRows(newArr.length);

    setAllData(newArr);
  }

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

    return uniqueArray;
  }

  return (
    <>
      <div className="p-3 d-flex flex-column justify-content-center">
        <div className="form-container">
          <h2 className="text-center">Client CRM List Clean</h2>

          {next === 0 && (
            <>
              <hr className="hr-text" />
              <div className="form-group">
                <label htmlFor="IDS_Groups" className="form-label">
                  ES Pages
                </label>
                <input
                  className="form-control"
                  type="file"
                  id="ES_Pages"
                  accept=".xlsx"
                  onChange={onChange}
                  onClick={() => setLoading(true)}
                />

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

                <label htmlFor="IDS_Friends" className="form-label">
                  IDS Friends
                </label>
                <input
                  className="form-control"
                  type="file"
                  id="IDS_Friends"
                  accept=".xlsx"
                  onChange={onChange}
                  onClick={() => setLoading(true)}
                />
                <label htmlFor="IDS_Ads" className="form-label">
                  IDS Ads
                </label>
                <input
                  className="form-control"
                  type="file"
                  id="IDS_Ads"
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

              {(ES_Pages.length > 0 ||
                IDS_Groups.length > 0 ||
                IDS_Pages.length > 0 ||
                D7_Pages.length > 0 ||
                IDS_Friends.length > 0 ||
                IDS_Ads.length > 0) && (
                <div className="form-group w-100">
                  <div className="form-group w-100">
                    <div className="mt-3">
                      <hr className="hr-text" />
                    </div>
                    <button
                      className="btn btn-light w-50"
                      onClick={() => {
                        setIDS_Groups([]);
                        setIDS_Pages([]);
                        setD7_Pages([]);
                        setIDS_Friends([]);
                        setIDS_Ads([]);
                        setAllData([]);
                        setAllData([]);
                        setCusLabel("L - Leads In");
                        setTages("");
                      }}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className=" btn btn-info w-50"
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
              <hr className="hr-text" />
              <div className="form-group">
                <label htmlFor="fileName" className="form-label">
                  File Name :
                </label>
                <input
                  className="form-control"
                  type="text"
                  id="fileName"
                  placeholder={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
                <label htmlFor="cuslabel" className="form-label">
                  Label Name :
                </label>
                <input
                  className="form-control"
                  type="text"
                  id="cuslabel"
                  placeholder={cusLabel}
                  onChange={(e) => setCusLabel(e.target.value)}
                />
                <label htmlFor="tagName" className="form-label">
                  Tag Name :
                </label>
                <input
                  className="form-control"
                  type="text"
                  id="tagName"
                  placeholder={tages}
                  onChange={(e) => setTages(e.target.value)}
                />
              </div>
              <div className="w-100  d-inline">
                <hr className="hr-text" />
                <div className=" d-flex justify-content-between">
                  <button
                    className="btn btn-light w-50"
                    onClick={() => {
                      setIDS_Groups([]);
                      setIDS_Pages([]);
                      setD7_Pages([]);
                      setIDS_Friends([]);
                      setIDS_Ads([]);
                      setAllData([]);
                      setAllData([]);
                      setCusLabel("L - Leads In");
                      setTages("");
                      setNext((i) => i - 1);
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className=" btn btn-info w-50"
                    onClick={() => {
                      setNext((i) => i + 1);
                      cleanAndMarg();
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}

          {next === 2 && (
            <>
              <button
                className="btn btn-link"
                onClick={() => setNext((i) => i - 1)}
              >
                {"<--Back"}
              </button>
              <hr className="hr-text" />
              <h4 className="text-center">Total Leads</h4>
              <h5 className="text-center">{totalRows}</h5>
              <hr className="hr-text" />
              <div className="form-group">
                <label htmlFor="numRows" className="form-label">
                  Leads per file :
                </label>
                <input
                  className="form-control"
                  min={1}
                  max={totalRows}
                  value={numRows}
                  onChange={(e) => {
                    setNumRows(e.target.value);
                    var arr = [];
                    for (
                      var i = 1;
                      i <= Math.ceil(totalRows / Number(e.target.value));
                      i++
                    ) {
                      var v =
                        arr.length * Number(e.target.value) +
                          Number(e.target.value) >
                        totalRows
                          ? totalRows - arr.length * Number(e.target.value)
                          : Number(e.target.value);
                      arr.push(v);
                    }
                    setArrSplit(arr);
                  }}
                  type="number"
                  id="numRows"
                />
              </div>

              <hr className="hr-text" />
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">File #</th>
                    <th scope="col">Leads</th>
                  </tr>
                </thead>
                <tbody>
                  {arrSplit?.map((num, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{num}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="w-100  d-inline">
                <hr className="hr-text" />
                <div className=" d-flex justify-content-between">
                  <button
                    className="btn btn-light w-50"
                    onClick={() => {
                      setIDS_Groups([]);
                      setIDS_Pages([]);
                      setD7_Pages([]);
                      setIDS_Friends([]);
                      setIDS_Ads([]);
                      setAllData([]);
                      setAllData([]);
                      setCusLabel("L - Leads In");
                      setTages("");
                      setNext((i) => i - 2);
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className=" btn btn-success w-50"
                    onClick={handleClick}
                  >
                    Download File
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
