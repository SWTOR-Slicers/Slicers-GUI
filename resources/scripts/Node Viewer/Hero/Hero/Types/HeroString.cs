namespace Hero.Types
{
    using Hero;
    using System;
    using System.Runtime.InteropServices;
    using System.Xml;

    public class HeroString : HeroAnyValue
    {
        public string Text;

        public HeroString(string str = null)
        {
            base.Type = new HeroType(HeroTypes.String);
            this.Text = str;
            base.hasValue = this.Text != null;
        }

        public override void Deserialize(PackedStream_2 stream)
        {
            base.hasValue = true;
            stream.Read(out this.Text);
        }

        public override void Serialize(PackedStream_2 stream)
        {
            stream.Write(this.Text);
        }

        public override void Unmarshal(string data, bool hasXml = true)
        {
            if (hasXml)
            {
                XmlNode root = base.GetRoot(data);
                this.Unmarshal(root.InnerXml, false);
            }
            else
            {
                this.Text = data;
                base.hasValue = true;
            }
        }

        public override string ValueText
        {
            get
            {
                if (this.Text != null)
                {
                    return ("\"" + this.Text + "\"");
                }
                return "";
            }
        }
    }
}

