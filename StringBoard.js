
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
        this.stringChains.push(new StringChain(startIndex, colour));
    }

    resolveWraps(prevStringEnd, currentStringEnd)
    {
        //there is no logic here, only edge cases. this function has been scrapped and rewritten [4] times
        //https://www.desmos.com/calculator/65grtq03bm

        let csc = this.getCurrentStringChain();
        let stringStartIndex = csc.getLastPegIndex();
        let stringStartPos = this.getPegPos(stringStartIndex);

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
                stringStartPos = this.getPegPos(stringStartIndex);
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
                if (exitedCircle)
                {
                    if (tWraps.length > 0 && tUnwraps[i].t < tWraps[0].t) break;
                }
                else
                {
                    if (tWraps.length > 0 && tUnwraps[i].t > tWraps[0].t) break;
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
                
                csc.push(pw.pegIndex, pw.isClockwise);
                break;
            }
        }
        else
        {
            for (let i = 0; i < tWraps.length; i++)
            {
                //check in order of times if the line change between previous mouse, current mouse and previous peg would wrap the next peg, stopping the first time it wouldnt
                let nextPegIndex = potentialWraps[tWraps[i].pwIndex].pegIndex;
                if (unwrappedThroughCircleIndex != null)
                {
                    if (nextPegIndex == unwrappedThroughCircleIndex || tWraps[i].t < tUnwrappedThroughCircle) continue;
                }
                
    
                let nextPegPos = this.getPegPos(nextPegIndex);
                let wrapData = isPointInTriangle(stringStartPos, prevStringEnd, currentStringEnd, nextPegPos);
    
                if (wrapData.isWrapped)
                {
                    csc.push(nextPegIndex, wrapData.isClockwise);
                    stringStartPos = nextPegPos;
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
        let startPegPos = this.getPegPos(this.getCurrentStringChain().getLastPegIndex());
        for (let i = 0; i < this.numPegs; i++)
        {
            let pPeg = this.getPegPos(i);
            
            let wrapData = isPointInTriangle(startPegPos, p1, p2, pPeg);
            if (wrapData.isWrapped)
            {
                potentialWraps.push({ pegIndex: i, isClockwise: wrapData.isClockwise });
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
            let startPegPos = this.getPegPos(cscpwCopy[cscpwCopy.length - 2].pegIndex);
            let pPeg = this.getPegPos(cscpwCopy[cscpwCopy.length - 1].pegIndex);
        
            let wrapData = isPointInTriangle(startPegPos, p1, p2, pPeg);
        
            if (wrapData.isWrapped && (wrapData.isClockwise != cscpwCopy[cscpwCopy.length - 1].isClockwise))
            {
                potentialUnwraps.push(cscpwCopy.pop());
            }
            else break;
        }

        return potentialUnwraps;
    }

    calculateDPThreshold()
    {
        //the value below which a line is considered to be crossing through the circle
        //dot product between [the normal of the circle at peg 0] and [the normalised vector from peg 0 to peg 1]
        let p0 = this.getPegPos(0);
        let p1 = this.getPegPos(1);
        let n0 = p0.normalize();
        let n10 = p1.sub(p0).normalize();
        let dot = n0.dot(n10);
        return dot * 1.01; //floating point precision my beloved
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
}