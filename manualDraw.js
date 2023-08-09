
let currentMousePos, prevMousePos;
let stringActive = false;
let editing = false;
let enableWrap = true;

window.addEventListener("mouseup", () => {
    //if close enough to a peg, set that as the starting one
    let nearestPegData = board.getNearestPeg(currentMousePos);
    let currentStringChain = board.getCurrentStringChain();

    if (isMouseHoveringPeg(nearestPegData))
    {
        if (stringActive)
        {
            if (nearestPegData.index === currentStringChain.getFirstPegIndex() && currentStringChain.getLength() === 1)
            {
                //unwrapped from all pegs, remove the chain
                board.popStringChain();
            }
            else
            {
                //finish the string here
                if (currentStringChain.getLastPegIndex() != nearestPegData.index)
                {
                    currentStringChain.push(nearestPegData.index, true);
                }
                
                if (!editing) addStringChainDiv(currentStringChain);
                
                board.nextStringChainIndex();
            }
            
            stringActive = false;
            editing = false;
            enableUI()
            draw();
        }
        else
        {
            //begin string chain
            board.newStringChain(nearestPegData.index, currentColour);
            stringActive = true;
            cnvMain.style.cursor = "crosshair";
            disableUI();
        }
    }
});

window.addEventListener("mousemove", (e) => {
    prevMousePos = { x: currentMousePos.x, y: currentMousePos.y };

    let canvasBounds = cnvMain.getBoundingClientRect();
    let canvasPixelsPerScreenPixel = { x: IMG_WIDTH / canvasBounds.width, y: IMG_HEIGHT / canvasBounds.height };
    currentMousePos.x = (e.x - canvasBounds.x) * canvasPixelsPerScreenPixel.x - centreOffset.x;
    currentMousePos.y = (e.y - canvasBounds.y) * canvasPixelsPerScreenPixel.y - centreOffset.y;
    let nearestPegData = board.getNearestPeg(currentMousePos);

    if (isMouseHoveringPeg(nearestPegData))
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
        checkPegWrap();
        checkPegUnwrap();
        draw();
    }
});

window.addEventListener("keydown", (e) => {
    if (e.key === "Shift")
    {
        if (slShiftMode.value === "Hold") enableWrap = false;
        draw();
    }
});

window.addEventListener("keyup", (e) => {
    if (e.key === "Shift")
    {
        if (slShiftMode.value === "Hold") enableWrap = true;
        else enableWrap = !enableWrap;
        draw();
    }
});

function checkPegWrap()
{
    if (!(stringActive && enableWrap)) return;

    //cannot wrap a peg if moving completely within the circle
    if (mouseStayedWithinBoardRadius()) return;
    
    let currentStringChain = board.getCurrentStringChain();
    let startPegIndex = currentStringChain.getLastPegIndex();
    
    let startPegPos = board.getPegPos(startPegIndex);

    //is string currently clockwise or anticlockwise from the previous peg?
    //inverted y when drawing, so increase theta is clockwise
    let thetaPeg = startPegIndex / board.numPegs * TWO_PI;
    let thetaString = Math.atan2(currentMousePos.y, currentMousePos.x);
    if (thetaString < 0) thetaString += TWO_PI;

    let stringClockwiseFromPeg = (thetaString > thetaPeg);
    if (Math.abs(thetaString - thetaPeg) > Math.PI) stringClockwiseFromPeg = !stringClockwiseFromPeg;

    //is the string moving away from or towards the start peg?
    let thetaPrevString = Math.atan2(prevMousePos.y, prevMousePos.x);
    if (thetaPrevString < 0) thetaPrevString += TWO_PI;
    let stringMovingClockwise = (thetaString > thetaPrevString);
    if (Math.abs(thetaString - thetaPrevString) > Math.PI) stringMovingClockwise = !stringMovingClockwise;

    let movingAwayFromPeg = (stringClockwiseFromPeg == stringMovingClockwise);

    let offset = (stringClockwiseFromPeg == movingAwayFromPeg ? 1 : -1);
    let iStart = (movingAwayFromPeg ? 1 : Math.ceil(board.numPegs / 2));

    for (let i = iStart; i < board.numPegs; i++)
    {   
        let iPeg = startPegIndex + i * offset;
        if (iPeg < 0) iPeg += board.numPegs;
        if (iPeg >= board.numPegs) iPeg -= board.numPegs;
        let pPeg = board.getPegPos(iPeg);
        
        let wrapData = isPointInTriangle(startPegPos, prevMousePos, currentMousePos, pPeg);
        if (wrapData.isWrapped)
        {
            //peg has been wrapped
            currentStringChain.push(iPeg, wrapData.isClockwise);
        }
    }
}

function checkPegUnwrap()
{
    if (!(stringActive && enableWrap)) return;

    let currentStringChain = board.getCurrentStringChain();
    if (currentStringChain.getLength() < 2) return;

    while (currentStringChain.getLength() > 1)
    {
        let startPegPos = board.getPegPos(currentStringChain.getSecondLastPegIndex());
        let pPeg = board.getPegPos(currentStringChain.getLastPegIndex());
    
        let wrapData = isPointInTriangle(startPegPos, prevMousePos, currentMousePos, pPeg);
    
        if (wrapData.isWrapped && (wrapData.isClockwise != currentStringChain.getLastPegDirection()))
        {
            currentStringChain.pop();
        }
        else return;
    }
}

function signedTriangleArea(baseStart, baseEnd, peak)
{
    let AB = { x: baseEnd.x - baseStart.x, y: baseEnd.y - baseStart.y };
    let AC = { x: peak.x - baseStart.x, y: peak.y - baseStart.y };

    let area = AB.x * AC.y - AB.y * AC.x;
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

function isMouseHoveringPeg(pegData)
{
    return (pegData.x - currentMousePos.x) * (pegData.x - currentMousePos.x) +
           (pegData.y - currentMousePos.y) * (pegData.y - currentMousePos.y) < board.pegRadius * board.pegRadius + 100; //bit of extra room for clicking
}

function mouseStayedWithinBoardRadius()
{
    return prevMousePos.x * prevMousePos.x + prevMousePos.y * prevMousePos.y < board.radius * board.radius &&
           currentMousePos.x * currentMousePos.x + currentMousePos.y * currentMousePos.y < board.radius * board.radius;
}