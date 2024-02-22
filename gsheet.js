/* 
 * Live leaderboard script for the "Bingo Lockout" Arknights tournament run by Lungmen Dragons
 * Pulls submission data directly from Google Sheets
 * 
 */

const GSCRIPT = "https://script.google.com/macros/s/AKfycby45GcsM7KFs1Ihe-wBZcJCxpkE2kyoTiq4jJz6HWnCKBrfv5taJGZzkiA7PPEN26Ys/exec";
const VAL = {
  // refresh interval
  REFRESH: 60,

  // bootstrap class names
  BTN_TYPE: "btn-outline-primary",
  QF_ROW: "table-primary",
  
  // number of people who can qualify per category/column
  QF_NUM: 3,
  // number of qualifying categories/columns
  QF_CTGS: 8,
  
  // hex codes for columns
  COL_1: "#2674eb",
  COL_2: "#1cd41f",
  COL_3: "#ffea00",
  COL_4: "#db1414"
}

// init, only assigned when fetch response received
var ranked; 
var initDone = false;

window.onload = (event) => getData();

function getData() {
  document.getElementById("table-spinner").style.display = "flex";
  fetch(GSCRIPT)
  .then((response) => response.json())
  .then((data) => {
    // console.log(data);
    timer = document.getElementById("refresh");
    if (!initDone) {
      refreshTimer(VAL.REFRESH, timer);
      makeRadios();
    }
    ranked = assignRanks(data);
    document.getElementById("table-spinner").style.display = "none";
    
    // make table with no filters applied
    makeTable(2 ** VAL.QF_CTGS - 1);
    

    document.querySelectorAll(".btn-filter").forEach((radio) => radio.addEventListener("click", 
      (radio) => radio.checked = !radio.checked));
    document.getElementById("apply-filter").addEventListener("click", filterCols);
    initDone = true;
  });
}

function refreshTimer(duration, timer) {
  let cd = duration;
  setInterval(function () {
    timer.textContent = cd;
    if (--cd < 0) {
      cd = duration;
      getData();
    }
  }, 1000);
}

function makeRadios() {
  let btngroupNew = document.createElement("div");
  btngroupNew.className = "btn-group mx-3";
  btngroupNew.id = "filter-col-group";
  btngroupNew.setAttribute("role", "group");

  let btngroup = document.getElementById("filter-col-group");
  for (let i = 0; i < VAL.QF_CTGS; i++) {
    let input = document.createElement("input");
    input.type = "checkbox";
    input.className = "btn-check btn-filter";
    input.id = `filter-col${i}`;
    input.value = i;
    input.setAttribute("autocomplete", "off");
    btngroupNew.appendChild(input);

    let label = document.createElement("label");
    label.className = `btn ${VAL.BTN_TYPE}`;
    label.setAttribute("for", `filter-col${i}`);
    label.textContent = i+1;
    btngroupNew.appendChild(label);
  }

  btngroup.parentNode.replaceChild(btngroupNew, btngroup);
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
    if (entry.rankCol <= VAL.QF_NUM) row.className = VAL.QF_ROW;

    let qual = "", badge = false;
    if (isQualify(entry.rankCol)) {
      qual = "Qualify";
      badge = true; //`<span class="badge rounded-pill bg-primary">${entry.column} Qualifier</span>`;
    }

    makeCell(row, qual);
    makeCell(row, entry.rankAll);
    makeCell(row, entry.player, badge, entry);
    makeCell(row, entry.columnInt);
    makeCell(row, entry.timeString);
  }

  tbodyCurrent.parentNode.replaceChild(tbodyNew, tbodyCurrent);
}

function sortRankAll(a,b) {
  return a.timeSecsInt - b.timeSecsInt;
}

function makeCell(row, text, badge = false, entry = undefined) {
  let cell = row.insertCell();
  let content = document.createTextNode(text);
  cell.appendChild(content);

  if (badge) {
    let span = document.createElement("span");
    span.className = "badge bg-primary mx-3";
    cell.appendChild(span);
    let badgeText = document.createTextNode(`${entry.column} Qualifier`);
    span.appendChild(badgeText);
  }
}

function isQualify(rank) {
  return rank <= VAL.QF_NUM;
}