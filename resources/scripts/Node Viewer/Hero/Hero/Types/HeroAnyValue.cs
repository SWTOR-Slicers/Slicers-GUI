namespace Hero.Types
{
    using Hero;
    using System;
    using System.IO;
    using System.Runtime.InteropServices;
    using System.Xml;

    public class HeroAnyValue : IComparable<HeroAnyValue>, IComparable
    {
        public bool hasValue;
        public ulong ID;
        public HeroType Type;

        public HeroAnyValue()
        {
            this.hasValue = false;
            this.Type = new HeroType();
        }

        protected HeroAnyValue(HeroType Type)
        {
            this.Type = Type;
        }

        public static HeroAnyValue Create(HeroType type)
        {
            switch (type.Type)
            {
                case HeroTypes.None:
                    return new HeroVoid();

                case HeroTypes.Id:
                    return new HeroID();

                case HeroTypes.Integer:
                    return new HeroInt(0L);

                case HeroTypes.Boolean:
                    return new HeroBool(false);

                case HeroTypes.Float:
                    return new HeroFloat(0f);

                case HeroTypes.Enum:
                    return new HeroEnum(type, 0L);

                case HeroTypes.String:
                    return new HeroString(null);

                case HeroTypes.List:
                    return new HeroList(type.Values);

                case HeroTypes.LookupList:
                    return new HeroLookupList(type.Indexer, type.Values);

                case HeroTypes.Class:
                    return new HeroClass(type);

                case HeroTypes.ScriptRef:
                    return new HeroScriptRef(type);

                case HeroTypes.NodeRef:
                    return new HeroNodeRef(type);

                case HeroTypes.Timer:
                    return new HeroTimer();

                case HeroTypes.Vector3:
                    return new HeroVector3(0f, 0f, 0f);

                case HeroTypes.Timeinterval:
                    return new HeroTimeinterval(0L);

                case HeroTypes.Date:
                    return new HeroDate(0L);
            }
            throw new InvalidDataException("cannot construct an invalid type");
        }

        public virtual void Deserialize(PackedStream_2 stream)
        {
            throw new NotImplementedException();
        }

        protected XmlNode GetRoot(string data)
        {
            XmlDocument document = new XmlDocument();
            document.LoadXml(data);
            XmlNode node = document.SelectSingleNode("v");
            if (node == null)
            {
                return document.FirstChild;
            }
            return node;
        }

        public static HeroType GetTypeFromJStream(PackedStream_2 stream)
        {
            ulong num;
            ulong num2;
            stream.ReadVersion(out num);
            if (num != 0L)
            {
                throw new InvalidDataException("incorrect header token for creating HeroValueType");
            }
            stream.Read(out num2);
            HeroType type = new HeroType((HeroTypes) ((int) num2));
            switch (type.Type)
            {
                case HeroTypes.Enum:
                case HeroTypes.Class:
                case HeroTypes.NodeRef:
                    stream.Read(out num2);
                    type.Id = new DefinitionId(num2);
                    return type;

                case HeroTypes.String:
                    return type;

                case HeroTypes.List:
                    type.Values = GetTypeFromJStream(stream);
                    stream.CheckEnd();
                    return type;

                case HeroTypes.LookupList:
                    type.Indexer = GetTypeFromJStream(stream);
                    stream.CheckEnd();
                    type.Values = GetTypeFromJStream(stream);
                    stream.CheckEnd();
                    return type;
            }
            return type;
        }

        public virtual void Serialize(PackedStream_2 stream)
        {
            throw new NotImplementedException();
        }

        public static void SetTypeInJStream(PackedStream_2 stream, HeroType type)
        {
            stream.WriteVersion(0L);
            stream.Write((ulong) ((long) type.Type));
            switch (type.Type)
            {
                case HeroTypes.List:
                    SetTypeInJStream(stream, type.Values);
                    return;

                case HeroTypes.LookupList:
                    SetTypeInJStream(stream, type.Indexer);
                    SetTypeInJStream(stream, type.Values);
                    return;

                case HeroTypes.Class:
                case HeroTypes.NodeRef:
                    stream.Write(type.Id.Id);
                    return;
            }
        }

        public override bool Equals(object obj)
        {
            return base.Equals(obj);
        }

        public override int GetHashCode()
        {
            return base.GetHashCode();
        }

        public virtual int CompareTo(object obj)
        {
            int result = 1;

            if (obj is HeroAnyValue)
            {
                HeroAnyValue v = obj as HeroAnyValue;
                result = this.ValueText.CompareTo(v.ValueText);
            }

            return result;
        }

        public override string ToString()
        {
            if (!this.hasValue)
            {
                return this.Type.ToString();
            }
            string valueText = this.ValueText;
            if (valueText != null)
            {
                return (this.Type.ToString() + ": " + valueText);
            }
            return (this.Type.ToString() + ": null");
        }

        public virtual void Unmarshal(string data, bool asXml = true)
        {
        }

        public virtual string ValueText
        {
            get
            {
                return null;
            }
        }

        public virtual int CompareTo(HeroAnyValue other)
        {
            return 0;
        }
    }
}

