namespace Hero.Types
{
    using Hero;
    using System;
    using System.Runtime.InteropServices;

    public class HeroDate : HeroAnyValue
    {
        public long Value;

        public HeroDate(long value = 0L)
        {
            base.Type = new HeroType(HeroTypes.Date);
            base.hasValue = true;
            this.Value = value;
        }

        public override void Deserialize(PackedStream_2 stream)
        {
            base.hasValue = true;
            stream.Read(out this.Value);
            if (this.Value == 0L)
            {
                this.Value = -2305320741190498156L;
            }
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

