/* 
 * Live leaderboard script for the "Bingo Lockout" Arknights tournament run by Lungmen Dragons
 * Pulls submission data directly from Google Sheets
 * 
 */

const GSCRIPT = CONFIG.GSCRIPT;
// const GSCRIPT = CONFIG.;// + '?col=' + 3;
const VAL = {
  // bootstrap class name
  QF_ROW: "table-primary",
  
  // number of people who can qualify
  QF_NUM: 4, // just to demonstrate
  QF_NUM_COL: 1, // just to demonstrate

  // number of qualifying categories/columns
  QF_CTGS: 4,
  
  // hex codes for columns
  COL_1: "#2674eb",
  COL_2: "#1cd41f",
  COL_3: "#ffea00",
  COL_4: "#db1414"
}

// init, only assigned when fetch response received
var ranked; 

window.onload = (event) => {
  fetch(GSCRIPT)
  .then((response) => response.json())
  .then((data) => {
    // console.log(data);
    ranked = assignRanks(data);
    document.getElementById("table-spinner").style.display = "none";
    
    // make table with no filters applied
    makeTable(0b1111);

    document.querySelectorAll(".btn-filter").forEach((radio) => radio.addEventListener("click", 
      (radio) => radio.checked = !radio.checked));
    document.getElementById("apply-filter").addEventListener("click", filterCols);
  });
}

function filterCols() {
  let filters = 0;
  document.querySelectorAll(".btn-filter").forEach((filter) => {
    if (filter.checked) filters += 2 ** filter.value;
  });

  // if no filters selected, show all
  if (!filters) filters = 2 ** VAL.QF_CTGS - 1;

  makeTable(filters);
}

function assignRanks(object) {
  let partitioned = new Array();
  for (let i = 0; i < VAL.QF_CTGS; i++)
    partitioned.push([]);
  
  object.data.sort(sortRankAll);
  object.data.forEach((entry, index) => {
    entry.rankAll = index + 1;
    partitioned[entry.columnInt - 1].push(entry);
  });
  
  partitioned.forEach((column) => {
    // already sorted, can just assign ranks in order
    column.forEach((entry, index) => entry.rankCol = index + 1);
  })
  
  return partitioned.flat();
}

function makeTable(filters) {
  let tbodyCurrent = document.querySelector(".qf-body");
  let tbodyNew = document.createElement("tbody");
  tbodyNew.className = "qf-body";
  
  // filters using each bit of the binary representation of 2**(number of columns)
  let filtered = ranked.filter((entry) => 2 ** (entry.columnInt - 1) & filters);
  filtered.sort(sortRankAll);

  for (let i = 0; i < filtered.length; i++) {
    let entry = filtered[i];
    let row = tbodyNew.insertRow();
    if (entry.rankCol <= VAL.QF_NUM_COL) row.className = VAL.QF_ROW;
    makeCell(row, isQualify(entry.rankCol));
    makeCell(row, entry.rankAll);
    makeCell(row, entry.player);
    makeCell(row, entry.columnInt);
    makeCell(row, entry.timeString);
  }

  tbodyCurrent.parentNode.replaceChild(tbodyNew, tbodyCurrent);
}

function sortRankAll(a,b) {
  return a.timeSecsInt - b.timeSecsInt;
}

function makeCell(row, text) {
  let cell = row.insertCell();
  let content = document.createTextNode(text);
  cell.appendChild(content);
}

function isQualify(rank) {
  return rank <= VAL.QF_NUM_COL ? "Qualify" : "";
}