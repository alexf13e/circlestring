class StringChain
{
    constructor(startIndex, startPos, colour)
    {
        this.colour = colour;
        this.pegWraps = [{ pegIndex: startIndex, isClockwise: true, wrapStart: null, wrapEnd: startPos }];
    }

    push(pegIndex, isClockwise, wrapStart, wrapEnd)
    {
        this.pegWraps.push({ pegIndex: pegIndex, isClockwise: isClockwise, wrapStart: wrapStart, wrapEnd: wrapEnd });
    }

    pop()
    {
        if (this.pegWraps.length > 0) return this.pegWraps.pop();
    }

    getFirstPegIndex()
    {
        return this.pegWraps[0].pegIndex;
    }

    getLastPegIndex()
    {
        return this.pegWraps[this.pegWraps.length - 1].pegIndex;
    }

    getLastPegIsClockwise()
    {
        return this.pegWraps[this.pegWraps.length - 1].isClockwise;
    }

    getLastPegWrapStart()
    {
        return this.pegWraps[this.pegWraps.length - 1].wrapStart;
    }

    getSecondLastPegWrapEnd()
    {
        return this.pegWraps[this.pegWraps.length - 2].wrapEnd;
    }

    setLastPegWrapEnd(wrapEnd)
    {
        this.pegWraps[this.pegWraps.length - 1].wrapEnd = wrapEnd;
    }

    getLength()
    {
        return this.pegWraps.length;
    }

    draw(context)
    {
        if (this.pegWraps.length < 2) return;

        setStringStyle(this.colour, stringOpacity);

        let pStart = this.pegWraps[0].wrapEnd;
        let pEnd;

        for (let i = 1; i < this.pegWraps.length; i++)
        {
            //for some reason, the drawn positions noticably budge when wrapping a new string when all being drawn on the same path...
            context.beginPath();
            ctxMain.moveTo(pStart.x, pStart.y)

            pEnd = this.pegWraps[i].wrapStart;
            ctxMain.lineTo(pEnd.x, pEnd.y);
            context.stroke();

            pStart = this.pegWraps[i].wrapEnd;
        }

    }
}