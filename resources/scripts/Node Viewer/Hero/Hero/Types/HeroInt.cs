namespace Hero.Types
{
    using Hero;
    using System;
    using System.Runtime.InteropServices;

    public class HeroInt : HeroAnyValue, IComparable<HeroInt>, IComparable
    {
        public long Value;

        public HeroInt(long value = 0L)
        {
            base.Type = new HeroType(HeroTypes.Integer);
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

        public override bool Equals(object obj)
        {
            bool result = false;

            if (obj is HeroInt)
            {
                HeroInt i = obj as HeroInt;
                result = Value.Equals(i.Value);
            }

            return result;
        }

        public override int GetHashCode()
        {
            return Value.GetHashCode();
        }

        public int CompareTo(HeroInt other)
        {
            return Value.CompareTo(other.Value);
        }

        public override int CompareTo(object obj)
        {
            int result = 1;

            if (obj is HeroInt)
            {
                HeroInt v = obj as HeroInt;
                result = Value.CompareTo(v.Value);
            }

            return result;
        }
    }
}

