namespace Hero
{
    using Hero.Types;
    using System;

    public class Variable
    {
        public DefinitionId Field;
        public HeroAnyValue Value;
        public int VariableId;

        public Variable(DefinitionId field, int variableId, HeroAnyValue value)
        {
            this.Field = field;
            this.VariableId = variableId;
            this.Value = value;
        }

        public override string ToString()
        {
            return string.Format("Field: {0}, varId: {1}, Value: {2}", this.Field.ToString(), this.VariableId, this.Value.ToString());
        }
    }
}

