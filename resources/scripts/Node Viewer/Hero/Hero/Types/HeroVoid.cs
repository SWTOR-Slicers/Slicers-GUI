namespace Hero.Types
{
    using Hero;
    using System;

    public class HeroVoid : HeroAnyValue
    {
        public HeroVoid()
        {
            base.Type = new HeroType(HeroTypes.None);
        }
    }
}

