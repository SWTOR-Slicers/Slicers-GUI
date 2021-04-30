namespace Hero
{
    using Hero.Definition;
    using System;

    public class DefinitionId
    {
        public ulong Id;

        public DefinitionId()
        {
            this.Id = 0L;
        }

        public DefinitionId(ulong id)
        {
            this.Set(id);
        }

        public static explicit operator ulong(DefinitionId id)
        {
            return id.Id;
        }

        public static implicit operator HeroDefinition(DefinitionId id)
        {
            return GOM.Instance.LookupDefinitionId(id.Id);
        }

        public void Set(ulong id)
        {
            this.Id = id;
        }

        public override string ToString()
        {
            HeroDefinition definitionId = GOM.Instance.LookupDefinitionId(this.Id);
            if (definitionId != null)
            {
                return definitionId.ToString();
            }
            return string.Format("0x{0:X8}", this.Id);
        }

        public HeroDefinition Definition
        {
            get
            {
                return GOM.Instance.LookupDefinitionId(this.Id);
            }
        }
    }
}

