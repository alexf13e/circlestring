class StringChain
{
    constructor(startIndex, colour)
    {
        this.colour = colour;
        this.pegWraps = [{ pegIndex: startIndex, isClockwise: true, wrapStart: null, wrapEnd: null }];
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

    draw(context, preview)
    {
        if (preview) setStringStyle(this.colour, stringOpacityNoWrap);
        else setStringStyle(this.colour, stringOpacity);

        context.beginPath();
        let pegPos = board.getPegPos(this.pegWraps[0].pegIndex);
        context.arc(pegPos.x, pegPos.y, board.pegRadius, 0, TWO_PI);
        context.stroke();

        if (this.pegWraps.length < 2) return;

        let pStart = this.pegWraps[0].wrapEnd;
        let pEnd;

        for (let i = 1; i < this.pegWraps.length; i++)
        {
            let pw = this.pegWraps[i];

            //for some reason, the drawn positions noticably budge when wrapping a new string when all being drawn on the same path, so start a new one each loop
            context.beginPath();
            context.moveTo(pStart.x, pStart.y)

            pEnd = pw.wrapStart;
            context.lineTo(pEnd.x, pEnd.y);
            context.stroke();
            
            if (i < this.pegWraps.length - 1)
            {
                pegPos = board.getPegPos(pw.pegIndex);
                let dStart = pw.wrapStart.sub(pegPos);
                let aStart = Math.atan2(dStart.y, dStart.x);
                let dEnd = pw.wrapEnd.sub(pegPos);
                let aEnd = Math.atan2(dEnd.y, dEnd.x);

                context.beginPath();
                context.arc(pegPos.x, pegPos.y, board.pegRadius, aStart, aEnd, !pw.isClockwise);
                context.stroke();
            }
            
            pStart = this.pegWraps[i].wrapEnd;
        }

        if (this != board.getCurrentStringChain())
        {
            pegPos = board.getPegPos(this.getLastPegIndex());
            context.beginPath();
            context.arc(pegPos.x, pegPos.y, board.pegRadius, 0, TWO_PI);
            context.stroke();
        }
    }
}
