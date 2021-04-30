namespace Hero.Types
{
    using Hero;
    using System;

    public class HeroTimer : HeroAnyValue
    {
        public long _00;
        public uint _08;
        public bool _0C;
        public long _10;
        public long _18;
        public long _20;
        public long _28;
        public long _30;
        public ulong _38;
        public long _40;
        public long _48;

        public HeroTimer()
        {
            base.Type = new HeroType(HeroTypes.Timer);
        }

        public override void Deserialize(PackedStream_2 stream)
        {
            ulong num;
            long num2;
            base.hasValue = true;
            stream.Read(out this._00);
            stream.Read(out num);
            stream.Read(out this._0C);
            stream.Read(out this._10);
            stream.Read(out this._18);
            stream.Read(out this._20);
            stream.Read(out this._28);
            stream.Read(out this._30);
            stream.Read(out num2);
            stream.Read(out this._38);
            if (num2 == 0xdeadbeefL)
            {
                stream.Read(out this._40);
                stream.Read(out this._48);
            }
            this._08 = (uint) num;
        }

        public override void Serialize(PackedStream_2 stream)
        {
            ulong num = this._08;
            long num2 = 0xdeadbeefL;
            stream.Write(this._00);
            stream.Write(num);
            stream.Write(this._0C);
            stream.Write(this._10);
            stream.Write(this._18);
            stream.Write(this._20);
            stream.Write(this._28);
            stream.Write(this._30);
            stream.Write(num2);
            stream.Write(this._38);
            if (num2 == 0xdeadbeefL)
            {
                stream.Write(this._40);
                stream.Write(this._48);
            }
        }

        public override string ValueText
        {
            get
            {
                return "--Data--";
            }
        }

        public enum State
        {
            Off = 1,
            On = 2,
            Paused = 3
        }
    }
}

