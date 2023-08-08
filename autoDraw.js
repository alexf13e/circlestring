
/*technically functional but very slow and doesnt produce very good images*/


let cnvHidden, ctxHidden;
let sourceImageData, stringImageData;
let autoPegIndices = [];
let remainingPegs = [];
let stringDifs = new Array((numPegs * numPegs - numPegs) * 0.5);

let startIndex = 0;
let endIndex = 1;
let stringCount = 0;
let rpIndex = 0;
let bestStart = null, bestEnd = null;
let bestNextPeg = null;
let bestImprovement = 0;
let totalDifference;
const MAX_STRINGS = 50;
const CHECKS_PER_FRAME = 25;

let sourceImage = new Image();
sourceImage.addEventListener("load", () => {
    cnvHidden.width = IMG_WIDTH;
    cnvHidden.height = IMG_HEIGHT;
    ctxHidden.fillStyle = "white";
    ctxHidden.translate(centreOffset.x, centreOffset.y);

    ctxHidden.drawImage(sourceImage, -centreOffset.x, -centreOffset.y, IMG_WIDTH, IMG_HEIGHT);
    sourceImageData = ctxHidden.createImageData(IMG_WIDTH, IMG_HEIGHT);
    sourceImageData.data.set(getCtxHiddenData().data);
    clearCtxHidden();
    
    totalDifference = imageDataDifference(sourceImageData.data, getCtxHiddenData().data);
    ctxHidden.filter = "blur(1px)";
    
    generateStrings();
});

function autoInit()
{
    sourceImage.src = "test5.png";
    for (let i = 0; i < numPegs; i++) remainingPegs.push(i);

    cnvHidden = document.createElement("canvas");
    cnvHidden.id = "cnvHidden";
    document.appendChild(cnvHidden);
    ctxHidden = cnvHidden.getContext("2d");
    ctxHidden.strokeStyle = "rgba(0, 0, 0, 1)";
}

function generateStrings()
{
    //get initial best line to draw
    for (let c = 0; c < CHECKS_PER_FRAME; c++)
    {
        //draw line onto tempImageData
        clearCtxHidden();
        let ps = getPegPos(startIndex);
        let pe = getPegPos(endIndex);
        ctxHidden.beginPath();
        ctxHidden.moveTo(ps.x, ps.y);
        ctxHidden.lineTo(pe.x, pe.y);
        ctxHidden.stroke();

        //get absolute difference between tempImageData and sourceImageData
        let tempImageData = getCtxHiddenData();
        let dif = imageDataDifference(tempImageData.data, sourceImageData.data);
        setLineDif(startIndex, endIndex, dif);

        //for calculating how much better a line would make the image, find the difference between dif and totalDifference
        let improvement = totalDifference - dif;

        //if best so far, set best start and end
        if (improvement > bestImprovement)
        {
            bestImprovement = improvement;
            bestStart = startIndex;
            bestEnd = endIndex;
        }

        endIndex++;
        if (endIndex >= remainingPegs.length)
        {
            startIndex++;
            endIndex = startIndex + 1;
        }

        if (startIndex >= remainingPegs.length - 1)
        {
            break;
        }
    }

    //still more to check, ask for another frame to run
    if (startIndex < remainingPegs.length - 1)
    {
        requestAnimationFrame(generateStrings);
        return;
    }


    //finished checking all pairs
    //if the image is completely blank, start/end will be null
    if (bestStart == null)
    {
        //nothing to do
        alert("finished (best start was null)");
        return;
    }

    //now have starting point. for each peg not already used, find the line to the next one which has the lowest difference
    autoPegIndices.push(bestStart);
    autoPegIndices.push(bestEnd);
    removeRemainingPeg(bestStart);
    removeRemainingPeg(bestEnd);

    totalDifference -= bestImprovement;
    bestImprovement = 0;

    updatePreview();
    requestAnimationFrame(nextStringFrame);
}

function nextStringFrame()
{
    for (let c = 0; c < CHECKS_PER_FRAME; c++)
    {
        let dif = getLineDif(remainingPegs[rpIndex], getLastAutoPegIndex());
        let improvement = totalDifference - dif;

        if (improvement > bestImprovement || bestImprovement == 0)
        {
            bestImprovement = improvement;
            bestNextPeg = remainingPegs[rpIndex];
        }

        rpIndex++;

        if (rpIndex >= remainingPegs.length)
        {
            break;
        }
    }

    if (rpIndex < remainingPegs.length)
    {
        requestAnimationFrame(nextStringFrame);
        return;
    }

    rpIndex = 0;

    //gone through all other pegs and found the best line (if any)
    if (bestNextPeg == null)
    {
        alert("finished (best next peg was null)");
        return; //no more lines can make the result any better
    }
        
    autoPegIndices.push(bestNextPeg);
    removeRemainingPeg(bestNextPeg);
    bestNextPeg = null;
    updatePreview();

    totalDifference -= bestImprovement;
    bestImprovement = 0;

    //stringCount++;
    if (stringCount < MAX_STRINGS) requestAnimationFrame(nextStringFrame);
    else alert("finished (reached max strings)");
}

function _nextStringFrame()
{
    for (let c = 0; c < CHECKS_PER_FRAME; c++)
    {
        let rp = remainingPegs[rpIndex];

        if (rp === getLastAutoPegIndex())
        {
            rpIndex++;
            continue;
        }

        //draw all lines up to this point (save copying image data)
        clearCtxHidden();
        ctxHidden.beginPath();
        let p0 = getPegPos(autoPegIndices[0]);
        ctxHidden.moveTo(p0.x, p0.y);
        for (let i = 1; i < autoPegIndices.length; i++)
        {
            let p1 = getPegPos(autoPegIndices[i]);
            ctxHidden.lineTo(p1.x, p1.y);
        }

        //draw new line
        let pe = getPegPos(rp);
        ctxHidden.lineTo(pe.x, pe.y);
        ctxHidden.stroke();

        let tempImageData = getCtxHiddenData();
        let dif = imageDataDifference(tempImageData.data, sourceImageData.data);

        if (dif < bestImprovement)
        {
            bestImprovement = dif;
            bestNextPeg = rp;
        }

        rpIndex++;

        if (rpIndex >= remainingPegs.length)
        {
            break;
        }
    }

    if (rpIndex < remainingPegs.length)
    {
        requestAnimationFrame(nextStringFrame);
        return;
    }

    rpIndex = 0;

    //gone through all other pegs and found the best line (if any)
    if (bestNextPeg == null)
    {
        alert("finished (best next peg was null)");
        return; //no more lines can make the result any better
    }
        
    autoPegIndices.push(bestNextPeg);
    removeRemainingPeg(bestNextPeg);
    bestNextPeg = null;
    updatePreview();

    //bestDifference = Infinity;

    //stringCount++;
    if (stringCount < MAX_STRINGS) requestAnimationFrame(nextStringFrame);
    else alert("finished (reached max strings)");
}

function updatePreview()
{
    let pos = getPegPos(getLastAutoPegIndex());
    ctxMain.fillRect(-centreOffset.x, -centreOffset.y, IMG_WIDTH, IMG_HEIGHT);
    ctxMain.lineTo(pos.x, pos.y);
    ctxMain.stroke();
}

function clearCtxHidden()
{
    ctxHidden.fillRect(-centreOffset.x, -centreOffset.y, IMG_WIDTH, IMG_HEIGHT);
}

function getCtxHiddenData()
{
    return ctxHidden.getImageData(0, 0, IMG_WIDTH, IMG_HEIGHT);
}

function imageDataDifference(id1, id2)
{
    let difference = 0;
    for (let y = 0; y < IMG_HEIGHT; y++)
    {
        for (let x = 0; x < IMG_WIDTH; x++)
        {
            let index = (y * IMG_WIDTH + x) * 4;
            //monochrome, so only care about one of the colour channels (for now)
            difference += Math.abs(id1[index] - id2[index]);
        }
    }

    return difference;
}

function getLastAutoPegIndex()
{
    return autoPegIndices[autoPegIndices.length - 1];
}

function removeRemainingPeg(value)
{
    for (let i = 0; i < remainingPegs.length; i++)
    {
        if (remainingPegs[i] === value)
        {
            remainingPegs.splice(i, 1);
            return;
        }
    }
}

function getLineDif(startIndex, endIndex)
{
    if (startIndex > endIndex)
    {
        let t = startIndex;
        startIndex = endIndex;
        endIndex = t;
    }

    //https://www.desmos.com/calculator/yqg4nmm8tn
    let f = startIndex * numPegs - (startIndex * startIndex - startIndex) / 2;
    let g = endIndex - startIndex - 1;
    let difIndex = f + g;
    let v = stringDifs[difIndex];
    return v;
}

function setLineDif(startIndex, endIndex, value)
{
    if (startIndex > endIndex)
    {
        let t = startIndex;
        startIndex = endIndex;
        endIndex = t;
    }

    let f = startIndex * numPegs - (startIndex * startIndex - startIndex) / 2;
    let g = endIndex - startIndex - 1;
    let difIndex = f + g;
    stringDifs[difIndex] = value;
}