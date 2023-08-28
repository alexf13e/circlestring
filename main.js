
const TWO_PI = 2 * Math.PI;

const stringOpacity = "0.7";
const stringOpacityNoWrap = "0.2";

let currentColour;
let currentOpacity;

let board;
let requestDraw;

window.addEventListener("load", init);
window.addEventListener('beforeunload', (e) => {
    //warn user on leaving page if the board has been drawn on
    //https://stackoverflow.com/questions/3221161/how-to-pop-up-an-alert-box-when-the-browsers-refresh-button-is-clicked
    if (board.stringChains.length > 0)
    {
        e.preventDefault();
        e.returnValue = '';
    }
  });

function init()
{
    currentColour = "0, 0, 0";
    currentOpacity = stringOpacity;
    currentMousePos = new Vec2(0, 0);
    prevMousePos = new Vec2(0, 0);

    initUI();

    board = new StringBoard(canvasRes / 2.5, DEFAULT_NUMPEGS, DEFAULT_PEGRADIUS);

    requestDraw = true;
    requestAnimationFrame(draw);
}

function draw()
{
    if (requestDraw)
    {
        ctxMain.clearRect(-canvasCentreOffset.x, -canvasCentreOffset.y, canvasRes, canvasRes);

        //draw board's pegs and strings
        board.draw(ctxMain);

        //draw current string to mouse
        if (stringActive)
        {
            let csc = board.getCurrentStringChain();
            let startPos = board.calculateCirclePointTangent(csc.getLastPegIndex(), csc.getLastPegIsClockwise(), currentMousePos);

            ctxMain.beginPath();
            ctxMain.moveTo(startPos.x, startPos.y);
            ctxMain.lineTo(currentMousePos.x, currentMousePos.y);

            if (editing) setStringStyle(csc.colour, (enableWrap ? stringOpacity : stringOpacityNoWrap));
            else setStringStyle(currentColour, (enableWrap ? stringOpacity : stringOpacityNoWrap));
            ctxMain.stroke();
        }

        requestDraw = false;
    }

    requestAnimationFrame(draw);
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