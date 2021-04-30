namespace Hero
{
    using Hero.Definition;
    using Hero.Types;
    using System;
    using System.Collections.Generic;
    using System.Runtime.CompilerServices;
    using System.Runtime.InteropServices;

    public class VariableList : List<Variable>
    {
        protected Dictionary<ulong, Variable> dictIdToVariable = new Dictionary<ulong, Variable>();
        protected int nextId = 0;

        public int GetNextId()
        {
            this.nextId++;
            return this.nextId;
        }

        public bool GetVariable<T>(string name, out T value) where T: HeroAnyValue
        {
            value = default(T);
            foreach (Variable variable in this)
            {
                if ((variable.Field.Definition != null) && (variable.Field.Definition.Name == name))
                {
                    value = variable.Value as T;
                    return true;
                }
            }
            return false;
        }

        public void ProcessFields(ProcessFieldsCallback callback)
        {
            foreach (Variable variable in this)
            {
                callback(variable.Field, variable.Value);
            }
        }

        public void SetVariable<T>(DefinitionId field, T value) where T: HeroAnyValue
        {
            int variableId;
            Variable variable;
            HeroFieldDef definition = field.Definition as HeroFieldDef;
            if ((definition != null) && (definition.FieldType.Type != value.Type.Type))
            {
                throw new Exception("Type mismatch exception");
            }
            this.dictIdToVariable.TryGetValue(field.Id, out variable);
            if (variable != null)
            {
                variableId = variable.VariableId;
                variable.Value = value;
            }
            else
            {
                variableId = this.GetNextId();
                variable = new Variable(field, variableId, value);
                this.dictIdToVariable[field.Id] = variable;
                base.Add(variable);
            }
        }

        public void SetVariable<T>(string name, T value) where T: HeroAnyValue
        {
            if (!GOM.Instance.DefinitionsByName[HeroDefinition.Types.Field].ContainsKey(name))
            {
                throw new Exception("Field name does not exist");
            }
            HeroFieldDef def = GOM.Instance.DefinitionsByName[(HeroDefinition.Types)3][name] as HeroFieldDef;
            this.SetVariable<T>(new DefinitionId(def.Id), value);
        }

        public delegate void ProcessFieldsCallback(DefinitionId field, HeroAnyValue value);
    }
}

