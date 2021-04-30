namespace Hero.Definition
{
    using ICSharpCode.SharpZipLib.Zip.Compression;
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Text;

    public class HeroDefinition
    {
        protected byte[] Data;
        public string Description;
        public int DomType;
        public ulong Id;
        public string Name;
        public Types Type;
        protected int version;

        protected HeroDefinition()
        {
        }

        protected HeroDefinition(byte[] data, int version)
        {
            this.Data = data;
            this.version = version;
            if (version == 1)
            {
                this.DomType = (BitConverter.ToUInt16(this.Data, 4) >> 1) & 3;
                this.Type = ((Types) (BitConverter.ToUInt16(this.Data, 4) >> 3)) & ((Types) 15);
                this.Name = this.GetString(BitConverter.ToUInt16(this.Data, 0x10));
                this.Description = this.GetString(BitConverter.ToUInt16(this.Data, 0x12));
                this.Id = BitConverter.ToUInt64(this.Data, 8);
            }
            else if (version == 2)
            {
                this.DomType = (BitConverter.ToUInt16(this.Data, 0x10) >> 1) & 3;
                this.Type = ((Types) (BitConverter.ToUInt16(this.Data, 0x10) >> 3)) & ((Types) 15);
                this.Name = this.GetString(BitConverter.ToUInt16(this.Data, 20));
                this.Description = this.GetString(BitConverter.ToUInt16(this.Data, 0x16));
                this.Id = BitConverter.ToUInt64(this.Data, 8);
            }
            switch (this.Type)
            {
                case Types.Node:
                case Types.Enumeration:
                case Types.Field:
                case Types.Class:
                case Types.Association:
                case Types.Script:
                    return;
            }
            throw new InvalidDataException("definition type was unknown");
        }

        public static HeroDefinition Create(byte[] data, int version)
        {
            Types types = (Types) 0;
            if (version == 1)
            {
                types = ((Types) (BitConverter.ToUInt16(data, 4) >> 3)) & ((Types) 15);
            }
            else if (version == 2)
            {
                types = ((Types) (BitConverter.ToUInt16(data, 0x10) >> 3)) & ((Types) 15);
            }
            switch (types)
            {
                case Types.Node:
                    return new HeroNodeDef(data, version);

                case Types.Enumeration:
                    return new HeroEnumDef(data, version);

                case Types.Field:
                    return new HeroFieldDef(data, version);

                case Types.Class:
                    return new HeroClassDef(data, version);

                case Types.Association:
                    return new HeroAssociationDef(data, version);
            }
            return null;
        }

        protected void Decompress()
        {
            byte[] data = this.Data;
            if (this.IsCompressed)
            {
                int num2;
                Inflater inflater = new Inflater();
                ushort compressedOffset = this.CompressedOffset;
                inflater.SetInput(data, compressedOffset, data.Length - compressedOffset);
                List<KeyValuePair<byte[], int>> list = new List<KeyValuePair<byte[], int>>();
                int num3 = 0;
                do
                {
                    byte[] buffer = new byte[0x28000];
                    num2 = inflater.Inflate(buffer);
                    list.Add(new KeyValuePair<byte[], int>(buffer, num2));
                    num3 += num2;
                }
                while (num2 != 0);
                this.Data = new byte[num3 + compressedOffset];
                Array.Copy(data, 0, this.Data, 0, compressedOffset);
                int destinationIndex = compressedOffset;
                foreach (KeyValuePair<byte[], int> pair in list)
                {
                    Array.Copy(pair.Key, 0, this.Data, destinationIndex, pair.Value);
                    destinationIndex += pair.Value;
                }
                this.IsCompressed = false;
                Array.Copy(BitConverter.GetBytes(this.Data.Length), 0, this.Data, 0, 4);
            }
        }

        protected string GetString(ushort offset)
        {
            ushort count = 0;
            while (this.Data[offset + count] != 0)
            {
                count = (ushort) (count + 1);
            }
            return Encoding.ASCII.GetString(this.Data, offset, count);
        }

        protected ushort CompressedOffset
        {
            get
            {
                if (this.version == 1)
                {
                    return BitConverter.ToUInt16(this.Data, 6);
                }
                if (this.version != 2)
                {
                    throw new InvalidDataException("Invalid version");
                }
                return BitConverter.ToUInt16(this.Data, 0x12);
            }
        }

        public bool IsCompressed
        {
            get
            {
                if (this.version == 1)
                {
                    return ((BitConverter.ToUInt16(this.Data, 4) & 1) != 0);
                }
                if (this.version != 2)
                {
                    throw new InvalidDataException("Invalid version");
                }
                return ((BitConverter.ToUInt16(this.Data, 0x10) & 1) != 0);
            }
            set
            {
                if (this.version == 1)
                {
                    this.Data[4] = (byte) ((this.Data[4] & 0xfe) | (value ? 1 : 0));
                }
                else
                {
                    if (this.version != 2)
                    {
                        throw new InvalidDataException("Invalid version");
                    }
                    this.Data[0x10] = (byte) ((this.Data[0x10] & 0xfe) | (value ? 1 : 0));
                }
            }
        }

        public enum Types
        {
            Association = 5,
            Class = 4,
            Enumeration = 2,
            Field = 3,
            Node = 1,
            Script = 7
        }
    }
}

