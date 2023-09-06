
class StringBoard
{
    constructor(boardRadius, numPegs, pegRadius)
    {
        this.boardRadius = boardRadius;
        this.numPegs = numPegs;
        this.pegRadius = pegRadius;
        this.stringChains = [];
        this.patternPreviewChain = null;
        this.currentStringChainIndex = 0;
        this.preRenderTexture = null;
        this.activeStringChain = null;
    }

    reset(numPegs)
    {
        this.numPegs = numPegs;
        this.stringChains = [];
        this.currentStringChainIndex = 0;
    }

    getPegPos(index)
    {
        let theta = index / this.numPegs * TWO_PI;
        let x = this.boardRadius * Math.cos(theta);
        let y = this.boardRadius * Math.sin(theta);

        return new Vec2(x, y);
    }

    getNearestPegIndex(pos)
    {
        let posTheta = Math.atan2(pos.y, pos.x);
        if (posTheta < 0) posTheta += TWO_PI;

        let pegDeltaTheta = TWO_PI / this.numPegs;
        let prevPegIndex = Math.floor(posTheta / pegDeltaTheta);
        let nextPegIndex = Math.ceil(posTheta / pegDeltaTheta);

        let prevPegTheta = prevPegIndex * pegDeltaTheta;
        let nextPegTheta = nextPegIndex * pegDeltaTheta;

        if (posTheta - prevPegTheta < nextPegTheta - posTheta)
        {
            //prev is closer
            return prevPegIndex;
        }
        else
        {
            //next is closer
            return nextPegIndex;
        }
    }

    popStringChain()
    {
        if (this.stringChains.length > 0) this.stringChains.pop();
    }

    getCurrentStringChain()
    {
        return this.stringChains[this.currentStringChainIndex];
    }

    setCurrentStringChain(stringChain)
    {
        this.currentStringChainIndex = this.stringChains.indexOf(stringChain);
        this.activeStringChain = this.stringChains[this.currentStringChainIndex];
    }

    deleteStringChain(stringChain)
    {
        let index = this.stringChains.indexOf(stringChain);
        this.stringChains.splice(index, 1);
        this.nextStringChainIndex();
    }

    setCurrentStringChainIndex(index)
    {
        this.currentStringChainIndex = index;
    }

    nextStringChainIndex()
    {
        this.currentStringChainIndex = this.stringChains.length;
    }

    newStringChain(startIndex, colour)
    {
        this.stringChains.push(new StringChain(startIndex, colour));
        this.activeStringChain = this.getCurrentStringChain();
    }

    generatePatternPreview(startIndex, interval, count, clockwise, colour)
    {
        this.patternPreviewChain = new StringChain(startIndex, colour);
        let csc = this.patternPreviewChain;

        let direction = (clockwise ? 1 : -1);
        let currentIndex = (startIndex + interval * direction) % this.numPegs;
        let nextIndex = (currentIndex + interval * direction) % this.numPegs;
        csc.setLastPegWrapEnd(this.calculateWrapEnd(startIndex, clockwise, currentIndex, clockwise));

        let wrapStarts = this.calculateWrapStarts(startIndex, clockwise, currentIndex);
        let wrapStartPos = (clockwise ? wrapStarts.clockwise : wrapStarts.antiClockwise);

        let doWrap = () => {
            let wrapEndPos = this.calculateWrapEnd(currentIndex, clockwise, nextIndex, clockwise);
            csc.push(currentIndex, clockwise, wrapStartPos, wrapEndPos);

            wrapStarts = this.calculateWrapStarts(currentIndex, clockwise, nextIndex);
            wrapStartPos = (clockwise ? wrapStarts.clockwise : wrapStarts.antiClockwise);

            currentIndex = (currentIndex + interval * direction) % this.numPegs;
            nextIndex = (nextIndex + interval * direction) % this.numPegs;
        };

        if (count == 0)
        {
            //repeat until looping back to start
            while (currentIndex != startIndex)
            {
                doWrap();
            }

            //last finishing wrap around start
            doWrap();
            csc.setLastPegWrapEnd(null)
        }
        else
        {
            //repeat for however many times requested
            for (let i = 0; i < count; i++)
            {
                doWrap();
            }

            csc.setLastPegWrapEnd(null);
        }
    }

    applyPattern()
    {
        this.stringChains.push(this.patternPreviewChain);
        this.nextStringChainIndex();
    }

    resolveWraps(prevStringEnd, currentStringEnd)
    {
        //there is no logic here, only edge cases (actually this version's not so bad). this function has been scrapped and rewritten [5] times
        //https://www.desmos.com/calculator/65grtq03bm

        let csc = this.getCurrentStringChain();
        let checkUnwraps = true;
        let lastUnwrappedIndex = null; //track the most recent unwrapped peg and dont allow it to be wrapped

        //until no more wraps or unwraps occur
        while (true)
        {
            //find first wrap position
            let stringStart = this.calculateCirclePointTangent(csc.getLastPegIndex(), csc.getLastPegIsClockwise(), prevStringEnd);
            let firstWrapData = this.getFirstWrap(stringStart, prevStringEnd, currentStringEnd, csc.getLastPegIndex(), csc.getLastPegIsClockwise(), lastUnwrappedIndex);
            let wrapIndex = null, wrapClockwise = null, wrapPos = null;
            if (firstWrapData != null)
            {
                wrapIndex = firstWrapData.pegIndex;
                wrapClockwise = firstWrapData.isClockwise;
                wrapPos = firstWrapData.wrapStart;
            }

            let unwrapPos = csc.getLastPegWrapStart();

            //no wraps or unwraps, nothing more to do, finish here
            if (wrapPos == null && (unwrapPos == null || checkUnwraps == false)) return;

            if (checkUnwraps && unwrapPos != null)
            {
                let prevStringStart = csc.getSecondLastPegWrapEnd();
                let tWrap = (wrapPos == null ? null : findAngleInTriangle(prevStringStart, prevStringEnd, wrapPos));
                let tUnwrap = (unwrapPos == null ? null : findAngleInTriangle(prevStringStart, prevStringEnd, unwrapPos));

                //check if unwrap is actually in triangle and in the correct direction
                let unwrapData = isPointInTriangle(csc.getSecondLastPegWrapEnd(), prevStringEnd, currentStringEnd, unwrapPos);
                let shouldTryUnwrap = unwrapData.isWrapped && unwrapData.isClockwise != csc.getLastPegIsClockwise();

                if (shouldTryUnwrap)
                {
                    //if unwrapped happened first, do that. otherwise do wrap instead
                    if (tWrap == null || tUnwrap < tWrap)
                    {
                        //unwrap
                        lastUnwrappedIndex = csc.getLastPegIndex();
                        csc.pop();
                        
                        //move prevStringEnd to where it would be at the time of unwrapping
                        prevStringEnd = findNextPrevStringEnd(prevStringEnd, currentStringEnd, prevStringStart, unwrapPos);
                        
                        //dont want to wrap as well this iteration, so continue
                        continue;
                    }
                }
                else
                {
                    if (firstWrapData == null) return; //no wrap or unwrap
                }
            }

            //wrap
            let wrapEnd = this.calculateWrapEnd(csc.getLastPegIndex(), csc.getLastPegIsClockwise(), wrapIndex, wrapClockwise);
            csc.setLastPegWrapEnd(wrapEnd);
            csc.push(wrapIndex, wrapClockwise, wrapPos, null);

            //move prevStringEnd to where it would be at the time of wrapping
            prevStringEnd = findNextPrevStringEnd(prevStringEnd, currentStringEnd, stringStart, wrapPos);

            //if wrap happened, unwraps no longer possible
            checkUnwraps = false;
        }
    }

    getFirstWrap(p1, p2, p3, startIndex, startClockwise, lastUnwrappedIndex)
    {
        /*attempted to optimise this by only considering pegs within triangle rather than looping through all of them.
        became incredibly more complex and inconsistent, and profiling shows around 0.3% of the program time is spent
        in the actual logic, with the rest being spent drawing to the canvas, so not worth trying to improve currently*/


        //get potential pegs by finding all within triangle
        let potentials = [];
        for (let pegIndex = 0; pegIndex < this.numPegs; pegIndex++)
        {
            if (pegIndex == startIndex || pegIndex == lastUnwrappedIndex) continue;

            let wrapStarts = this.calculateWrapStarts(startIndex, startClockwise, pegIndex);

            let wrapData = isPointInTriangle(p1, p2, p3, wrapStarts.clockwise);
            if (wrapData.isWrapped && wrapData.isClockwise)
            {
                potentials.push({ pegIndex: pegIndex, isClockwise: wrapData.isClockwise, wrapStart: wrapStarts.clockwise });
            }
            else
            {
                wrapData = isPointInTriangle(p1, p2, p3, wrapStarts.antiClockwise);
                if (wrapData.isWrapped && !wrapData.isClockwise)
                {
                    potentials.push({ pegIndex: pegIndex, isClockwise: wrapData.isClockwise, wrapStart: wrapStarts.antiClockwise });
                }
            }
        }

        if (potentials.length == 0) return null;

        //find potential peg which would be hit first
        let nearestPeg;
        let nearestTime = Infinity;
        for (let peg of potentials)
        {
            let time = findAngleInTriangle(p1, p2, peg.wrapStart);
            if (time < nearestTime)
            {
                nearestTime = time;
                nearestPeg = peg;
            }
        }

        return { pegIndex: nearestPeg.pegIndex, isClockwise: nearestPeg.isClockwise, wrapStart: nearestPeg.wrapStart };
    }

    calculateWrapEnd(prevIndex, prevClockwise, currentIndex, currentClockWise)
    {
        let tangents = this.calculateCircleTangents(prevIndex, currentIndex);

        if (prevClockwise)
        {
            if (currentClockWise)
            {
                return tangents.tOuter12;
            }
            else
            {
                return tangents.tInner12;
            }
        }
        else
        {
            if (currentClockWise)
            {
                return tangents.tInner11;
            }
            else
            {
                return tangents.tOuter11;
            }
        }
    }
    
    calculateWrapStarts(currentIndex, currentClockwise, nextIndex)
    {
        let tangents = this.calculateCircleTangents(currentIndex, nextIndex);
        let wrapPoints = { clockwise: null, antiClockwise: null };

        if (currentClockwise)
        {
            wrapPoints.clockwise = tangents.tOuter22;
            wrapPoints.antiClockwise = tangents.tInner22;
        }
        else
        {
            wrapPoints.clockwise = tangents.tInner21;
            wrapPoints.antiClockwise = tangents.tOuter21;
        }

        return wrapPoints;
    }

    calculateCircleTangents(startIndex, endIndex)
    {
        //https://www.desmos.com/calculator/x0vdb80xju
        //https://planetcalc.com/8098/
        //note y axis is inverted here, so points dont match up exactly, had to do some fudging

        let c1 = this.getPegPos(startIndex);
        let c2 = this.getPegPos(endIndex);
        let midpoint = c1.add(c2.sub(c1).mul(0.5));
        let lengthC1ToMid = midpoint.sub(c1).length();
        let dirC1toC2 = c2.sub(c1).normalize();
        let perpC1toC2 = dirC1toC2.perp();
        
        let r2 = Math.sqrt(lengthC1ToMid * lengthC1ToMid - this.pegRadius * this.pegRadius);
        let a = this.pegRadius * this.pegRadius - r2 * r2 + lengthC1ToMid * lengthC1ToMid;
        a /= 2 * lengthC1ToMid;
        let h = Math.sqrt(this.pegRadius * this.pegRadius - a * a);
        let p3 = c1.add(midpoint.sub(c1).mul(a / lengthC1ToMid));

        let tOuter11 = c1.add(perpC1toC2.mul(this.pegRadius));
        let tOuter12 = c1.sub(perpC1toC2.mul(this.pegRadius));
        let tOuter21 = c2.add(perpC1toC2.mul(this.pegRadius));
        let tOuter22 = c2.sub(perpC1toC2.mul(this.pegRadius));

        let tInner11 = p3.add(perpC1toC2.mul(h));
        let tInner12 = p3.sub(perpC1toC2.mul(h));

        let lengthInnerToMid = midpoint.sub(tInner11).length();
        let dirTInner11toMid = midpoint.sub(tInner11).normalize();
        let dirTInner12toMid = midpoint.sub(tInner12).normalize();

        let tInner21 = tInner11.add(dirTInner11toMid.mul(2 * lengthInnerToMid));
        let tInner22 = tInner12.add(dirTInner12toMid.mul(2 * lengthInnerToMid));

        return {
            tOuter11: tOuter11,
            tOuter12: tOuter12,
            tOuter21: tOuter21,
            tOuter22: tOuter22,
            tInner11: tInner11,
            tInner12: tInner12,
            tInner21: tInner21,
            tInner22: tInner22
        };
    }

    calculateCirclePointTangent(startIndex, startClockwise, endPoint)
    {
        let c1 = this.getPegPos(startIndex);
        let lengthC1ToEnd = endPoint.sub(c1).length();
        let perpC1toEnd = endPoint.sub(c1).normalize().perp();
        let r2 = Math.sqrt(lengthC1ToEnd * lengthC1ToEnd - this.pegRadius * this.pegRadius);
        let a = this.pegRadius * this.pegRadius - r2 * r2 + lengthC1ToEnd * lengthC1ToEnd;
        a /= 2 * lengthC1ToEnd;
        let h = Math.sqrt(this.pegRadius * this.pegRadius - a * a);
        let p3 = c1.add(endPoint.sub(c1).mul(a / lengthC1ToEnd));

        if (startClockwise)
        {
            let tInner12 = p3.sub(perpC1toEnd.mul(h));
            return tInner12;
        }
        else
        {
            let tInner11 = p3.add(perpC1toEnd.mul(h));
            return tInner11;
        }
    }

    updatePreRender(canvas, context)
    {
        console.log("update pre render");
        context.clearRect(-canvasCentreOffset.x, -canvasCentreOffset.y, canvasRes, canvasRes);

        //draw pegs
        context.strokeStyle = "black";
        for (let i = 0; i < this.numPegs; i++)
        {
            let pos = this.getPegPos(i);

            context.beginPath();
            context.arc(pos.x, pos.y, this.pegRadius, 0, TWO_PI);
            context.fill();
        }

        //draw strings
        for (let sc of this.stringChains)
        {
            if (sc == this.activeStringChain) continue;
            sc.draw(context, false);
        }


        this.preRenderTexture = canvas.toDataURL("image/png");
        canvas.style.backgroundImage = "url(" + this.preRenderTexture + ")";
    }

    draw(context)
    {
        context.clearRect(-canvasCentreOffset.x, -canvasCentreOffset.y, canvasRes, canvasRes);
        
        if (this.activeStringChain != null) this.activeStringChain.draw(context, false);

        if (previousHoveredPegIndex != null)
        {
            this.patternPreviewChain.draw(context, true);
        }
    }

    getSaveData()
    {
        let stringChains = [];
        for (let sc of this.stringChains)
        {
            let savedSc = {
                colour: sc.colour,
                pegWraps: []
            };

            for (let pw of sc.pegWraps)
            {
                let savedPw = {
                    pegIndex: pw.pegIndex,
                    isClockwise: pw.isClockwise
                };

                savedSc.pegWraps.push(savedPw);
            }

            stringChains.push(savedSc);
        }

        let data = {
            numPegs: this.numPegs,
            stringChains: stringChains
        };

        return JSON.stringify(data, null, 4);
    }

    loadFromSave(data)
    {
        let result = { succeeded: false, error: "" };
        let dataObj;

        try
        {
            dataObj = JSON.parse(data);
        }
        catch
        {
            result.error = "Incorrect file format";
            return result;
        }

        if (dataObj.numPegs == null || dataObj.numPegs < 2 || dataObj.numPegs > 512)
        {
            result.error = "Missing or invalid data: numPegs";
            return result;
        }
        
        if (!Array.isArray(dataObj.stringChains))
        {
            result.error = "Invalid data: stringChains";
            return result;
        }

        for (let i = 0; i < dataObj.stringChains.length; i++)
        {
            let sc = dataObj.stringChains[i];

            if (sc.colour == null)
            {
                result.error = "Missing data: stringChain[" + i + "]: colour";
                return result;
            }

            let channels = sc.colour.split(",");
            if (channels.length != 3)
            {
                result.error = "Invalid data: stringChain[" + i + "]: colour";
                return result;
            }

            for (let c = 0; c < 3; c++)
            {
                let value = parseInt(channels[c]);
                if (value < 0 || value > 255)
                {
                    result.error = "Invalid data: stringChain[" + i + "]: colour";
                    return result;
                }
            }

            if (!Array.isArray(sc.pegWraps))
            {
                result.error = "Invalid data: stringChain[" + i + "]: pegWraps";
                return result;
            }

            for (let j = 0; j < sc.pegWraps.length; j++)
            {
                let pw = sc.pegWraps[j];

                if (pw.pegIndex == null || pw.pegIndex < 0 || pw.pegIndex >= dataObj.numPegs)
                {
                    result.error = "Missing or invalid data: stringChain[" + i + "]: pegWraps[" + j + "]: pegIndex";
                    return result;
                }

                if (pw.isClockwise == null || (pw.isClockwise != false && pw.isClockwise != true))
                {
                    result.error = "Missing or invalid data: stringChain[" + i + "]: pegWraps[" + j + "]: isClockwise";
                    return result;
                }
            }
        }

        this.numPegs = dataObj.numPegs;
        this.stringChains = [];


        for (let sc of dataObj.stringChains)
        {
            let pegWraps = [];

            let wrapStartPos = null;
            for (let i = 0; i < sc.pegWraps.length - 1; i++)
            {
                let pwCurrent = sc.pegWraps[i], pwNext = sc.pegWraps[i + 1];
                let wrapEnd = this.calculateWrapEnd(pwCurrent.pegIndex, pwCurrent.isClockwise, pwNext.pegIndex, pwNext.isClockwise);
                                
                let pw = {
                    pegIndex: pwCurrent.pegIndex,
                    isClockwise: pwCurrent.isClockwise,
                    wrapStart: wrapStartPos,
                    wrapEnd: wrapEnd
                };

                pegWraps.push(pw);

                let wrapStarts = this.calculateWrapStarts(pwCurrent.pegIndex, pwCurrent.isClockwise, pwNext.pegIndex);
                if (pwNext.isClockwise) wrapStartPos = wrapStarts.clockwise;
                else wrapStartPos = wrapStarts.antiClockwise;
            }

            let finalPw = sc.pegWraps[sc.pegWraps.length - 1];
            let pw = {
                pegIndex: finalPw.pegIndex,
                isClockwise: finalPw.isClockwise,
                wrapStart: wrapStartPos
            };

            pegWraps.push(pw);


            let newSC = new StringChain();
            newSC.colour = sc.colour;
            newSC.pegWraps = pegWraps;
            this.stringChains.push(newSC);
        }

        this.nextStringChainIndex();

        result.succeeded = true;
        return result;
    }
}


function findAngleInTriangle(t1, t2, p)
{
    //find angle of line t1 to p from line t1 to t2
    let vLine = t2.sub(t1).normalize();
    let vPoint = p.sub(t1).normalize();
    let angle = Math.acos(vLine.dot(vPoint));
    return angle;
}

function findNextPrevStringEnd(prevStringEnd, currentStringEnd, stringStart, point)
{
    let x1 = stringStart.x;      let y1 = stringStart.y;
    let x2 = point.x;            let y2 = point.y;
    let x3 = prevStringEnd.x;    let y3 = prevStringEnd.y;
    let x4 = currentStringEnd.x; let y4 = currentStringEnd.y;

    let A = x1*y2 - y1*x2;
    let B = x3*y4 - y3*x4;
    let C = (x1 - x2)*(y3 - y4) - (y1 - y2)*(x3-x4);

    let px = (A * (x3 - x4) - (x1 - x2) * B) / C;
    let py = (A * (y3 - y4) - (y1 - y2) * B) / C;

    return new Vec2(px, py);
}
