namespace Hero.Definition
{
    using Hero;
    using System;
    using System.Collections.Generic;
    using System.IO;

    public class HeroClassDef : HeroDefinition
    {
        public List<DefinitionId> Fields;
        public List<DefinitionId> ParentClasses;
        public DefinitionId vers2_18;
        public DefinitionId vers2_20;

        public HeroClassDef(byte[] data, int version) : base(data, version)
        {
            short num;
            short num2;
            short num3;
            short num4;
            this.ParentClasses = new List<DefinitionId>();
            this.Fields = new List<DefinitionId>();
            if (version == 1)
            {
                num = BitConverter.ToInt16(data, 0x16);
                num2 = BitConverter.ToInt16(data, 0x18);
                num3 = BitConverter.ToInt16(data, 0x1a);
                num4 = BitConverter.ToInt16(data, 0x1c);
            }
            else
            {
                if (version != 2)
                {
                    throw new InvalidDataException("Invalid version");
                }
                this.vers2_18 = new DefinitionId(BitConverter.ToUInt64(data, 0x18));
                this.vers2_20 = new DefinitionId(BitConverter.ToUInt64(data, 0x20));
                num = BitConverter.ToInt16(data, 0x2a);
                num2 = BitConverter.ToInt16(data, 0x2c);
                num3 = BitConverter.ToInt16(data, 0x2e);
                num4 = BitConverter.ToInt16(data, 0x30);
            }
            for (int i = 0; i < num; i++)
            {
                this.ParentClasses.Add(new DefinitionId(BitConverter.ToUInt64(data, num2 + (8 * i))));
            }
            for (int j = 0; j < num3; j++)
            {
                this.Fields.Add(new DefinitionId(BitConverter.ToUInt64(data, num4 + (8 * j))));
            }
        }

        public HeroFieldDef GetField(string name)
        {
            foreach (DefinitionId id in this.Fields)
            {
                HeroFieldDef definition = id.Definition as HeroFieldDef;
                if ((definition != null) && (definition.Name == name))
                {
                    return definition;
                }
            }
            foreach (DefinitionId id2 in this.ParentClasses)
            {
                HeroClassDef def2 = id2.Definition as HeroClassDef;
                if (def2 != null)
                {
                    HeroFieldDef field = def2.GetField(name);
                    if (field != null)
                    {
                        return field;
                    }
                }
            }
            return null;
        }

        public override string ToString()
        {
            return ("Class " + base.Name);
        }
    }
}

