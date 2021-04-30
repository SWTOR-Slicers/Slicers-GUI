namespace Hero
{
    using System;

    public class SerializeList : SerializeStateBase
    {
        public int index;
        public HeroTypes listType;

        public SerializeList(PackedStream_2 stream, int valueState, HeroTypes listType, int Count) : base(stream, HeroTypes.List)
        {
            this.index = 0;
            if (stream.Flags[4])
            {
                throw new NotImplementedException();
            }
            if (stream.Flags[0])
            {
                ulong num = (ulong) ((long) listType);
                stream.Write(num);
            }
            if ((stream.Style == 8) || (stream.Style == 10))
            {
                stream.Write(Count * 2, Count * 2);
            }
            else
            {
                stream.Write(Count, Count);
            }
        }

        public void SetFieldIndex(int index, int variableId)
        {
            this.index++;
            if (base.Stream.Flags[2])
            {
                base.Stream.Write((ulong) index);
                this.index = index;
            }
            else if (this.index != index)
            {
                throw new SerializingException("Wrong index");
            }
            base.WriteVariableId(variableId);
        }
    }
}

