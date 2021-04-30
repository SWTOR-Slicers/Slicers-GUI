namespace Hero.Types
{
    using Hero;
    using Hero.Definition;
    using System;
    using System.Runtime.InteropServices;
    using System.Xml;

    public class HeroClass : HeroAnyValue
    {
        public VariableList Variables;

        public HeroClass()
        {
            base.Type = new HeroType(HeroTypes.Class);
            base.hasValue = false;
            this.Variables = new VariableList();
        }

        public HeroClass(HeroType type = null)
        {
            base.Type = new HeroType(HeroTypes.Class);
            this.Variables = new VariableList();
            if (type != null)
            {
                base.Type.Id = type.Id;
            }
            base.hasValue = false;
        }

        public override void Deserialize(PackedStream_2 stream)
        {
            base.hasValue = true;
            this.Variables = new VariableList();
            DeserializeClass class2 = new DeserializeClass(stream, 1);
            for (uint i = 0; i < class2.Count; i++)
            {
                ulong num2;
                int num5;
                HeroFieldDef definition;
                HeroAnyValue value2;
                uint num3 = 0;
                int variableId = 0;
                class2.ReadFieldData(out num2, ref num3, ref variableId, out num5);
                if (num5 == 2)
                {
                    continue;
                }
                HeroType type = new HeroType((HeroTypes) num3);
                DefinitionId field = new DefinitionId(num2);
                if (field.Definition != null)
                {
                    definition = field.Definition as HeroFieldDef;
                    HeroTypes types = definition.FieldType.Type;
                    if (types != HeroTypes.Enum)
                    {
                        if (types == HeroTypes.LookupList)
                        {
                            goto Label_0096;
                        }
                        if (types != HeroTypes.ScriptRef)
                        {
                            goto Label_009F;
                        }
                    }
                    type.Id = definition.FieldType.Id;
                }
                goto Label_009F;
            Label_0096:
                type = definition.FieldType;
            Label_009F:
                value2 = HeroAnyValue.Create(type);
                value2.Deserialize(stream);
                this.Variables.Add(new Variable(field, variableId, value2));
            }
        }

        public override void Serialize(PackedStream_2 stream)
        {
            int count = 0;
            if (this.Variables != null)
            {
                count = this.Variables.Count;
            }
            SerializeClass class2 = new SerializeClass(stream, 1, count);
            for (int i = 0; i < count; i++)
            {
                class2.WriteFieldData(this.Variables[i].Field.Id, this.Variables[i].Value.Type.Type, this.Variables[i].VariableId);
                this.Variables[i].Value.Serialize(stream);
            }
        }

        public override void Unmarshal(string data, bool withV = true)
        {
            XmlNode node = base.GetRoot(data).SelectSingleNode("node");
            if (node == null)
            {
                throw new SerializingException("node tag not found");
            }
            HeroClassDef definition = base.Type.Id.Definition as HeroClassDef;
            for (node = node.FirstChild; node != null; node = node.NextSibling)
            {
                if (node.Name == "f")
                {
                    string name = node.Attributes["name"].Value;
                    HeroFieldDef field = definition.GetField(name);
                    if (field != null)
                    {
                        HeroAnyValue value2 = HeroAnyValue.Create(field.FieldType);
                        value2.Unmarshal("<v>" + node.InnerXml + "</v>", true);
                        this.Variables.Add(new Variable(new DefinitionId(field.Id), 0, value2));
                    }
                }
            }
        }

        public override string ValueText
        {
            get
            {
                return "--Data--";
            }
        }
    }
}

