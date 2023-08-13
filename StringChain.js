class StringChain
{
    constructor(startIndex, colour)
    {
        this.colour = colour;
        this.pegWraps = [{ pegIndex: startIndex, isClockwise: true }];
    }

    push(pegIndex, isClockwise)
    {
        this.pegWraps.push({pegIndex: pegIndex, isClockwise: isClockwise});
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

    getLastPegDirection()
    {
        return this.pegWraps[this.pegWraps.length - 1].isClockwise;
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

    draw(context)
    {
        if (this.pegWraps.length < 2) return;

        setStringStyle(this.colour, stringOpacity);

        let pi = this.pegWraps[0].pegIndex;
        let pp = board.getPegPos(pi);

        context.beginPath();
        context.moveTo(pp.x, pp.y);
        for (let i = 1; i < this.pegWraps.length; i++)
        {
            pi = this.pegWraps[i].pegIndex;
            pp = board.getPegPos(pi);
            ctxMain.lineTo(pp.x, pp.y);
        }

        context.stroke();
    }
}