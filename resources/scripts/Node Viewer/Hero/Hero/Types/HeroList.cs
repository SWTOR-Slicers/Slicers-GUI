namespace Hero.Types
{
    using Hero;
    using System;
    using System.Collections.Generic;
    using System.Runtime.InteropServices;

    public class HeroList : HeroAnyValue
    {
        public List<HeroVarId> Data;
        public int nextId;

        public HeroList(HeroType type = null)
        {
            base.Type = new HeroType(HeroTypes.List);
            base.Type.Values = type;
            this.nextId = 0;
        }

        public void Add<T>(T value) where T: HeroAnyValue
        {
            if (this.Data == null)
            {
                this.Data = new List<HeroVarId>();
            }
            this.Data.Add(new HeroVarId(this.GetNextId(), value));
        }

        public override void Deserialize(PackedStream_2 stream)
        {
            base.hasValue = true;
            this.Data = new List<HeroVarId>();
            DeserializeList list = new DeserializeList(stream, 1);
            if (base.Type.Values == null)
            {
                base.Type.SetValuesType(list.listType);
            }
            for (uint i = 0; i < list.Count; i++)
            {
                uint num2;
                bool flag;
                int num3;
                list.GetFieldIndex(out num2, out flag, out num3);
                HeroAnyValue value2 = HeroAnyValue.Create(base.Type.Values);
                value2.Deserialize(stream);
                this.Data.Add(new HeroVarId(num3, value2));
                if (num3 > this.nextId)
                {
                    this.nextId = num3;
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
            SerializeList list = new SerializeList(stream, 1, base.Type.Values.Type, count);
            for (int i = 0; i < count; i++)
            {
                list.SetFieldIndex(i, this.Data[i].VarId);
                this.Data[i].Value.Serialize(stream);
            }
        }

        public override string ValueText
        {
            get
            {
                if (this.Data == null)
                {
                    return "{ }";
                }
                string str = "{ ";
                foreach (HeroVarId id in this.Data)
                {
                    str = str + id.Value.ValueText + ", ";
                }
                return (str + " }");
            }
        }
    }
}

