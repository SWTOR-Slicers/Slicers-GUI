namespace Hero.Types
{
    using Hero;
    using System;
    using System.Runtime.InteropServices;

    public class HeroNodeRef : HeroAnyValue
    {
        public HeroNodeRef(HeroType type = null)
        {
            base.Type = new HeroType(HeroTypes.NodeRef);
            if (type != null)
            {
                base.Type.Id = type.Id;
            }
            base.hasValue = base.Type.Id != null;
        }

        public override void Deserialize(PackedStream_2 stream)
        {
            base.hasValue = true;
            if (base.Type.Id == null)
            {
                base.Type.Id = new DefinitionId();
            }
            stream.Read(out base.Type.Id.Id);
        }

        public override void Serialize(PackedStream_2 stream)
        {
            if (base.Type.Id == null)
            {
                throw new SerializingException("Cannot serialize a non-reference");
            }
            stream.Write(base.Type.Id.Id);
        }

        public override string ValueText
        {
            get
            {
                return base.Type.Id.ToString();
            }
        }
    }
}

