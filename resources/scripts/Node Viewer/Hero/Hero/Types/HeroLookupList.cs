namespace Hero.Types
{
    using Hero;
    using System;
    using System.Collections.Generic;
    using System.Reflection;
    using System.Runtime.InteropServices;
    using System.Xml;

    public class HeroLookupList : HeroAnyValue
    {
        public Dictionary<HeroVarId, HeroAnyValue> Data;
        public int nextId;

        public HeroLookupList(HeroType key = null, HeroType values = null)
        {
            base.Type = new HeroType(HeroTypes.LookupList);
            base.Type.Indexer = key;
            base.Type.Values = values;
            this.nextId = 0;
        }

        public void Add<T1, T2>(T1 key, T2 value) where T1: HeroAnyValue where T2: HeroAnyValue
        {
            if (this.Data == null)
            {
                this.Data = new Dictionary<HeroVarId, HeroAnyValue>();
            }
            this.Data[new HeroVarId(this.GetNextId(), key)] = value;
        }

        public override void Deserialize(PackedStream_2 stream)
        {
            base.hasValue = true;
            this.Data = new Dictionary<HeroVarId, HeroAnyValue>();
            HeroType defaultIndexerType = new HeroType(HeroTypes.None);
            if (base.Type.Indexer != null)
            {
                defaultIndexerType = base.Type.Indexer;
            }
            DeserializeLookupList list = new DeserializeLookupList(stream, 1, defaultIndexerType);
            if ((base.Type.Indexer == null) || (base.Type.Indexer.Type == HeroTypes.None))
            {
                base.Type.Indexer = list.indexerType;
            }
            else
            {
                list.indexerType = base.Type.Indexer;
            }
            if (base.Type.Values == null)
            {
                base.Type.Values = list.valueType;
            }
            else
            {
                list.valueType = base.Type.Values;
            }
            for (ulong i = 0L; i < list.Count; i += (ulong) 1L)
            {
                int num2;
                HeroAnyValue value2;
                list.GetKey(out value2, out num2);
                HeroAnyValue value3 = HeroAnyValue.Create(base.Type.Values);
                value3.Deserialize(stream);
                this.Data[new HeroVarId(num2, value2)] = value3;
                if (num2 > this.nextId)
                {
                    this.nextId = num2;
                }
            }
        }

        public int GetNextId()
        {
            this.nextId++;
            return this.nextId;
        }

        public override void Serialize(PackedStream_2 stream)
        {
            int count = 0;
            if (this.Data != null)
            {
                count = this.Data.Count;
            }
            SerializeLookupList list = new SerializeLookupList(stream, 1, base.Type, count);
            if (this.Data != null)
            {
                foreach (KeyValuePair<HeroVarId, HeroAnyValue> pair in this.Data)
                {
                    list.SetKey(pair.Key.Value, pair.Key.VarId);
                    pair.Value.Serialize(stream);
                }
            }
        }

        public override void Unmarshal(string data, bool asXml = true)
        {
            XmlNode root = base.GetRoot(data);
            this.Data = new Dictionary<HeroVarId, HeroAnyValue>();
            HeroAnyValue value2 = null;
            HeroAnyValue value3 = null;
            for (root = root.FirstChild; root != null; root = root.NextSibling)
            {
                if (root.Name == "k")
                {
                    value2 = HeroAnyValue.Create(base.Type.Indexer);
                    value2.Unmarshal("<v>" + root.InnerText + "</v>", true);
                }
                if (root.Name == "e")
                {
                    value3 = HeroAnyValue.Create(base.Type.Values);
                    value3.Unmarshal("<v>" + root.InnerText + "</v>", true);
                    this.Data[new HeroVarId(0, value2)] = value3;
                    value2 = null;
                }
            }
            base.hasValue = true;
        }

        //public HeroAnyValue GetValue()
        //{

        //}

        public HeroAnyValue this[string key]
        {
            get
            {
                foreach (KeyValuePair<HeroVarId, HeroAnyValue> pair in this.Data)
                {
                    if (pair.Key.CompareTo(key) == 0)
                    {
                        return this.Data[pair.Key];
                    }
                }
                return null;
            }
            set
            {
                foreach (KeyValuePair<HeroVarId, HeroAnyValue> pair in this.Data)
                {
                    if (pair.Key.CompareTo(key) == 0)
                    {
                        this.Data[pair.Key] = value;
                    }
                }
                this.Data[new HeroVarId(0, new HeroString(key))] = value;
            }
        }

        public override string ValueText
        {
            get
            {
                if (this.Data == null)
                {
                    return "[ ]";
                }
                string str = "[ ";
                foreach (KeyValuePair<HeroVarId, HeroAnyValue> pair in this.Data)
                {
                    string str2 = str;
                    str = str2 + pair.Key.Value.ValueText + ": " + pair.Value.ValueText + ", ";
                }
                return (str + " ]");
            }
        }
    }
}

