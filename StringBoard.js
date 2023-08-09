
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
        this.stringChains.pop();
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