namespace Hero
{
    using System;
    using System.IO;

    public class HeroType
    {
        public DefinitionId Id;
        private HeroType indexer;
        public HeroTypes Type;
        private HeroType values;

        public HeroType()
        {
            this.Type = HeroTypes.None;
        }

        public HeroType(HeroTypes type)
        {
            this.Type = type;
        }

        protected HeroType(OmegaStream stream)
        {
            this.Type = (HeroTypes) stream.ReadByte();
            switch (this.Type)
            {
                case HeroTypes.Enum:
                case HeroTypes.Class:
                case HeroTypes.NodeRef:
                    this.Id = new DefinitionId(stream.ReadULong());
                    return;

                case HeroTypes.String:
                    break;

                case HeroTypes.List:
                    this.Values = new HeroType(stream);
                    return;

                case HeroTypes.LookupList:
                    this.Indexer = new HeroType(stream);
                    this.Values = new HeroType(stream);
                    break;

                default:
                    return;
            }
        }

        public static HeroType Create(byte[] data, ushort offset, ushort length)
        {
            return new HeroType(new OmegaStream(new MemoryStream(data, offset, length)));
        }

        public void SetValuesType(HeroTypes type)
        {
            this.Values = new HeroType(type);
        }

        public override string ToString()
        {
            switch (this.Type)
            {
                case HeroTypes.Enum:
                    if (this.Id != null)
                    {
                        return this.Id.ToString();
                    }
                    return "enum";

                case HeroTypes.List:
                    if (this.Values != null)
                    {
                        return ("list of " + this.Values.ToString());
                    }
                    return "list";

                case HeroTypes.LookupList:
                    if ((this.Indexer != null) || (this.Values != null))
                    {
                        if ((this.Indexer != null) && (this.Values == null))
                        {
                            return ("lookuplist indexed by " + this.Indexer.ToString());
                        }
                        if ((this.Indexer == null) && (this.Values != null))
                        {
                            return ("lookuplist of " + this.Values.ToString());
                        }
                        return ("lookuplist indexed by " + this.Indexer.ToString() + " of " + this.Values.ToString());
                    }
                    return "lookuplist";

                case HeroTypes.Class:
                    if (this.Id != null)
                    {
                        return this.Id.ToString();
                    }
                    return "class";

                case HeroTypes.NodeRef:
                    if (this.Id.Id == 0L)
                    {
                        return "noderef";
                    }
                    return ("noderef of " + this.Id.ToString());

                case HeroTypes.None:
                    return "";
            }
            return this.Type.ToString();
        }

        public HeroType Indexer
        {
            get
            {
                return this.indexer;
            }
            set
            {
                this.indexer = value;
            }
        }

        public HeroType Values
        {
            get
            {
                return this.values;
            }
            set
            {
                this.values = value;
            }
        }
    }
}

