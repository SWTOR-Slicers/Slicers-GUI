namespace Hero.Types
{
    using Hero;
    using System;
    using System.Runtime.InteropServices;
    using System.Xml;

    public class HeroBool : HeroAnyValue
    {
        public bool Value;

        public HeroBool(bool value = false)
        {
            base.Type = new HeroType(HeroTypes.Boolean);
            base.hasValue = true;
            this.Value = value;
        }

        public override void Deserialize(PackedStream_2 stream)
        {
            base.hasValue = true;
            stream.Read(out this.Value);
        }

        public override void Serialize(PackedStream_2 stream)
        {
            stream.Write(this.Value);
        }

        public override void Unmarshal(string data, bool asXml = true)
        {
            if (asXml)
            {
                XmlNode root = base.GetRoot(data);
                this.Unmarshal(root.InnerText, false);
            }
            else if (data.ToLower() == "false")
            {
                this.Value = false;
                base.hasValue = true;
            }
            else if (data.ToLower() == "true")
            {
                this.Value = true;
                base.hasValue = true;
            }
        }

        public override string ValueText
        {
            get
            {
                return string.Format("{0}", this.Value);
            }
        }
    }
}

