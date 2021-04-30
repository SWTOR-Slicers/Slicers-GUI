namespace Hero.Definition
{
    using System;
    using System.IO;

    public class HeroAssociationDef : HeroDefinition
    {
        public ushort Flags;

        public HeroAssociationDef(byte[] data, int version) : base(data, version)
        {
            if (version == 1)
            {
                this.Flags = BitConverter.ToUInt16(data, 20);
            }
            else
            {
                if (version != 2)
                {
                    throw new InvalidDataException("Invalid version");
                }
                this.Flags = BitConverter.ToUInt16(data, 0x18);
            }
        }

        public override string ToString()
        {
            return ("association " + base.Name);
        }
    }
}

