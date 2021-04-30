namespace Hero
{
    using System;
    using System.IO;
    using System.Runtime.InteropServices;

    public class DeserializeClass : SerializeStateBase
    {
        public ulong m_28;
        public int m_30;
        public int m_34;
        public object m_38;

        public DeserializeClass(PackedStream_2 stream, int valueState) : base(stream, HeroTypes.Class)
        {
            this.m_28 = 0L;
            this.m_30 = this.m_34 = 0;
            this.m_38 = null;
            if (stream.Flags[4])
            {
                if (valueState == 0)
                {
                    return;
                }
                if (valueState != 1)
                {
                    throw new InvalidDataException("Invalid value state");
                }
                if (base.Next == null)
                {
                    ulong num;
                    base.Stream.Read(out num);
                    throw new NotImplementedException();
                }
                throw new NotImplementedException();
            }
            if (valueState != 1)
            {
                throw new InvalidDataException("Invalid value state");
            }
            stream.Read(out this.m_0C, out this.Count);
        }

        public void ReadFieldData(out ulong fieldId, ref uint type, ref int variableId, out int d)
        {
            long num;
            switch (base.Stream.Style)
            {
                case 7:
                    throw new InvalidDataException("Unable to get field id");

                case 8:
                    throw new InvalidDataException("Unable to get field id");

                case 9:
                case 10:
                    throw new InvalidDataException("Unable to get field id");
            }
            base.Stream.Read(out num);
            fieldId = this.m_28 + ((ulong) num);
            if (base.Stream.Flags[0])
            {
                ulong num2;
                base.Stream.Read(out num2);
                type = (uint) num2;
            }
            variableId = base.ReadVariableId();
            d = 1;
            this.m_28 = fieldId;
        }
    }
}

