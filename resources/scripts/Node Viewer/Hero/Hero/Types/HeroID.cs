namespace Hero.Types
{
    using Hero;
    using Hero.Definition;
    using System;
    using System.Runtime.InteropServices;
    using System.Xml;

    public class HeroID : HeroAnyValue
    {
        public ulong Id;

        public HeroID()
        {
            base.Type = new HeroType(HeroTypes.Id);
        }

        public HeroID(string name)
        {
            if (!GOM.Instance.DefinitionsByName[HeroDefinition.Types.Node].ContainsKey(name))
            {
                throw new Exception("No node with the specified name exists");
            }
            base.Type = new HeroType(HeroTypes.Id);
            this.Id = GOM.Instance.DefinitionsByName[(HeroDefinition.Types)1][name].Id;
            base.hasValue = true;
        }

        public HeroID(ulong value)
        {
            base.Type = new HeroType(HeroTypes.Id);
            this.Id = value;
            base.hasValue = true;
        }

        public override void Deserialize(PackedStream_2 stream)
        {
            base.hasValue = true;
            stream.Read(out this.Id);
        }

        public override void Serialize(PackedStream_2 stream)
        {
            stream.Write(this.Id);
        }

        public override void Unmarshal(string data, bool hasXml = true)
        {
            if (hasXml)
            {
                XmlNode root = base.GetRoot(data);
                this.Unmarshal(root.InnerText, false);
            }
            else
            {
                this.Id = Convert.ToUInt64(data, 10);
                base.hasValue = true;
            }
        }

        public override string ValueText
        {
            get
            {
                return this.Id.ToString();
            }
        }
    }
}

