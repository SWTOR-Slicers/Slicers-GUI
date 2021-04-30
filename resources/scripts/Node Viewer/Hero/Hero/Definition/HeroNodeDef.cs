namespace Hero.Definition
{
    using Hero;
    using Hero.Types;
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Text;

    public class HeroNodeDef : HeroDefinition
    {
        public ushort _14;
        public ushort _16;
        public ushort _2A;
        public byte _2D;
        public DefinitionId baseClass;
        public List<DefinitionId> glomClasses;
        public List<DefinitionId> glomClasses2;
        protected bool isProto;
        public byte[] serializedData;
        public byte streamStyle;
        protected VariableList variables;

        public HeroNodeDef(OmegaStream stream)
        {
            base.Type = HeroDefinition.Types.Node;
            stream.CheckResourceHeader(0x544f5250, 2, 2);
            base.Id = stream.ReadULong();
            base.Name = stream.ReadString();
            base.Description = stream.ReadString();
            stream.ReadUInt();
            stream.ReadUInt();
            this.baseClass = new DefinitionId(stream.ReadULong());
            if (stream.TransportVersion < 5)
            {
                stream.ReadUInt();
            }
            this.glomClasses = new List<DefinitionId>();
            int num = stream.ReadInt();
            for (int i = 0; i < num; i++)
            {
                this.glomClasses.Add(new DefinitionId(stream.ReadULong()));
            }
            stream.ReadByte();
            if (stream.ReadUShort() >= 3)
            {
                this.streamStyle = stream.ReadByte();
            }
            uint length = stream.ReadUInt();
            this.serializedData = stream.ReadBytes(length);
            this.isProto = true;
        }

        public HeroNodeDef(byte[] data, int version) : base(data, version)
        {
            ushort num;
            ushort num2;
            ushort num3 = 0;
            ushort num4 = 0;
            if (version == 1)
            {
                this._14 = BitConverter.ToUInt16(base.Data, 20);
                this._16 = BitConverter.ToUInt16(base.Data, 0x16);
                this.baseClass = new DefinitionId(BitConverter.ToUInt64(base.Data, 0x18));
                num = BitConverter.ToUInt16(base.Data, 0x20);
                num2 = BitConverter.ToUInt16(base.Data, 0x22);
            }
            else
            {
                if (version != 2)
                {
                    throw new InvalidDataException("Invalid version");
                }
                this.baseClass = new DefinitionId(BitConverter.ToUInt64(base.Data, 0x18));
                this._14 = BitConverter.ToUInt16(base.Data, 0x20);
                this._16 = BitConverter.ToUInt16(base.Data, 0x22);
                num = BitConverter.ToUInt16(base.Data, 0x24);
                num2 = BitConverter.ToUInt16(base.Data, 0x26);
                num3 = BitConverter.ToUInt16(base.Data, 0x2a);
                num4 = BitConverter.ToUInt16(base.Data, 0x2c);
            }
            this.glomClasses = new List<DefinitionId>();
            for (ushort i = 0; i < num; i = (ushort) (i + 1))
            {
                this.glomClasses.Add(new DefinitionId(BitConverter.ToUInt64(base.Data, num2 + (8 * i))));
            }
            this.glomClasses2 = new List<DefinitionId>();
            for (ushort j = 0; j < num3; j = (ushort) (j + 1))
            {
                this.glomClasses2.Add(new DefinitionId(BitConverter.ToUInt64(base.Data, num4 + (8 * j))));
            }
            this.isProto = false;
        }

        public void Serialize()
        {
            this.variables = new VariableList();
            if (!this.isProto)
            {
                int num;
                base.Decompress();
                if (base.version == 1)
                {
                    num = 0x24;
                }
                else
                {
                    num = 40;
                }
                uint num2 = BitConverter.ToUInt32(base.Data, num);
                ushort num3 = BitConverter.ToUInt16(base.Data, num + 4);
                this.serializedData = new byte[num2];
                Array.Copy(base.Data, (long) num3, this.serializedData, 0L, (long) num2);
                this._2A = BitConverter.ToUInt16(base.Data, num + 6);
                this.streamStyle = base.Data[num + 8];
                this._2D = (byte) (base.Data[num + 9] & 3);
            }
            if (this.serializedData.Length != 0)
            {
                byte[] bytes = Encoding.ASCII.GetBytes("azalie");
                byte index = 0;
                for (int i = 0; i < this.serializedData.Length; i++)
                {
                    if ((bytes[index] == this.serializedData[i]) || (bytes[index] == ((this.serializedData[i] + 0x61) - 0x41)))
                    {
                        index = (byte) (index + 1);
                        if (index != bytes.Length)
                        {
                            continue;
                        }
                        Console.WriteLine(base.Name);
                        break;
                    }
                    index = 0;
                }
                PackedStream_2 stream = new PackedStream_2(this.streamStyle, this.serializedData);
                DeserializeClass class2 = new DeserializeClass(stream, 1);
                for (uint j = 0; j < class2.Count; j++)
                {
                    ulong num7;
                    int num10;
                    uint num8 = 0;
                    int variableId = 0;
                    class2.ReadFieldData(out num7, ref num8, ref variableId, out num10);
                    if (num10 != 2)
                    {
                        HeroType fieldType = new HeroType((HeroTypes) num8);
                        DefinitionId field = new DefinitionId(num7);
                        if (field.Definition != null)
                        {
                            HeroFieldDef definition = field.Definition as HeroFieldDef;
                            fieldType = definition.FieldType;
                        }
                        HeroAnyValue value2 = HeroAnyValue.Create(fieldType);
                        value2.Deserialize(stream);
                        this.Variables.Add(new Variable(field, variableId, value2));
                    }
                }
            }
        }

        public override string ToString()
        {
            return ("Node " + base.Name);
        }

        public VariableList Variables
        {
            get
            {
                if (this.variables == null)
                {
                    this.Serialize();
                }
                return this.variables;
            }
        }
    }
}

