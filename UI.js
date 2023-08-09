
let cnvMain, ctxMain;

let inpStringColour, inpAutoEditWrap;
let slShiftMode;
let inpNumPegs;
let btnResetBoard, btnSaveBoard, btnLoadBoard;

let dvStringChainList;

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
        if (parseInt(inpNumPegs.value) < parseInt(inpNumPegs.min)) inpNumPegs.value = inpNumPegs.min;
        if (parseInt(inpNumPegs.value) > parseInt(inpNumPegs.max)) inpNumPegs.value = inpNumPegs.max;
    });

    btnResetBoard = document.getElementById("btnResetBoard");
    btnResetBoard.addEventListener("click", () => {
        board.reset(inpNumPegs.value);
        dvStringChainList.replaceChildren();
        draw();
    });

    btnSaveBoard = document.getElementById("btnSaveBoard");
    

    btnLoadBoard = document.getElementById("btnLoadBoard");


    dvStringChainList = document.getElementById("dvStringChainList");
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
        draw();
    });

    btnEdit.addEventListener("click", (e) => {
        board.setCurrentStringChain(e.currentTarget.parentElement.stringChain);
        stringActive = true;
        editing = true;
        if (inpAutoEditWrap.checked) enableWrap = false;
        btnEdit.blur();
        disableUI();
    });

    btnDelete.addEventListener("click", (e) => {
        board.deleteStringChain(e.currentTarget.parentElement.stringChain);
        dvStringChainList.removeChild(e.currentTarget.parentElement);
        draw();
    });

    dvContainer.appendChild(inpColour);
    dvContainer.appendChild(btnEdit);
    dvContainer.appendChild(btnDelete);

    dvStringChainList.appendChild(dvContainer);
}

function enableUI()
{
    inpStringColour.disabled = false;
    btnResetBoard.disabled = false;
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
    btnResetBoard.disabled = true;
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