namespace Hero.Types
{
    using Hero;
    using System;
    using System.Runtime.InteropServices;

    public class HeroGuid : HeroAnyValue
    {
        public ulong GUID;

        public HeroGuid(ulong GUID = 0L)
        {
            base.Type = new HeroType(HeroTypes.Guid);
            base.hasValue = true;
            this.GUID = GUID;
        }

        public override void Deserialize(PackedStream_2 stream)
        {
            base.hasValue = true;
            stream.Read(out this.GUID);
        }

        public override void Serialize(PackedStream_2 stream)
        {
            stream.Write(this.GUID);
        }

        public override string ValueText
        {
            get
            {
                return string.Format("{0:X8}", this.GUID);
            }
        }
    }
}

