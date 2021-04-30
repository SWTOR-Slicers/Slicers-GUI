namespace Hero
{
    using Hero.Types;
    using System;

    public class SerializeLookupList : SerializeStateBase
    {
        public HeroTypes indexerType;
        public bool m_30;
        public HeroTypes valueType;

        public SerializeLookupList(PackedStream_2 stream, int valueState, HeroType type, int Count) : base(stream, HeroTypes.LookupList)
        {
            this.m_30 = false;
            if (stream.Flags[4])
            {
                throw new NotImplementedException();
            }
            if (stream.Flags[0])
            {
                stream.Write((ulong) ((long) type.Indexer.Type));
            }
            this.SetValueType(type.Values.Type);
            if ((stream.Style == 8) || (stream.Style == 10))
            {
                stream.Write(Count * 2, Count * 2);
            }
            else
            {
                stream.Write(Count, Count);
            }
        }

        public void SetKey(HeroAnyValue key, int variableId)
        {
            switch (key.Type.Type)
            {
                case HeroTypes.Id:
                    this.SetKeyInt((key as HeroID).Id, variableId);
                    return;

                case HeroTypes.Integer:
                    this.SetKeyInt((ulong) (key as HeroInt).Value, variableId);
                    return;

                case HeroTypes.Enum:
                    this.SetKeyInt((key as HeroEnum).Value, variableId);
                    return;

                case HeroTypes.String:
                    this.SetKeyString((key as HeroString).Text, variableId);
                    return;
            }
            throw new NotImplementedException();
        }

        public void SetKeyInt(ulong key, int variableId)
        {
            base.Stream.Write(key);
            base.Stream.Write((long) variableId);
        }

        public void SetKeyString(string key, int variableId)
        {
            if (base.Stream.TransportVersion > 1)
            {
                base.Stream.WriteByte(210);
                base.Stream.Write(key);
            }
            else
            {
                base.Stream.WriteByte(0x89);
                base.Stream.Write(key);
            }
            base.WriteVariableId(variableId);
        }

        public void SetValueType(HeroTypes type)
        {
            if (base.Stream.Flags[0])
            {
                base.Stream.Write((ulong) ((long) type));
            }
        }
    }
}

