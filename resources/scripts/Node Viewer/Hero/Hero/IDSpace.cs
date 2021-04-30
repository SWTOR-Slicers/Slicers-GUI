namespace Hero
{
    using Hero.Types;
    using System;
    using System.Collections.Generic;

    public class IDSpace
    {
        protected ulong current;
        protected ulong end;
        protected Dictionary<ulong, HeroAnyValue> objects;
        protected ulong start;

        public IDSpace(ulong Start, ulong End)
        {
            this.start = Start;
            this.end = End;
            this.current = Start;
            this.objects = new Dictionary<ulong, HeroAnyValue>();
        }

        public void Add(HeroAnyValue obj)
        {
            if ((obj.ID < this.start) || (obj.ID >= this.end))
            {
                throw new Exception("Object has a wrong ID for this space");
            }
            this.objects[obj.ID] = obj;
        }

        public ulong Get()
        {
            if (this.current == this.end)
            {
                throw new Exception("ID space exhausted");
            }
            ulong current = this.current;
            this.current += (ulong) 1L;
            return current;
        }
    }
}

