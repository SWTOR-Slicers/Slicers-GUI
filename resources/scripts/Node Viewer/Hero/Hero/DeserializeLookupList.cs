namespace Hero
{
    using Hero.Types;
    using System;
    using System.IO;
    using System.Runtime.InteropServices;

    public class DeserializeLookupList : SerializeStateBase
    {
        public HeroType indexerType;
        public bool m_30;
        public HeroType valueType;

        public DeserializeLookupList(PackedStream_2 stream, int valueState, HeroType defaultIndexerType) : base(stream, HeroTypes.LookupList)
        {
            this.valueType = defaultIndexerType;
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
                if (num != 0L)
                {
                    this.indexerType = new HeroType((HeroTypes) ((int) num));
                }
            }
            if (!this.GetValueType(ref this.valueType))
            {
                throw new InvalidDataException("Error getting type");
            }
            stream.Read(out this.m_0C, out this.Count);
            if ((stream.Style == 8) || (stream.Style == 10))
            {
                this.m_30 = (base.Count & 1) == 1;
                base.Count = base.Count >> 1;
            }
        }

        public bool GetKey(out HeroAnyValue key, out int variableId)
        {
            if ((this.indexerType.Type == HeroTypes.String) || (this.indexerType.Type == HeroTypes.None))
            {
                return this.GetKeyString(out key, out variableId);
            }
            return this.GetKeyInt(out key, out variableId);
        }

        public bool GetKeyInt(out HeroAnyValue key, out int variableId)
        {
            key = HeroAnyValue.Create(this.indexerType);
            if (base.Stream.TransportVersion > 1)
            {
                if (base.Stream.Peek() == 210)
                {
                    base.Stream.ReadByte();
                    HeroAnyValue value2 = HeroAnyValue.Create(new HeroType(HeroTypes.String));
                    value2.Deserialize(base.Stream);
                    if (this.indexerType.Type != HeroTypes.Enum)
                    {
                        if (this.indexerType.Type != HeroTypes.Integer)
                        {
                            if (this.indexerType.Type != HeroTypes.Id)
                            {
                                throw new InvalidDataException("Invalid key type");
                            }
                            (key as HeroID).ID = Convert.ToUInt64((value2 as HeroString).Text);
                        }
                        else
                        {
                            (key as HeroInt).Value = Convert.ToInt64((value2 as HeroString).Text);
                        }
                    }
                    else
                    {
                        (key as HeroEnum).Value = Convert.ToUInt64((value2 as HeroString).Text);
                    }
                }
                else
                {
                    ulong num;
                    base.Stream.Read(out num);
                    if (this.indexerType.Type == HeroTypes.Enum)
                    {
                        (key as HeroEnum).Value = num;
                    }
                    else if (this.indexerType.Type == HeroTypes.Integer)
                    {
                        (key as HeroInt).Value = (long) num;
                    }
                    else
                    {
                        if (this.indexerType.Type != HeroTypes.Id)
                        {
                            throw new InvalidDataException("Invalid key type");
                        }
                        (key as HeroID).Id = num;
                    }
                    key.hasValue = true;
                }
            }
            else if (base.Stream.Peek() == 0x89)
            {
                HeroAnyValue value3 = HeroAnyValue.Create(new HeroType(HeroTypes.String));
                value3.Deserialize(base.Stream);
                if (this.indexerType.Type != HeroTypes.Enum)
                {
                    if (this.indexerType.Type != HeroTypes.Integer)
                    {
                        if (this.indexerType.Type != HeroTypes.Id)
                        {
                            throw new InvalidDataException("Invalid key type");
                        }
                        (key as HeroID).Id = Convert.ToUInt64((value3 as HeroString).Text);
                    }
                    else
                    {
                        (key as HeroInt).Value = Convert.ToInt64((value3 as HeroString).Text);
                    }
                }
                else
                {
                    (key as HeroEnum).Value = Convert.ToUInt64((value3 as HeroString).Text);
                }
            }
            else
            {
                ulong num2;
                base.Stream.Read(out num2);
                if (this.indexerType.Type == HeroTypes.Enum)
                {
                    (key as HeroEnum).Value = num2;
                }
                else if (this.indexerType.Type == HeroTypes.Integer)
                {
                    (key as HeroInt).Value = (long) num2;
                }
                else
                {
                    if (this.indexerType.Type != HeroTypes.Id)
                    {
                        throw new InvalidDataException("Invalid key type");
                    }
                    (key as HeroID).Id = num2;
                }
                key.hasValue = true;
            }
            variableId = base.ReadVariableId();
            return true;
        }

        public bool GetKeyString(out HeroAnyValue key, out int variableId)
        {
            key = HeroAnyValue.Create(new HeroType(HeroTypes.String));
            if (base.Stream.TransportVersion > 1)
            {
                if (base.Stream.Peek() == 210)
                {
                    base.Stream.ReadByte();
                    key.Deserialize(base.Stream);
                }
                else
                {
                    ulong num;
                    base.Stream.Read(out num);
                    (key as HeroString).Text = string.Format("{0}", num);
                }
            }
            else if (base.Stream.Peek() == 0x89)
            {
                key.Deserialize(base.Stream);
            }
            else
            {
                ulong num2;
                base.Stream.Read(out num2);
                (key as HeroString).Text = string.Format("{0}", num2);
            }
            variableId = base.ReadVariableId();
            return true;
        }

        public bool GetValueType(ref HeroType type)
        {
            if (base.Stream.Flags[0])
            {
                ulong num;
                base.Stream.Read(out num);
                type = new HeroType((HeroTypes) ((int) num));
            }
            return true;
        }
    }
}

