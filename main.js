
const TWO_PI = 2 * Math.PI;
const IMG_WIDTH = 1024;
const IMG_HEIGHT = 1024;

const stringOpacity = "0.7";
const stringOpacityNoWrap = "0.2";

let centreOffset;
let currentColour = "0, 0, 0";
let currentOpacity = stringOpacity;

let board;

window.addEventListener("load", init);

function init()
{
    centreOffset = { x: IMG_WIDTH / 2, y: IMG_HEIGHT / 2 };
    currentMousePos = { x: 0, y: 0 };
    prevMousePos = currentMousePos;

    board = new StringBoard(IMG_WIDTH / 2.5, 64, 2);
    
    initUI();

    draw();
}

function draw()
{
    ctxMain.clearRect(-centreOffset.x, -centreOffset.y, IMG_WIDTH, IMG_HEIGHT);

    //draw board's pegs and strings
    board.draw(ctxMain);

    //draw current string to mouse
    if (stringActive)
    {
        let csc = board.getCurrentStringChain();
        let p = board.getPegPos(csc.getLastPegIndex());
        ctxMain.beginPath();
        ctxMain.moveTo(p.x, p.y);
        ctxMain.lineTo(currentMousePos.x, currentMousePos.y);

        if (editing) setStringStyle(csc.colour, (enableWrap ? stringOpacity : stringOpacityNoWrap));
        else setStringStyle(currentColour, (enableWrap ? stringOpacity : stringOpacityNoWrap));
        ctxMain.stroke();
    }
}

function setStringStyle(colour, opacity)
{
    ctxMain.strokeStyle = "rgba(" + colour + ", " + opacity + ")";
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