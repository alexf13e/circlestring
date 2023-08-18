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

    getSecondLastPegIndex()
    {
        return this.pegWraps[this.pegWraps.length - 2].pegIndex;
    }

    getLastPegIsClockwise()
    {
        return this.pegWraps[this.pegWraps.length - 1].isClockwise;
    }

    getLastPegWrapEnd()
    {
        return this.pegWraps[this.pegWraps.length - 1].wrapEnd;
    }

    setLastPegWrapEnd(wrapEnd)
    {
        this.pegWraps[this.pegWraps.length - 1].wrapEnd = wrapEnd;
    }

    getLength()
    {
        return this.pegWraps.length;
    }

    getPegWrapsCopy()
    {
        return [...this.pegWraps];
    }

    unwrap(pegWrap)
    {
        this.pegWraps.splice(this.pegWraps.indexOf(pegWrap), 1);
    }

    getMostRecentWrapOfPegAndAlsoThePegBeforeItIGuess(index)
    {
        for (let i = this.pegWraps.length - 1; i >= 0; i--)
        {
            if (this.pegWraps[i].pegIndex == index)
            {
                return { toUnwrap: this.pegWraps[i], pegBefore: this.pegWraps[i-1] };
            }
        }

        return null;
    }

    draw(context)
    {
        if (this.pegWraps.length < 2) return;

        setStringStyle(this.colour, stringOpacity);

        let pStart = this.pegWraps[0].wrapEnd;
        let pEnd;

        context.beginPath();
        for (let i = 1; i < this.pegWraps.length; i++)
        {
            ctxMain.moveTo(pStart.x, pStart.y)

            pEnd = this.pegWraps[i].wrapStart;
            ctxMain.lineTo(pEnd.x, pEnd.y);

            pStart = this.pegWraps[i].wrapEnd;
        }

        context.stroke();
    }
}