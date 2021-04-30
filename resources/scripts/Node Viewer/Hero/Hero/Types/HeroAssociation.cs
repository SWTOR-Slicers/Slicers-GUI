namespace Hero.Types
{
    using Hero;
    using System;
    using System.Runtime.InteropServices;

    public class HeroAssociation : HeroAnyValue
    {
        public HeroAssociation(HeroType type = null)
        {
            base.Type = new HeroType(HeroTypes.Association);
            if (type != null)
            {
                base.Type.Id = type.Id;
            }
            base.hasValue = false;
        }

        public override string ValueText
        {
            get
            {
                return "";
            }
        }
    }
}

