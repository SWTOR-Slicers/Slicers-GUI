namespace Hero.Types
{
    using Hero;
    using System;
    using System.Runtime.InteropServices;

    public class HeroTimeinterval : HeroAnyValue
    {
        public long Value;

        public HeroTimeinterval(long value = 0L)
        {
            base.Type = new HeroType(HeroTypes.Timeinterval);
            base.hasValue = true;
            this.Value = value;
        }

        public override void Deserialize(PackedStream_2 stream)
        {
            base.hasValue = true;
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
                return string.Format("{0}", this.Value);
            }
        }
    }
}

