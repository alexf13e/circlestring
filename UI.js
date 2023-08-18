
let cnvMain, ctxMain;

let inpStringColour, inpAutoEditWrap;
let slShiftMode;
let inpNumPegs;
let btnRequestReset, btnSaveBoard, btnLoadBoard;

let dvStringChainList;
let editingListItem = null;

let dvPopupBackground;
let dvSavePopup, btnCopyToClipboard, aSaveAsFile, btnCloseSavePopup;
let dvLoadPopup, inpLoadFile, taLoad, btnLoad, btnCloseLoadPopup;
let dvConfirmResetPopup, btnResetBoard, btnCloseResetPopup;


function initUI()
{
    cnvMain = document.getElementById("cnvMain");
    ctxMain = cnvMain.getContext("2d");
    cnvMain.width = IMG_WIDTH;
    cnvMain.height = IMG_HEIGHT;
    ctxMain.translate(centreOffset.x, centreOffset.y);
    setStringStyle(currentColour, stringOpacity);

    inpStringColour = document.getElementById("inpStringColour");
    inpStringColour.value = "#000000";
    inpStringColour.addEventListener("change", () => {
        currentColour = colourInputToRGB(inpStringColour.value);
    });

    inpAutoEditWrap = document.getElementById("inpAutoEditWrap");
    inpAutoEditWrap.addEventListener("change", () => {
        setLocalStorage("autoEditWrap", inpAutoEditWrap.checked);
    });
    let aew = getLocalStorage("autoEditWrap");
    if (aew != null) inpAutoEditWrap.checked = aew;

    slShiftMode = document.getElementById("slShiftMode");
    slShiftMode.addEventListener("change", () => {
        setLocalStorage("shiftMode", slShiftMode.value);
    });
    let sm = getLocalStorage("shiftMode");
    if (sm != null) slShiftMode.value = sm;

    inpNumPegs = document.getElementById("inpNumPegs");
    inpNumPegs.addEventListener("change", () => {
        if (parseInt(inpNumPegs.value) < parseInt(inpNumPegs.min) || inpNumPegs.value == "") inpNumPegs.value = inpNumPegs.min;
        if (parseInt(inpNumPegs.value) > parseInt(inpNumPegs.max)) inpNumPegs.value = inpNumPegs.max;
    });
    inpNumPegs.value = 64;


    btnSaveBoard = document.getElementById("btnSaveBoard");
    btnSaveBoard.addEventListener("click", showSavePopup);
    

    btnLoadBoard = document.getElementById("btnLoadBoard");
    btnLoadBoard.addEventListener("click", showLoadPopup);

    dvStringChainList = document.getElementById("dvStringChainList");


    dvPopupBackground = document.getElementById("dvPopupBackground");
    dvPopupBackground.addEventListener("click", (e) => {
        hidePopups();
    });

    dvSavePopup = document.getElementById("dvSavePopup");
    dvSavePopup.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    btnCopyToClipboard = document.getElementById("btnCopyToClipboard");
    btnCopyToClipboard.addEventListener("click", () => {
        let data = board.getSaveData();
        navigator.clipboard.writeText(data);
        btnCopyToClipboard.textContent = "Copied";
    });

    aSaveAsFile = document.getElementById("aSaveAsFile");

    btnCloseSavePopup = document.getElementById("btnCloseSavePopup");
    btnCloseSavePopup.addEventListener("click", hidePopups);


    dvLoadPopup = document.getElementById("dvLoadPopup");
    dvLoadPopup.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    inpLoadFile = document.getElementById("inpLoadFile");
    inpLoadFile.addEventListener("change", () => {
        //https://stackoverflow.com/questions/750032/reading-file-contents-on-the-client-side-in-javascript-in-various-browsers
        const file = inpLoadFile.files[0];
        if (file)
        {
            let reader = new FileReader();
            reader.onload = (e) => taLoad.value = e.target.result;
            reader.onerror = () => taLoad.value = "Error reading file...";
            reader.readAsText(file, "UTF-8");
        }
    });

    taLoad = document.getElementById("taLoad");
    taLoad.addEventListener("input", () => {
        if (taLoad.value.length > 0) taLoad.style.whiteSpace = "pre";
        else taLoad.style.whiteSpace = "normal";
    });

    btnCloseLoadPopup = document.getElementById("btnCloseLoadPopup");
    btnCloseLoadPopup.addEventListener("click", hidePopups);

    btnLoad = document.getElementById("btnLoad");
    btnLoad.addEventListener("click", () => {
        //text area not blank, ignore file
        let data = taLoad.value;
        if (data == "") return;

        let result = board.loadFromSave(data);

        if (!result.succeeded)
        {
            alert(result.error);
        }
        else
        {
            dvStringChainList.replaceChildren();

            for (let sc of board.stringChains)
            {
                addStringChainDiv(sc);
            }

            requestDraw = true;
            hidePopups();
        }
    });

    dvConfirmResetPopup = document.getElementById("dvConfirmResetPopup");
    dvConfirmResetPopup.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    btnRequestReset = document.getElementById("btnRequestReset");
    btnRequestReset.addEventListener("click", () => {
        showResetPopup();
    });

    btnResetBoard = document.getElementById("btnResetBoard");
    btnResetBoard.addEventListener("click", () => {
        board.reset(parseInt(inpNumPegs.value));
        dvStringChainList.replaceChildren();
        hidePopups();
        requestDraw = true;
    });

    btnCloseResetPopup = document.getElementById("btnCloseResetPopup");
    btnCloseResetPopup.addEventListener("click", hidePopups);
}

function addStringChainDiv(stringChain)
{
    let dvContainer = document.createElement("div");
    let inpColour = document.createElement("input");
    let btnEdit = document.createElement("button");
    let btnDelete = document.createElement("button");

    dvContainer.classList.add("stringListContainer");
    
    let colour = stringChain.colour.split(",");
    inpColour.type = "color";
    inpColour.value = "#" + parseInt(colour[0]).toString(16).padStart(2, "0") + parseInt(colour[1]).toString(16).padStart(2, "0") + parseInt(colour[2]).toString(16).padStart(2, "0");
    
    btnEdit.classList.add("stringButton");
    btnEdit.classList.add("stringButtonEdit")
    btnDelete.classList.add("stringButton");
    btnDelete.classList.add("stringButtonDelete");

    dvContainer.stringChain = stringChain;

    inpColour.addEventListener("change", (e) => {
        e.currentTarget.parentElement.stringChain.colour = colourInputToRGB(e.currentTarget.value);
        requestDraw = true;
    });

    btnEdit.addEventListener("click", (e) => {
        board.setCurrentStringChain(e.currentTarget.parentElement.stringChain);
        stringActive = true;
        editing = true;
        editingListItem = e.currentTarget.parentElement;
        if (inpAutoEditWrap.checked) enableWrap = false;
        btnEdit.blur();
        disableUI();
    });

    btnDelete.addEventListener("click", (e) => {
        board.deleteStringChain(e.currentTarget.parentElement.stringChain);
        dvStringChainList.removeChild(e.currentTarget.parentElement);
        requestDraw = true;
    });

    dvContainer.appendChild(inpColour);
    dvContainer.appendChild(btnEdit);
    dvContainer.appendChild(btnDelete);

    dvStringChainList.appendChild(dvContainer);
}

function enableUI()
{
    inpStringColour.disabled = false;
    btnRequestReset.disabled = false;
    btnSaveBoard.disabled = false;
    btnLoadBoard.disabled = false;

    for (let container of dvStringChainList.children)
    {
        let inpColour = container.children[0]
        let btnEdit = container.children[1];
        let btnDelete = container.children[2];

        inpColour.disabled = false;
        btnEdit.disabled = false;
        btnDelete.disabled = false;
    }
}

function disableUI()
{
    inpStringColour.disabled = true;
    btnRequestReset.disabled = true;
    btnSaveBoard.disabled = true;
    btnLoadBoard.disabled = true;

    for (let container of dvStringChainList.children)
    {
        let inpColour = container.children[0]
        let btnEdit = container.children[1];
        let btnDelete = container.children[2];

        inpColour.disabled = true;
        btnEdit.disabled = true;
        btnDelete.disabled = true;
    }
}

function colourInputToRGB(value)
{
    let r = value.slice(1, 3);
    let g = value.slice(3, 5);
    let b = value.slice(5, 7);

    r = parseInt(r, 16);
    g = parseInt(g, 16);
    b = parseInt(b, 16);

    return "" + r + ", " + g + ", " + b;
}

function showSavePopup()
{
    dvPopupBackground.style.display = "block";
    dvSavePopup.style.display = "grid";
    btnCopyToClipboard.textContent = "Copy to Clipboard";

    let data = new Blob([board.getSaveData()], {type: "application/json"});
    aSaveAsFile.href = window.URL.createObjectURL(data);
}

function showLoadPopup()
{
    dvPopupBackground.style.display = "block";
    dvLoadPopup.style.display = "grid";
}

function showResetPopup()
{
    dvPopupBackground.style.display = "block";
    dvConfirmResetPopup.style.display = "grid";
}

function hidePopups()
{
    dvPopupBackground.style.display = "none";
    dvSavePopup.style.display = "none";
    dvLoadPopup.style.display = "none";
    dvConfirmResetPopup.style.display = "none";
}