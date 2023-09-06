
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
    if (board.stringChains.length > 0 && inpWarnOnPageLeave.checked)
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
    board.updatePreRender(cnvMain, ctxMain);

    requestDraw = true;
    requestAnimationFrame(draw);
}

function draw()
{
    if (requestDraw)
    {
        //draw board's pegs and strings
        board.draw(ctxMain);

        //draw current string to mouse
        if (stringActive)
        {
            let csc = board.getCurrentStringChain();
            let startPos = board.calculateCirclePointTangent(csc.getLastPegIndex(), csc.getLastPegIsClockwise(), currentMousePos);

            ctxMain.beginPath();
            
            if (csc.getLength() > 1)
            {
                let pegPos = board.getPegPos(csc.getLastPegIndex());
                let dStart = csc.getLastPegWrapStart().sub(pegPos);
                let aStart = Math.atan2(dStart.y, dStart.x);
                let dEnd = startPos.sub(pegPos);
                let aEnd = Math.atan2(dEnd.y, dEnd.x);
    
                ctxMain.arc(pegPos.x, pegPos.y, board.pegRadius, aStart, aEnd, !csc.getLastPegIsClockwise());
            }

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