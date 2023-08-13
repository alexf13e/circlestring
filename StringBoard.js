
class StringBoard
{
    constructor(boardRadius, numPegs, pegRadius)
    {
        this.boardRadius = boardRadius;
        this.numPegs = numPegs;
        this.pegRadius = pegRadius;
        this.stringChains = [];
        this.currentStringChainIndex = 0;
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

        return { x: x, y: y };
    }

    getNearestPeg(pos)
    {
        let posTheta = Math.atan2(pos.y, pos.x);
        if (posTheta < 0) posTheta += TWO_PI;

        let pegDeltaTheta = TWO_PI / this.numPegs;
        let prevPegIndex = Math.floor(posTheta / pegDeltaTheta);
        let nextPegIndex = Math.ceil(posTheta / pegDeltaTheta) % this.numPegs;

        let prevPegTheta = prevPegIndex * pegDeltaTheta;
        let nextPegTheta = nextPegIndex * pegDeltaTheta;

        let nearestPegTheta, nearestPegIndex;
        if (posTheta - prevPegTheta < nextPegTheta - posTheta)
        {
            //prev is closer
            nearestPegTheta = prevPegTheta;
            nearestPegIndex = prevPegIndex;
        }
        else
        {
            //next is closer
            nearestPegTheta = nextPegTheta;
            nearestPegIndex = nextPegIndex;
        }

        return { x: this.boardRadius * Math.cos(nearestPegTheta), y: this.boardRadius * Math.sin(nearestPegTheta), index: nearestPegIndex };
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
        let csc = this.getCurrentStringChain();
        let potentialWraps = this.findPotentialWraps(prevStringEnd, currentStringEnd);
        let potentialUnwraps = this.findPotentialUnwraps(prevStringEnd, currentStringEnd);
        let tWraps = [];
        let tUnwraps = [];
        let stringStart = this.getPegPos(csc.getLastPegIndex());

        //figure out the order wraps and unwraps happened
        let prevInsideCircle = prevStringEnd.x * prevStringEnd.x + prevStringEnd.y * prevStringEnd.y < this.boardRadius * this.boardRadius;
        let currentInsideCircle = currentStringEnd.x * currentStringEnd.x + currentStringEnd.y * currentStringEnd.y < this.boardRadius * this.boardRadius;
        let enteredCircle = (!prevInsideCircle && currentInsideCircle);
        let exitedCircle = (prevInsideCircle && !currentInsideCircle);

        let deltaP;
        if (enteredCircle)
        {
            //line to check along is from previous attached peg to previous mouse
            deltaP = { x: prevStringEnd.x - stringStart.x, y: prevStringEnd.y - stringStart.y };
        }
        else// if (exitedCircle || !(enteredCircle || exitedCircle))
        {
            //line to check along is from prevmouse to currentmouse
            deltaP = { x: currentStringEnd.x - prevStringEnd.x, y: currentStringEnd.y - prevStringEnd.y };
        }
        

        let lenDeltaP = Math.sqrt(deltaP.x * deltaP.x + deltaP.y * deltaP.y);
        let normalisedDeltaP = { x: deltaP.x / lenDeltaP, y: deltaP.y / lenDeltaP };

        for (let i = 0; i < potentialWraps.length; i++)
        {
            tWraps.push({ pwIndex: i, t: this.findWrapTime(normalisedDeltaP, potentialWraps[i].pegIndex) });
        }

        for (let i = 0; i < potentialUnwraps.length; i++)
        {
            tUnwraps.push({ puIndex: i, t: this.findWrapTime(normalisedDeltaP, potentialUnwraps[i].pegIndex) });
        }

        //sort wraps/unwraps by their time
        tWraps.sort((a, b) => a.t - b.t);
        tUnwraps.sort((a, b) => a.t - b.t);

        //do unwraps which were before the first wrap
        for (let i = 0; i < potentialUnwraps.length; i++)
        {
            if (tWraps.length > 0 && tUnwraps[i].t > tWraps[0].t) break;

            csc.unwrap(potentialUnwraps[i]);
        }

        //do wraps
        if (exitedCircle && potentialWraps.length > 0)
        {
            //want furthest from start
            let index = tWraps[tWraps.length - 1].pwIndex;
            csc.push(potentialWraps[index].pegIndex, potentialWraps[index].isClockwise);
        }
        else
        {

            for (let i = 0; i < tWraps.length; i++)
            {
                //check in order of times if the line change between previous mouse, current mouse and previous peg would wrap the next peg, stopping the first time it wouldnt
                let nextPegIndex = potentialWraps[tWraps[i].pwIndex].pegIndex;
                let nextPegPos = this.getPegPos(nextPegIndex);
                let wrapData = isPointInTriangle(stringStart, prevStringEnd, currentStringEnd, nextPegPos);

                if (wrapData.isWrapped)
                {
                    csc.push(nextPegIndex, wrapData.isClockwise);
                    stringStart = nextPegPos;
                }
                else
                {
                    break;
                }
            }
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

    findWrapTime(normalisedDeltaP, pegIndex)
    {
        let pPeg = this.getPegPos(pegIndex);
        let t = pPeg.x * normalisedDeltaP.x + pPeg.y * normalisedDeltaP.y;

        return t;
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