namespace Hero.Types
{
    using Hero;
    using System;
    using System.Globalization;
    using System.Runtime.InteropServices;
    using System.Xml;

    public class HeroVector3 : HeroAnyValue
    {
        public float x;
        public float y;
        public float z;

        public HeroVector3(float x = 0f, float y = 0f, float z = 0f)
        {
            base.Type = new HeroType(HeroTypes.Vector3);
            this.x = x;
            this.y = y;
            this.z = z;
        }

        public override void Deserialize(PackedStream_2 stream)
        {
            base.hasValue = true;
            stream.Read(out this.x);
            stream.Read(out this.y);
            stream.Read(out this.z);
        }

        public override void Serialize(PackedStream_2 stream)
        {
            stream.Write(this.x);
            stream.Write(this.y);
            stream.Write(this.z);
        }

        public override void Unmarshal(string data, bool withV = true)
        {
            if (withV)
            {
                XmlNode root = base.GetRoot(data);
                this.Unmarshal(root.InnerXml, false);
            }
            else
            {
                string str = data;
                str.Trim();
                string[] strArray = str.Substring(1, str.Length - 2).Split(new char[] { ',' });
                this.x = Convert.ToSingle(strArray[0], CultureInfo.InvariantCulture);
                this.y = Convert.ToSingle(strArray[1], CultureInfo.InvariantCulture);
                this.z = Convert.ToSingle(strArray[2], CultureInfo.InvariantCulture);
                base.hasValue = true;
            }
        }

        public override string ValueText
        {
            get
            {
                return string.Format("({0}, {1}, {2})", this.x, this.y, this.z);
            }
        }
    }
}

