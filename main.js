
const TWO_PI = 2 * Math.PI;
const IMG_WIDTH = 1024;
const IMG_HEIGHT = 1024;

const stringOpacity = "0.7";
const stringOpacityNoWrap = "0.2";

let cnvMain, ctxMain;
let inpStringColour, inpAutoEditWrap;
let slShiftMode;
let dvStringChainList, dvUI;

let centreOffset;
let pegRadius = 2;
let radius = IMG_WIDTH / 2.5 - pegRadius - 1;
let numPegs = 64;
let stringChains = [];
let currentStringChainIndex = 0;
let currentColour = "0, 0, 0";
let currentOpacity = stringOpacity;

window.addEventListener("load", init);

function init()
{
    centreOffset = { x: IMG_WIDTH / 2, y: IMG_HEIGHT / 2 };

    cnvMain = document.getElementById("cnvMain");
    ctxMain = cnvMain.getContext("2d");
    cnvMain.width = IMG_WIDTH;
    cnvMain.height = IMG_HEIGHT;

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


    dvStringChainList = document.getElementById("dvStringChainList");
    dvUI = document.getElementById("dvUI");
    
    setStringStyle(currentColour, stringOpacity);
    ctxMain.translate(centreOffset.x, centreOffset.y);

    currentMousePos = { x: 0, y: 0 };
    prevMousePos = currentMousePos;

    draw();
}

function setStringStyle(colour, opacity)
{
    ctxMain.strokeStyle = "rgba(" + colour + ", " + opacity + ")";
}

function draw()
{
    ctxMain.clearRect(-centreOffset.x, -centreOffset.y, IMG_WIDTH, IMG_HEIGHT);
    ctxMain.strokeStyle = "black";

    //draw pegs
    for (let i = 0; i < numPegs; i++)
    {
        let pos = getPegPos(i);

        ctxMain.beginPath();
        ctxMain.arc(pos.x, pos.y, pegRadius, 0, TWO_PI);
        ctxMain.fill();
        ctxMain.stroke();
    }

    //draw strings
    for (let sc of stringChains)
    {
        sc.draw(ctxMain);
    }

    //draw current string to mouse
    if (stringActive)
    {
        let p = getPegPos(stringChains[currentStringChainIndex].getLastPegIndex());
        ctxMain.beginPath();
        ctxMain.moveTo(p.x, p.y);
        ctxMain.lineTo(currentMousePos.x, currentMousePos.y);

        if (editing) setStringStyle(stringChains[currentStringChainIndex].colour, (enableWrap ? stringOpacity : stringOpacityNoWrap));
        else setStringStyle(currentColour, (enableWrap ? stringOpacity : stringOpacityNoWrap));
        ctxMain.stroke();
    }
}

function getPegPos(index)
{
    let theta = index / numPegs * TWO_PI;
    let x = radius * Math.cos(theta);
    let y = radius * Math.sin(theta);

    return { x: x, y: y };
}

function addStringChainDiv(stringChain)
{
    let dvContainer = document.createElement("div");
    let inpColour = document.createElement("input");
    let btnEdit = document.createElement("button");
    let btnDelete = document.createElement("button");

    dvContainer.classList.add("stringListContainer");
    
    let colour = stringChains[currentStringChainIndex].colour.split(",");
    inpColour.type = "color";
    inpColour.value = "#" + parseInt(colour[0]).toString(16) + parseInt(colour[1]).toString(16) + parseInt(colour[2]).toString(16);
    
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
        currentStringChainIndex = stringChains.indexOf(e.currentTarget.parentElement.stringChain);
        stringActive = true;
        editing = true;
        if (inpAutoEditWrap.checked) enableWrap = false;
        btnEdit.blur();
        disableUI();
    });

    btnDelete.addEventListener("click", (e) => {
        let index = stringChains.indexOf(e.currentTarget.parentElement.stringChain);
        stringChains.splice(index, 1);
        currentStringChainIndex = stringChains.length;

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

function getLocalStorage(name)
{
    let ls = localStorage.getItem("circleString");
    if (ls === null) return null;
    else ls = JSON.parse(ls);
    
    let value = ls[name];
    if (value === undefined) return null;
    else return value;
}

function setLocalStorage(name, value)
{
    let ls = localStorage.getItem("circleString");
    if (ls === null) ls = {};
    else ls = JSON.parse(ls);

    ls[name] = value;

    localStorage.setItem("circleString", JSON.stringify(ls));
}