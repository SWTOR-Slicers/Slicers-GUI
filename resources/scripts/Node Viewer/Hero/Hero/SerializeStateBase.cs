namespace Hero
{
    using System;

    public class SerializeStateBase
    {
        public uint Count;
        public HeroTypes HeroType;
        protected uint m_0C;
        protected SerializeStateBase Next;
        public PackedStream_2 Stream;

        public SerializeStateBase(PackedStream_2 stream, HeroTypes heroType)
        {
            this.HeroType = heroType;
            this.Next = null;
            this.Stream = stream;
            this.m_0C = 0;
            this.Count = 0;
            this.Next = stream.State;
            stream.State = this;
        }

        public int ReadVariableId()
        {
            if (this.Stream.Flags[1] && (this.Stream.TransportVersion < 5))
            {
                ulong num;
                this.Stream.Read(out num);
                return (int) num;
            }
            return 0;
        }

        public void WriteVariableId(int variableId)
        {
            if (this.Stream.Flags[1])
            {
                this.Stream.Write((ulong) variableId);
            }
        }
    }
}

