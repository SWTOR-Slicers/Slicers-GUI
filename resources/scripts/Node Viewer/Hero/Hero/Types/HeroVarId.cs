namespace Hero.Types
{
    using Hero;
    using System;

    public class HeroVarId : IComparable<string>, IComparable
    {
        public int nextId;
        public HeroAnyValue Value;
        public int VarId;

        public HeroVarId(int varID, HeroAnyValue value)
        {
            this.VarId = varID;
            this.Value = value;
        }

        public int CompareTo(string other)
        {
            if (this.Value.Type.Type == HeroTypes.String)
            {
                return (this.Value as HeroString).Text.CompareTo(other);
            }
            return 1;
        }

        public int CompareTo(object obj)
        {
            int result = 1;

            if (obj is HeroVarId)
            {
                HeroVarId id = obj as HeroVarId;
                result = this.Value.CompareTo(id.Value);
            }

            return result;
        }

        public override bool Equals(object obj)
        {
            bool result = false;

            if (obj is HeroVarId)
            {
                HeroVarId id = obj as HeroVarId;
                result = this.Value.Equals(id.Value);
            }

            return result;
        }

        public override int GetHashCode()
        {
            return Value.GetHashCode();
        }

        public static implicit operator HeroAnyValue(HeroVarId x)
        {
            return x.Value;
        }

        public override string ToString()
        {
            if (this.Value != null)
            {
                return this.Value.ToString();
            }
            return "null";
        }
    }
}

