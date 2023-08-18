
let currentMousePos, prevMousePos;
let stringActive = false;
let editing = false;
let enableWrap = true;

window.addEventListener("mouseup", () => {
    //if close enough to a peg, set that as the starting one
    let nearestPegIndex = board.getNearestPegIndex(currentMousePos);
    let nearestPegPos = board.getPegPos(nearestPegIndex);
    let currentStringChain = board.getCurrentStringChain();

    if (isMouseHoveringPeg(nearestPegPos))
    {
        if (stringActive)
        {
            if (nearestPegIndex === currentStringChain.getFirstPegIndex() && currentStringChain.getLength() === 1)
            {
                //unwrapped from all pegs, remove the chain
                board.deleteStringChain(currentStringChain);

                if (editing)
                {
                    //remove this chain from the list of existing chains
                    dvStringChainList.removeChild(editingListItem);
                    editingListItem = null;
                }

            }
            else
            {
                //finish the string here
                if (currentStringChain.getLastPegIndex() != nearestPegIndex)
                {
                    //NEED WRAP START AND END HERE
                    let wrapStarts = board.calculateWrapStarts(currentStringChain.getLastPegIndex(), currentStringChain.getLastPegIsClockwise(), nearestPegIndex);
                    let wrapEnd = board.calculateWrapEnd(currentStringChain.getLastPegIndex(), currentStringChain.getLastPegIsClockwise(), nearestPegIndex, true);
                    currentStringChain.setLastPegWrapEnd(wrapEnd);
                    currentStringChain.push(nearestPegIndex, true, wrapStarts.clockwise, null); //default to clockwise when clicked
                }
                
                if (!editing) addStringChainDiv(currentStringChain);
                
                board.nextStringChainIndex();
            }
            
            stringActive = false;
            editing = false;
            enableUI()
            requestDraw = true;
        }
        else
        {
            //begin string chain
            board.newStringChain(nearestPegIndex, currentColour);
            stringActive = true;
            cnvMain.style.cursor = "crosshair";
            disableUI();
        }
    }
});

window.addEventListener("mousemove", (e) => {

    prevMousePos.set(currentMousePos);

    let canvasBounds = cnvMain.getBoundingClientRect();
    let canvasPixelsPerScreenPixel = { x: IMG_WIDTH / canvasBounds.width, y: IMG_HEIGHT / canvasBounds.height };
    currentMousePos.x = (e.x - canvasBounds.x) * canvasPixelsPerScreenPixel.x - centreOffset.x;
    currentMousePos.y = (e.y - canvasBounds.y) * canvasPixelsPerScreenPixel.y - centreOffset.y;
    let nearestPegIndex = board.getNearestPegIndex(currentMousePos);
    let nearestPegPos = board.getPegPos(nearestPegIndex);

    if (isMouseHoveringPeg(nearestPegPos))
    {
        cnvMain.style.cursor = "pointer";
    }
    else if (cnvMain.style.cursor === "pointer")
    {
        if (stringActive) cnvMain.style.cursor = "crosshair";
        else cnvMain.style.cursor = "default";
    }

    if (stringActive)
    {
        if (enableWrap) board.resolveWraps(prevMousePos, currentMousePos);
        requestDraw = true;
    }
});

window.addEventListener("keydown", (e) => {
    if (e.key === "Shift")
    {
        if (slShiftMode.value === "Hold") enableWrap = false;
        requestDraw = true;
    }
});

window.addEventListener("keyup", (e) => {
    if (e.key === "Shift")
    {
        if (slShiftMode.value === "Hold") enableWrap = true;
        else enableWrap = !enableWrap;
        requestDraw = true;
    }
    if (e.key == "f")
    {
        let csc = board.getCurrentStringChain();
        if (csc)
        {
            if (csc.getLength() > 1) csc.pop();
            else
            {
                board.deleteStringChain(csc);
                stringActive = false;
                editing = false;
                enableUI()
            }
            requestDraw = true;
        }
        
    }
});

function signedTriangleArea(baseStart, baseEnd, peak)
{
    let AB = new Vec2(baseEnd.x - baseStart.x, baseEnd.y - baseStart.y);
    let AC = new Vec2(peak.x - baseStart.x, peak.y - baseStart.y);

    let area = AB.cross(AC);
    return area;
}

function isPointInTriangle(t1, t2, t3, p)
{
    let a1 = signedTriangleArea(t1, t2, p);
    let a2 = signedTriangleArea(t2, t3, p);
    let a3 = signedTriangleArea(t1, t3, p);

    let s1 = Math.sign(a1);
    let s2 = Math.sign(a2);
    let s3 = Math.sign(a3);

    return { isWrapped: (s1 === s2 && s1 !== s3), isClockwise: s1 > 0 };
}

function isMouseHoveringPeg(pegPos)
{
    return (pegPos.x - currentMousePos.x) * (pegPos.x - currentMousePos.x) +
           (pegPos.y - currentMousePos.y) * (pegPos.y - currentMousePos.y) < board.pegRadius * board.pegRadius + 100; //bit of extra room for clicking
}

function mouseStayedWithinBoardRadius()
{
    return prevMousePos.x * prevMousePos.x + prevMousePos.y * prevMousePos.y < board.radius * board.radius &&
           currentMousePos.x * currentMousePos.x + currentMousePos.y * currentMousePos.y < board.radius * board.radius;
}