// ==UserScript==
// @name         Mystic Sorting
// @namespace    bl4ckscor3
// @version      1.0
// @description  Adds sorting functionality to the Mystic portion of EyeWire's Scouts' Log
// @author       bl4ckscor3
// @match        https://eyewire.org/
// @grant        none
// @updateURL    https://raw.githubusercontent.com/bl4ckscor3/MysticSorting/master/mysticsorting.user.js
// @downloadURL  https://raw.githubusercontent.com/bl4ckscor3/MysticSorting/master/mysticsorting.user.js
// @homepageURL  https://github.com/bl4ckscor3/MysticSorting
// ==/UserScript==

/* globals $ account */

(function() {
    'use strict';

    const checkAccount = setInterval(function() {
        if(typeof account === "undefined" || !account.account.uid) {
            return;
        }

        if(!account.can("mystic admin")) {
            clearInterval(checkAccount);
        }
        else if(document.getElementById("slPanel") !== null) {
            clearInterval(checkAccount);
            main();
        }
    }, 100);

    function main() {
        const logObserver = new MutationObserver(addSortingFunctionality);
        const tableObserver = new MutationObserver(prepareTable); //need to observe the table to wait for it to load
        var table = [];

        addButtonStyle();
        logObserver.observe(document.getElementsByClassName("slPanelContent")[0], {
            childList: true,
            attributes: false,
            characterData: false,
            subtree: false
        });

        function addSortingFunctionality(mutations) {
            if(mutations.length === 0) {
                return;
            }

            let addedNodes = mutations[0].addedNodes;

            for(let node of addedNodes) {
                if(node.classList.contains("slOptions")) { //slOptions contains the buttons for "Need Player A", "Player A", "Need Player B", ...
                    tableObserver.observe(getTableBody(), { //wait for the cells to load
                        childList: true,
                        attributes: false,
                        characterData: false,
                        subtree: false
                    });
                    return;
                }
            }
        }

        function prepareTable(mutations) {
            let rows = getTableBody().children;
            let aCells = 0;
            let bCells = 0;

            tableObserver.disconnect(); //no longer need to observe
            table = [];

            for(let row of rows) {
                let firstColumnText = row.children[0].innerText.split(" (");
                let playerA = row.children[2].innerText;
                let playerB = row.children[3].innerText;

                //a player can't be A and B for the same cell
                if(playerA === account.account.username) {
                    aCells++;
                }
                else if(playerB === account.account.username) {
                    bCells++;
                }

                table.push({
                    domElement: row,
                    cellName: firstColumnText[0],
                    cellId: firstColumnText[1].split(")")[0],
                    status: row.children[1].innerText,
                    playerA: playerA,
                    playerB: playerB,
                    timestamp: Date.parse(row.children[4].innerText)
                });
            }

            addCellAmountInfo(aCells, bCells);
            addSortingButtons();
        }

        function addCellAmountInfo(aCells, bCells) {
            let th = document.querySelector("#sl-main-table > table > thead > tr").children;

            if(aCells > 0) {
                th[2].innerText += ` (Yours: ${aCells})`;
            }
            
            if(bCells > 0) {
                th[3].innerText += ` (Yours: ${bCells})`;
            }
        }

        function addSortingButtons() {
            let th = document.querySelector("#sl-main-table > table > thead > tr").children;
            //"data-sort-direction" holds the current sort order. in order to sort normally first, this needs to be set to "reverse" by default
            let buttonCellId = createButton("Sort by Cell ID", "reverse");
            let buttonStatus = createButton("Sort by Status", "reverse");
            let buttonPlayerA = createButton("Sort by Player A", "reverse");
            let buttonPlayerB = createButton("Sort by Player B", "reverse");
            let buttonTimestamp = createButton("Sort by Time", "reverse");
            //the default is, that cells are sorted by name. as such, the first click of the sort button should reverse the sorting order
            let buttonCellName = createButton("Sort by Cell Name", "normal");

            $(buttonCellId).prependTo(th[0]).click(() => sortAndReplace(sortByCellId, switchSortDir(buttonCellId)));
            $(buttonCellName).prependTo(th[0]).click(() => sortAndReplace(sortByCellName, switchSortDir(buttonCellName)));
            $(buttonStatus).prependTo(th[1]).click(() => sortAndReplace(sortByStatus, switchSortDir(buttonStatus)));
            $(buttonPlayerA).prependTo(th[2]).click(() => sortAndReplace(sortByPlayerA, switchSortDir(buttonPlayerA)));
            $(buttonPlayerB).prependTo(th[3]).click(() => sortAndReplace(sortByPlayerB, switchSortDir(buttonPlayerB)));
            $(buttonTimestamp).prependTo(th[4]).click(() => sortAndReplace(sortByTimestamp, switchSortDir(buttonTimestamp)));
            
            function createButton(title, defaultOrder) {
                let button = document.createElement("input");

                button.type = "button";
                button.title = title;
                button.classList.add("mysticSortButton");
                button.setAttribute("data-sort-direction", defaultOrder);
                return button;
            }

            function switchSortDir(button) {
                if(button.getAttribute("data-sort-direction") === "reverse") {
                    button.setAttribute("data-sort-direction", "normal");
                    return false;
                }
                else {
                    button.setAttribute("data-sort-direction", "reverse");
                    return true;
                }
            }
        }

        function addButtonStyle() {
            let theStyle = document.createElement("style");

            theStyle.id = "mysticSortButtonStyle";
            theStyle.innerHTML = ".mysticSortButton { border-width: 0px; width: 11px; height: 11px; margin-right: 5px; cursor: pointer; outline: none; }";
            theStyle.innerHTML += '.mysticSortButton[data-sort-direction=normal] { background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABRSURBVChTY/z//z8DsYAJSlMfMHp5+RDtDpAzGCFMvOD/tm1bGMEKgaaDBUAEFgBSCPYb3FQcGuAKQQDFCWgaUBRiBSANQPwPykUBtIoUBgYAr4QcxTCXiOcAAAAASUVORK5CYII=") no-repeat; }'
            theStyle.innerHTML += '.mysticSortButton[data-sort-direction=reverse] { background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABESURBVChTY/z//z8DsYAJShMFsCr29vbFah2GYphCbBpQFKMrQOfDFeOyGlkcrBiXQhiAyTN6efngVYgM6BzO2AEDAwBazBjfk+e3QgAAAABJRU5ErkJggg==") no-repeat; }'
            document.head.appendChild(theStyle);
        }

        function sortAndReplace(sortingFunction, reverseSort) {
            let tableBody = $(getTableBody());

            if(reverseSort) {
                table.sort((x, y) => reverse(sortingFunction(x, y)));
            }
            else {
                table.sort(sortingFunction);
            }
            
            tableBody.empty(); //remove previous table entries

            for(let i = 0; i < table.length; i++) { //add sorted table entries
                tableBody.append(table[i].domElement);
            }
        }

        function sortByCellName(x, y) {
            return stringCompare(x.cellName, y.cellName);
        }

        function sortByCellId(x, y) {
            return numberCompare(x.cellId, y.cellId);
        }

        function sortByStatus(x, y) {
            return stringCompare(x.status, y.status);
        }

        function sortByPlayerA(x, y) {
            return stringCompare(x.playerA, y.playerA);
        }

        function sortByPlayerB(x, y) {
            return stringCompare(x.playerB, y.playerB);
        }

        function sortByTimestamp(x, y) {
            return numberCompare(x.timestamp, y.timestamp);
        }

        function stringCompare(x, y) {
            //need to use these, as otherwise lowercased names would be sorted seperately from uppercased names
            let lowerX = x.toLowerCase();
            let lowerY = y.toLowerCase();

            if(lowerX < lowerY) {
                return -1;
            }
            else if(lowerX > lowerY) {
                return 1;
            }
            else {
                return 0;
            }
        }

        function numberCompare(x, y) {
            return y - x;
        }

        function reverse(relation) {
            return relation * -1;
        }

        function getTableBody() {
            return document.querySelector("#sl-main-table > table > tbody");
        }
    }
})();