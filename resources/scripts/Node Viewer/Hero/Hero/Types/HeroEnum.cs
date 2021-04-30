namespace Hero.Types
{
    using Hero;
    using Hero.Definition;
    using System;
    using System.Runtime.InteropServices;

    public class HeroEnum : HeroAnyValue
    {
        public ulong Value;

        public HeroEnum()
        {
            base.Type = new HeroType(HeroTypes.Enum);
            base.hasValue = false;
        }

        public HeroEnum(HeroType type = null, ulong value = 0L)
        {
            base.Type = new HeroType(HeroTypes.Enum);
            if (type != null)
            {
                base.Type.Id = type.Id;
            }
            base.hasValue = true;
            this.Value = value;
        }

        public override void Deserialize(PackedStream_2 stream)
        {
            stream.Read(out this.Value);
        }

        public override void Serialize(PackedStream_2 stream)
        {
            stream.Write(this.Value);
        }

        public override string ValueText
        {
            get
            {
                if (this.Value == 0L)
                {
                    return string.Format("not set", new object[0]);
                }
                int num = (int) (this.Value - ((ulong) 1L));
                if (base.Type.Id != null)
                {
                    HeroEnumDef definition = base.Type.Id.Definition as HeroEnumDef;
                    if ((definition != null) && (num < definition.Values.Count))
                    {
                        return definition.Values[num];
                    }
                }
                return string.Format("{0}", num);
            }
        }
    }
}

