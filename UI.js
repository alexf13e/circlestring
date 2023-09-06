
let cnvMain, ctxMain;
let canvasRes;
let canvasCentreOffset;

let inpStringColour, slDrawMode;

let dvPatternSettings;
let inpPatternInterval, inpPatternCount, slPatternDirection;

let inpAutoEditWrap;
let inpCanvasResolution, inpBoardPegRadius;
let btnApplyVisualSettings;

let inpNumPegs, slShiftMode, inpWarnOnPageLeave;

let btnSaveBoard, btnLoadBoard, btnRequestReset;

let dvStringChainList;
let editingListItem = null;

let dvPopupBackground;
let dvSavePopup, btnCopyToClipboard, aSaveAsFile, btnCloseSavePopup;
let dvLoadPopup, inpLoadFile, taLoad, btnLoad, btnCloseLoadPopup;
let dvConfirmResetPopup, btnResetBoard, btnCloseResetPopup;

const DEFAULT_NUMPEGS = 64;
const DEFAULT_CANVASRES = 1024;
const DEFAULT_PEGRADIUS = 3;


function initUI()
{
    inpStringColour = document.getElementById("inpStringColour");
    inpStringColour.value = "#000000";
    inpStringColour.addEventListener("change", () => {
        currentColour = colourInputToRGB(inpStringColour.value);
    });

    slDrawMode = document.getElementById("slDrawMode");
    slDrawMode.value = "Manual";
    slDrawMode.addEventListener("change", () => {
        if (slDrawMode.value == "Manual")
        {
            dvPatternSettings.style.display = "none";
        }
        else
        {
            dvPatternSettings.style.display = "grid";
        }
    });

    dvPatternSettings = document.getElementById("dvPatternSettings");

    inpPatternInterval = document.getElementById("inpPatternInterval");
    inpPatternInterval.addEventListener("change", () => {
        constrainNumberInput(inpPatternInterval);
    });
    inpPatternInterval.max = DEFAULT_NUMPEGS - 1;
    inpPatternInterval.value = 1;

    inpPatternCount = document.getElementById("inpPatternCount");
    inpPatternCount.addEventListener("change", () => {
        constrainNumberInput(inpPatternCount);
        if (inpPatternCount.value == 0) inpPatternCount.value = "";
    });
    inpPatternCount.max = DEFAULT_NUMPEGS;

    slPatternDirection = document.getElementById("slPatternDirection");


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
        constrainNumberInput(inpNumPegs);
    });
    inpNumPegs.value = DEFAULT_NUMPEGS;


    inpCanvasResolution = document.getElementById("inpCanvasResolution");
    inpCanvasResolution.addEventListener("change", () => {
        constrainNumberInput(inpCanvasResolution);
    });
    inpCanvasResolution.value = DEFAULT_CANVASRES;
    canvasRes = DEFAULT_CANVASRES;

    inpBoardPegRadius = document.getElementById("inpBoardPegRadius");
    inpBoardPegRadius.addEventListener("change", () => {
        constrainNumberInput(inpBoardPegRadius);
    });
    inpBoardPegRadius.value = DEFAULT_PEGRADIUS;

    btnApplyVisualSettings = document.getElementById("btnApplyVisualSettings");
    btnApplyVisualSettings.addEventListener("click", () => {
        //if no changes, no point in reapplying them
        if (inpCanvasResolution.value == canvasRes && board.pegRadius == inpBoardPegRadius.value) return;

        canvasRes = parseInt(inpCanvasResolution.value);
        let numPegs = board.numPegs; //cant change numpegs here, requires reset, so keep same as before
        let pegRadius = parseInt(inpBoardPegRadius.value);

        cnvMain.width = canvasRes;
        cnvMain.height = canvasRes;
        canvasCentreOffset.x = canvasRes / 2;
        canvasCentreOffset.y = canvasRes / 2;
        ctxMain.translate(canvasCentreOffset.x, canvasCentreOffset.y);
        
        //need to recalculate tangent points for new board settings, easiest to save and reload the board
        let boardData = board.getSaveData();
        board = new StringBoard(canvasRes / 2.5, numPegs, pegRadius);
        board.loadFromSave(boardData);

        dvStringChainList.replaceChildren();

        for (let sc of board.stringChains)
        {
            addStringChainDiv(sc);
        }

        requestDraw = true;
    });

    inpWarnOnPageLeave = document.getElementById("inpWarnOnPageLeave");
    let wopl = getLocalStorage("warnOnPageLeave");
    if (wopl != null) inpWarnOnPageLeave.checked = wopl;
    inpWarnOnPageLeave.addEventListener("change", () => {
        setLocalStorage("warnOnPageLeave", inpWarnOnPageLeave.checked);
    });

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

        inpPatternInterval.max = board.numPegs - 1;
        inpPatternCount.max = board.numPegs;
        constrainNumberInput(inpPatternInterval);
        constrainNumberInput(inpPatternCount);
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
        inpPatternInterval.max = board.numPegs - 1;
        inpPatternCount.max = board.numPegs;
        constrainNumberInput(inpPatternInterval);
        constrainNumberInput(inpPatternCount);
    });

    btnCloseResetPopup = document.getElementById("btnCloseResetPopup");
    btnCloseResetPopup.addEventListener("click", hidePopups);

    cnvMain = document.getElementById("cnvMain");
    ctxMain = cnvMain.getContext("2d");
    cnvMain.width = canvasRes;
    cnvMain.height = canvasRes;
    canvasCentreOffset = new Vec2(canvasRes / 2, canvasRes / 2);
    ctxMain.translate(canvasCentreOffset.x, canvasCentreOffset.y);
    setStringStyle(currentColour, stringOpacity);
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
        board.updatePreRender(cnvMain, ctxMain);
        stringActive = true;
        editing = true;
        editingListItem = e.currentTarget.parentElement;
        if (inpAutoEditWrap.checked) enableWrap = false;
        btnEdit.blur();
        slDrawMode.value = "Manual";
        dvPatternSettings.style.display = "none";
        requestDraw = true;
        disableUI();
    });

    btnDelete.addEventListener("click", (e) => {
        board.deleteStringChain(e.currentTarget.parentElement.stringChain);
        board.updatePreRender(cnvMain, ctxMain);
        dvStringChainList.removeChild(e.currentTarget.parentElement);
        requestDraw = true;
    });

    dvContainer.appendChild(inpColour);
    dvContainer.appendChild(btnEdit);
    dvContainer.appendChild(btnDelete);

    dvStringChainList.appendChild(dvContainer);
}

function constrainNumberInput(element)
{
    if (parseInt(element.value) < parseInt(element.min) || element.value == "") element.value = element.min;
    if (parseInt(element.value) > parseInt(element.max)) element.value = element.max;
}

function enableUI()
{
    inpStringColour.disabled = false;
    slDrawMode.disabled = false;
    btnApplyVisualSettings.disabled = false;
    btnSaveBoard.disabled = false;
    btnLoadBoard.disabled = false;
    btnRequestReset.disabled = false;
    
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
    slDrawMode.disabled = true;
    btnApplyVisualSettings.disabled = true;
    btnSaveBoard.disabled = true;
    btnLoadBoard.disabled = true;
    btnRequestReset.disabled = true;
    
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