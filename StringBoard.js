
class StringBoard
{
    constructor(boardRadius, numPegs, pegRadius)
    {
        this.boardRadius = boardRadius;
        this.numPegs = numPegs;
        this.pegRadius = pegRadius;
        this.stringChains = [];
        this.currentStringChainIndex = 0;
        this.dpThroughCircleThreshold = this.calculateDPThreshold();
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
        let nextPegIndex = Math.ceil(posTheta / pegDeltaTheta) % this.numPegs;

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
        this.stringChains.push(new StringChain(startIndex, this.getPegPos(startIndex), colour));
    }

    resolveWraps(prevStringEnd, currentStringEnd)
    {
        //there is no logic here, only edge cases. this function has been scrapped and rewritten [4 and a half] times
        //https://www.desmos.com/calculator/65grtq03bm

        let csc = this.getCurrentStringChain();
        let stringStartIndex = csc.getLastPegIndex();
        let stringStartPos = this.calculateWrapEndPoint(stringStartIndex, csc.getLastPegIsClockwise(), prevStringEnd);

        //is string from previous peg to current peg through circle?
        let prevPegsThroughCircle = false;
        if (csc.getLength() > 1)
        {
            let prevPegPos = this.getPegPos(csc.getSecondLastPegIndex());
            let normal = prevPegPos.normalize();
            let dp = stringStartPos.sub(prevPegPos).normalize().dot(normal);

            if (dp < this.dpThroughCircleThreshold)
            {
                //string is going through circle
                prevPegsThroughCircle = true;
            }
        }

        //check if current peg is unwrapped
        let unwrappedThroughCircleIndex = null;
        if (prevPegsThroughCircle)
        {
            let prevPegPos = this.getPegPos(csc.getSecondLastPegIndex());

            let wrapData = isPointInTriangle(prevPegPos, prevStringEnd, currentStringEnd, stringStartPos);
            if (wrapData.isWrapped && wrapData.isClockwise != csc.getLastPegIsClockwise())
            {
                unwrappedThroughCircleIndex = csc.getLastPegIndex();
                csc.pop();
                stringStartIndex = csc.getLastPegIndex();
                stringStartPos = this.calculateWrapEndPoint(stringStartIndex, csc.getLastPegIsClockwise(), prevStringEnd);
            }
        }


        //if through to other side of circle of circle, prev to current string end used for direction
        //else, peg to prev string end used
        let prevInsideCircle = prevStringEnd.dot(prevStringEnd) < this.boardRadius * this.boardRadius;
        let currentInsideCircle = currentStringEnd.dot(currentStringEnd) < this.boardRadius * this.boardRadius;
        let exitedCircle = (prevInsideCircle && !currentInsideCircle);

        let stringStartPosNormalised = stringStartPos.normalize();
        let dp = prevStringEnd.sub(stringStartPos).normalize().dot(stringStartPosNormalised);
        let stringThroughCircle = (dp < this.dpThroughCircleThreshold);
        
        let stringDir, stringClockwise;
        let clockwiseFromStringStart = stringStartPos.normalize().perp();
        if (stringThroughCircle)
        {
            stringDir = currentStringEnd.sub(prevStringEnd).normalize();
            stringClockwise = (stringDir.dot(clockwiseFromStringStart) < 0);
        }
        else
        {
            stringDir = prevStringEnd.sub(stringStartPos).normalize();
            stringClockwise = (stringDir.dot(clockwiseFromStringStart) > 0);
        }


        let potentialWraps = this.findPotentialWraps(prevStringEnd, currentStringEnd);
        let tWraps = [];
        for (let i = 0; i < potentialWraps.length; i++)
        {
            tWraps.push({ pwIndex: i, t: this.findWrapTime(stringClockwise, stringStartIndex, potentialWraps[i].pegIndex) });
        }

        tWraps.sort((a, b) => a.t - b.t);


        //if didnt unwrap through circle, check for potential multiple unwraps
        let potentialUnwraps;
        let tUnwraps = [];
        if (unwrappedThroughCircleIndex == null)
        {
            potentialUnwraps = this.findPotentialUnwraps(prevStringEnd, currentStringEnd);

            for (let i = 0; i < potentialUnwraps.length; i++)
            {
                tUnwraps.push({ puIndex: i, t: this.findWrapTime(stringClockwise, stringStartIndex, potentialUnwraps[i].pegIndex) });
            }
    
            tUnwraps.sort((a, b) => a.t - b.t);
    
            //do unwraps which were before the first wrap
            for (let i = 0; i < potentialUnwraps.length; i++)
            {               
                if (tWraps.length > 0)
                {
                    if (exitedCircle)
                    {
                        if (tUnwraps[i].t < tWraps[0].t) break;
                    }
                    else
                    {
                        if (tUnwraps[i].t > tWraps[0].t) break;
                    }

                    //check if line from [peg before potential unwrapped peg] to [first potential wrapped peg] would have wrap point on wrong side
                    let extraUnwrapCheck = csc.getMostRecentWrapOfPegAndAlsoThePegBeforeItIGuess(potentialUnwraps[tUnwraps[i].puIndex].pegIndex);
                    if (extraUnwrapCheck == null || extraUnwrapCheck.pegBefore == null) break;

                    let startPos = extraUnwrapCheck.pegBefore.wrapEnd;
                    let endPos = potentialWraps[tWraps[0].pwIndex].wrapStart;
                    let checkPos = extraUnwrapCheck.toUnwrap.wrapStart;

                    let sign = Math.sign(signedTriangleArea(startPos, endPos, checkPos));
                    if ((extraUnwrapCheck.toUnwrap.isClockwise && sign < 0) || (!extraUnwrapCheck.toUnwrap.isClockwise && sign > 0)) break;
                } 
                

                csc.unwrap(potentialUnwraps[i]);
            }
        }


        let tUnwrappedThroughCircle = null;
        if (unwrappedThroughCircleIndex != null)
        {
            tUnwrappedThroughCircle = this.findWrapTime(stringClockwise, stringStartIndex, unwrappedThroughCircleIndex);
        }
        
        //do wraps
        if (exitedCircle && tWraps.length > 1)
        {
            for (let i = 0; i < tWraps.length; i++)
            {
                let pw = potentialWraps[tWraps[i].pwIndex];
                if (pw.pegIndex == unwrappedThroughCircleIndex) continue;

                let wrapEnd = this.calculateWrapEnd(stringStartIndex, csc.getLastPegIsClockwise(), pw.pegIndex, pw.isClockwise);
                csc.setLastPegWrapEnd(wrapEnd);
                csc.push(pw.pegIndex, pw.isClockwise, pw.wrapStart, null);
                break;
            }
        }
        else
        {
            for (let i = 0; i < tWraps.length; i++)
            {
                //check in order of times if the line change between previous mouse, current mouse and previous peg would wrap the next peg, stopping the first time it wouldnt
                let nextPegData = potentialWraps[tWraps[i].pwIndex];
                if (unwrappedThroughCircleIndex != null)
                {
                    if (nextPegData.pegIndex == unwrappedThroughCircleIndex || tWraps[i].t < tUnwrappedThroughCircle) continue;
                }

                let wrapData = isPointInTriangle(stringStartPos, prevStringEnd, currentStringEnd, nextPegData.wrapStart);
    
                if (wrapData.isWrapped)
                {
                    let wrapEnd = this.calculateWrapEnd(stringStartIndex, csc.getLastPegIsClockwise(), nextPegData.pegIndex, nextPegData.isClockwise);
                    csc.setLastPegWrapEnd(wrapEnd);
                    csc.push(nextPegData.pegIndex, wrapData.isClockwise, nextPegData.wrapStart, null);
                    stringStartIndex = nextPegData.pegIndex;
                    stringStartPos = this.calculateWrapEndPoint(nextPegData.pegIndex, nextPegData.isClockwise, prevStringEnd);
                }
                else
                {
                    break;
                }
            }
        }
    }

    findWrapTime(clockwise, startIndex, pegIndex)
    {
        if (clockwise)
        {
            if (startIndex > pegIndex) pegIndex += this.numPegs;
            return pegIndex - startIndex;
        }
        else
        {
            if (startIndex < pegIndex) startIndex += this.numPegs;
            return startIndex - pegIndex;
        }
    }

    findPotentialWraps(p1, p2)
    {
        let potentialWraps = [];
        let csc = this.getCurrentStringChain();
        let startIndex = csc.getLastPegIndex();
        let startPegPos = this.calculateWrapEndPoint(startIndex, csc.getLastPegIsClockwise(), p1);

        for (let endIndex = 0; endIndex < this.numPegs; endIndex++)
        {
            if (startIndex == endIndex) continue;

            let wrapPoints = this.calculateWrapStarts(startIndex, csc.getLastPegIsClockwise(), endIndex);
        
            let wrapData = isPointInTriangle(startPegPos, p1, p2, wrapPoints.clockwise);
            if (wrapData.isWrapped && wrapData.isClockwise)
            {
                potentialWraps.push({ pegIndex: endIndex, isClockwise: wrapData.isClockwise, wrapStart: wrapPoints.clockwise });
            }
            else
            {
                wrapData = isPointInTriangle(startPegPos, p1, p2, wrapPoints.antiClockwise);
                if (wrapData.isWrapped && !wrapData.isClockwise)
                {
                    potentialWraps.push({ pegIndex: endIndex, isClockwise: wrapData.isClockwise, wrapStart: wrapPoints.antiClockwise });
                }
            }
        }

        return potentialWraps;
    }

    findPotentialUnwraps(p1, p2)
    {
        let potentialUnwraps = [];
        let csc = this.getCurrentStringChain();
        if (csc.getLength() < 2) return potentialUnwraps;

        let cscpwCopy = csc.getPegWrapsCopy();

        while (cscpwCopy.length > 1)
        {
            let startPegData = cscpwCopy[cscpwCopy.length - 2];
            let startPegPos = startPegData.wrapEnd;

            let endPegData = cscpwCopy[cscpwCopy.length - 1];
            let endPegPos = endPegData.wrapStart;
        
            let wrapData = isPointInTriangle(startPegPos, p1, p2, endPegPos);
        
            if (wrapData.isWrapped && (wrapData.isClockwise != endPegData.isClockwise))
            {
                potentialUnwraps.push(cscpwCopy.pop());
            }
            else break;
        }

        return potentialUnwraps;
    }

    calculateDPThreshold()
    {
        //the value below which a line is considered to be crossing through the circle. equivalent to that of a line going from the outside of one peg to the inside of the next
        //dot product between [the normal of the circle at peg 0] and [the normalised vector from peg 0 outside to peg 1 inside]
        
        let tangents = this.calculateCircleTangents(0, 1);
        let p0 = tangents.tInner12;
        let p1 = tangents.tInner22;

        let n0 = p0.normalize();
        let n10 = p1.sub(p0).normalize();
        let dot = n0.dot(n10);
        return dot * 1.01; //floating point precision my beloved
    }

    calculateWrapEndPoint(startIndex, startClockwise, stringEnd)
    {
        let wrapEnd = this.calculateCirclePointTangent(startIndex, startClockwise, stringEnd);
        return wrapEnd;
    }

    calculateWrapEnd(startIndex, startClockwise, endIndex, endClockWise)
    {
        let tangents = this.calculateCircleTangents(startIndex, endIndex);

        if (startClockwise)
        {
            if (endClockWise)
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
            if (endClockWise)
            {
                return tangents.tInner11;
            }
            else
            {
                return tangents.tOuter11;
            }
        }
    }
    
    calculateWrapStarts(startIndex, startClockwise, endIndex)
    {
        let tangents = this.calculateCircleTangents(startIndex, endIndex);
        let wrapPoints = { clockwise: null, antiClockwise: null };

        if (startClockwise)
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

    draw(context)
    {
        //draw pegs
        context.strokeStyle = "black";
        for (let i = 0; i < this.numPegs; i++)
        {
            let pos = this.getPegPos(i);

            context.beginPath();
            context.arc(pos.x, pos.y, this.pegRadius, 0, TWO_PI);
            context.fill();
            context.stroke();
        }

        //draw strings
        for (let sc of this.stringChains)
        {
            sc.draw(context);
        }
    }

    getSaveData()
    {
        /*could refactor to have wrap start and ends be stored as angles rather than
        fixed positions, which would remove the need to save board and peg radius.
        maybe if i get bored of this finally working and want to break it again*/

        let data = {
            boardRadius: this.boardRadius,
            numPegs: this.numPegs,
            pegRadius: this.pegRadius,
            stringChains: this.stringChains
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


        if (dataObj.boardRadius == null || dataObj.boardRadius <= 0)
        {
            result.error = "Missing or invalid data: boardRadius";;
            return result;
        }

        if (dataObj.numPegs == null || dataObj.numPegs < 2 || dataObj.numPegs > 512)
        {
            result.error = "Missing or invalid data: numPegs";
            return result;
        }

        if (dataObj.pegRadius == null || dataObj.pegRadius <= 0)
        {
            result.error = "Missing or invalid data: pegradius";
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

                //no checks for if wrap start and end make sense with provided numpegs and board and peg radii...
                if (j > 0 && (pw.wrapStart == null || pw.wrapStart.x == null || pw.wrapStart.y == null))
                {
                    result.error = "Missing or invalid data: stringChain[" + i + "]: pegWraps[" + j + "]: wrapStart";
                    return result;
                }

                if (j < sc.pegWraps.length - 1 && (pw.wrapEnd == null || pw.wrapEnd.x == null || pw.wrapEnd.y == null))
                {
                    result.error = "Missing or invalid data: stringChain[" + i + "]: pegWraps[" + j + "]: wrapEnd";
                    return result;
                }
            }
        }

        this.numPegs = dataObj.numPegs;
        this.pegRadius = dataObj.pegRadius;
        this.stringChains = [];

        for (let sc of dataObj.stringChains)
        {
            this.stringChains.push(new StringChain())
            let newSC = this.stringChains[this.stringChains.length - 1];
            newSC.colour = sc.colour;
            newSC.pegWraps = sc.pegWraps;
        }

        this.nextStringChainIndex();
        this.dpThroughCircleThreshold = this.calculateDPThreshold();

        result.succeeded = true;
        return result;
    }
}
