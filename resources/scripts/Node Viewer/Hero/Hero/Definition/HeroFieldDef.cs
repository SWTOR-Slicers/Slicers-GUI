namespace Hero.Definition
{
    using Hero;
    using System;
    using System.IO;

    public class HeroFieldDef : HeroDefinition
    {
        public HeroType FieldType;

        public HeroFieldDef(byte[] data, int version) : base(data, version)
        {
            if (version == 1)
            {
                this.FieldType = HeroType.Create(data, BitConverter.ToUInt16(data, 0x18), BitConverter.ToUInt16(data, 0x16));
            }
            else
            {
                if (version != 2)
                {
                    throw new InvalidDataException("Invalid version");
                }
                this.FieldType = HeroType.Create(data, BitConverter.ToUInt16(data, 0x1c), BitConverter.ToUInt16(data, 0x1a));
            }
        }

        public override string ToString()
        {
            return ("Field " + base.Name + " as " + this.FieldType.ToString());
        }
    }
}

