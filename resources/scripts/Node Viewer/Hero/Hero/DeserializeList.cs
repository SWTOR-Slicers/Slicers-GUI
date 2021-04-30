namespace Hero
{
    using System;
    using System.IO;
    using System.Runtime.InteropServices;

    public class DeserializeList : SerializeStateBase
    {
        public uint index;
        public HeroTypes listType;
        public bool m_30;

        public DeserializeList(PackedStream_2 stream, int valueState) : base(stream, HeroTypes.List)
        {
            this.index = 0;
            this.m_30 = false;
            if (stream.Flags[4])
            {
                if (base.Next == null)
                {
                    throw new InvalidDataException("Only a HeroClass can be the root container type");
                }
                throw new NotImplementedException();
            }
            if (valueState != 1)
            {
                throw new InvalidDataException("Invalid value state");
            }
            if (stream.Flags[0])
            {
                ulong num;
                stream.Read(out num);
                this.listType = (HeroTypes) ((int) num);
            }
            stream.Read(out this.m_0C, out this.Count);
            if ((stream.Style == 8) || (stream.Style == 10))
            {
                this.m_30 = (base.Count & 1) == 1;
                base.Count = base.Count >> 1;
            }
        }

        public void GetFieldIndex(out uint index, out bool b, out int variableId)
        {
            this.index++;
            if (this.m_30)
            {
                ulong num;
                base.Stream.Read(out num);
                b = (num & ((ulong) 1L)) == 1L;
                index = (uint) (num >> 1);
            }
            else
            {
                b = false;
                if (base.Stream.Flags[2])
                {
                    ulong num2;
                    base.Stream.Read(out num2);
                    index = (uint) num2;
                }
                else
                {
                    index = this.index;
                }
            }
            variableId = base.ReadVariableId();
        }
    }
}

