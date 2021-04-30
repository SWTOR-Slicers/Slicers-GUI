namespace Hero.Definition
{
    using System;
    using System.Collections.Generic;
    using System.IO;

    public class HeroEnumDef : HeroDefinition
    {
        public List<string> Values;

        public HeroEnumDef(byte[] data, int version) : base(data, version)
        {
            short num;
            int num2;
            this.Values = new List<string>();
            if (version == 1)
            {
                num = BitConverter.ToInt16(data, 20);
                num2 = BitConverter.ToInt16(data, 0x16);
            }
            else
            {
                if (version != 2)
                {
                    throw new InvalidDataException("Invalid version");
                }
                num = BitConverter.ToInt16(data, 0x18);
                num2 = BitConverter.ToInt16(data, 0x1a);
            }
            for (int i = 0; i < num; i++)
            {
                this.Values.Add(base.GetString(BitConverter.ToUInt16(data, num2 + (i * 2))));
            }
        }

        public override string ToString()
        {
            return ("enum " + base.Name);
        }
    }
}

