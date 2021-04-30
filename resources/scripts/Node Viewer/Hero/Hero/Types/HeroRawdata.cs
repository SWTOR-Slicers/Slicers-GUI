namespace Hero.Types
{
    using Hero;
    using System;

    public class HeroRawdata : HeroAnyValue
    {
        public byte[] Data;

        public HeroRawdata(byte[] data)
        {
            base.Type = new HeroType(HeroTypes.Rawdata);
            base.hasValue = true;
            this.Data = data;
        }

        public override void Deserialize(PackedStream_2 stream)
        {
            base.hasValue = true;
            stream.Read(out this.Data);
        }

        public override void Serialize(PackedStream_2 stream)
        {
            stream.Write(this.Data);
        }

        public override string ValueText
        {
            get
            {
                return "--Data--";
            }
        }
    }
}

