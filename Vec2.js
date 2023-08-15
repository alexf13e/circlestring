class Vec2
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }

    add(vec)
    {
        //component-wise addition
        return new Vec2(this.x + vec.x, this.y + vec.y);
    }

    sub(vec)
    {
        //component-wise subtraction
        return new Vec2(this.x - vec.x, this.y - vec.y);
    }

    mul(scalar)
    {
        //multiply vector by scalar
        return new Vec2(this.x * scalar, this.y * scalar);
    }

    dot(vec)
    {
        return this.x * vec.x + this.y * vec.y;
    }

    cross(vec)
    {
        return this.x * vec.y - this.y * vec.x;
    }

    length()
    {
        return Math.sqrt(this.dot(this));
    }

    normalize()
    {
        return new Vec2(this.x / this.length(), this.y / this.length());
    }

    perp()
    {
        return new Vec2(-this.y, this.x);
    }

    set(vec)
    {
        this.x = vec.x;
        this.y = vec.y;
    }
}