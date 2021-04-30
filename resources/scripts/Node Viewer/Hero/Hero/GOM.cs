namespace Hero
{
    using Hero.Definition;
    using Hero.Types;
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;

    public class GOM
    {
        protected Dictionary<ulong, HeroDefinition> definitions = new Dictionary<ulong, HeroDefinition>();
        public Dictionary<HeroDefinition.Types, Dictionary<string, HeroDefinition>> DefinitionsByName = new Dictionary<HeroDefinition.Types, Dictionary<string, HeroDefinition>>();
        protected static GOM instance;
        protected GOMFolder root;
        protected Dictionary<IDSpaces, IDSpace> spaces;

        protected Action<HeroDefinition> addNodeAction;

        public Action<HeroDefinition> AddNodeAction
        {
            get { return addNodeAction; }
            set { addNodeAction = value; }
        }

        protected GOM()
        {
            this.DefinitionsByName[HeroDefinition.Types.Association] = new Dictionary<string, HeroDefinition>();
            this.DefinitionsByName[HeroDefinition.Types.Class] = new Dictionary<string, HeroDefinition>();
            this.DefinitionsByName[HeroDefinition.Types.Enumeration] = new Dictionary<string, HeroDefinition>();
            this.DefinitionsByName[HeroDefinition.Types.Field] = new Dictionary<string, HeroDefinition>();
            this.DefinitionsByName[HeroDefinition.Types.Node] = new Dictionary<string, HeroDefinition>();
            this.DefinitionsByName[HeroDefinition.Types.Script] = new Dictionary<string, HeroDefinition>();
            this.spaces = new Dictionary<IDSpaces, IDSpace>();
            this.spaces[IDSpaces.ServerTemporaryNode] = new IDSpace(0x77359400L, 0xee6b2800L);
            this.root = new GOMFolder();
        }

        protected void AddNode(HeroNodeDef node)
        {
            string[] strArray = node.Name.Split(new char[] { '.' });
            if (strArray.Length > 0)
            {
                GOMFolder root = this.root;
                foreach (string str in strArray)
                {
                    root = root.CreateFolder(str);
                }
                root.SetNode(node);
            }
        }

        public HeroClass CreateClass(IDSpaces space, string className)
        {
            HeroType classType = this.GetClassType(className);
            if (classType != null)
            {
                ulong num = this.spaces[space].Get();
                HeroClass class2 = new HeroClass(classType) {
                    ID = num
                };
                this.spaces[space].Add(class2);
                return class2;
            }
            return null;
        }

        public HeroType GetClassType(string className)
        {
            if (this.DefinitionsByName[HeroDefinition.Types.Class].ContainsKey(className))
            {
                HeroClassDef def = this.DefinitionsByName[(HeroDefinition.Types)4][className] as HeroClassDef;
                return new HeroType(HeroTypes.Class) { Id = new DefinitionId(def.Id) };
            }
            return null;
        }

        public HeroType GetEnumType(string name)
        {
            HeroType type = new HeroType(HeroTypes.Enum);
            if (this.DefinitionsByName[HeroDefinition.Types.Enumeration].ContainsKey(name))
            {
                HeroEnumDef def = this.DefinitionsByName[(HeroDefinition.Types)2][name] as HeroEnumDef;
                type.Id = new DefinitionId(def.Id);
            }
            return type;
        }

        public int GetEnumValue(string enumType, string enumValue)
        {
            if (this.DefinitionsByName[HeroDefinition.Types.Enumeration].ContainsKey(enumType))
            {
                HeroEnumDef def = this.DefinitionsByName[(HeroDefinition.Types)2][enumType] as HeroEnumDef;
                for (int i = 0; i < def.Values.Count; i++)
                {
                    if (def.Values[i] == enumValue)
                    {
                        return (i + 1);
                    }
                }
            }
            return 0;
        }

        public HeroNodeDef GetNode(string nodeName)
        {
            if (this.DefinitionsByName[HeroDefinition.Types.Node].ContainsKey(nodeName))
            {
                return (this.DefinitionsByName[(HeroDefinition.Types)1][nodeName] as HeroNodeDef);
            }
            return null;
        }

        public IEnumerable<HeroDefinition> GetDefinitionsByPath(string path)
        {
            path = path.Trim().ToLower();
            return this.DefinitionsByName[HeroDefinition.Types.Node].Where(o => o.Key.ToLower().StartsWith(path)).Select(o => o.Value);
        }

        public void Initialize()
        {
            this.Parse(Repository.Instance.GetFile("/resources/systemgenerated/client.gom"));
            for (int i = 0; i < 500; i++)
            {
                this.LoadBucket(i);
            }
            this.root.Sort();
        }

        public void LoadBucket(int index)
        {
            string name = string.Format("/resources/systemgenerated/buckets/{0}.bkt", index);
            this.LoadBucket(Repository.Instance.GetFile(name));
        }

        public void LoadBucket(Stream stream)
        {
            OmegaStream stream2 = new OmegaStream(stream);
            stream2.CheckResourceHeader(0x4b554250, 2, 2);
            for (int i = 0; i < 2; i++)
            {
                uint length = stream2.ReadUInt();
                byte[] buffer = stream2.ReadBytes(length);
                this.Parse(new MemoryStream(buffer));
            }
        }

        public void LoadPrototype(ulong id)
        {
            string name = string.Format("/resources/systemgenerated/prototypes/{0}.node", id);
            Stream file = Repository.Instance.GetFile(name);
            if (file != null)
            {
                HeroNodeDef node = new HeroNodeDef(new OmegaStream(file));
                this.definitions[node.Id] = node;

                string key = string.Empty;
                if (string.IsNullOrEmpty(node.Name)) key = node.Id.ToString();
                else key = node.Name;
                this.DefinitionsByName[node.Type][node.Name] = node;
                this.AddNode(node);
            }
        }

        public void LoadPrototypes(Stream stream)
        {
            ulong num;
            PackedStream_2 m_ = new PackedStream_2(1, stream);
            m_.CheckResourceHeader(0x464e4950, 1, 1);
            m_.Read(out num);
            for (ulong i = 0L; i < num; i += (ulong) 1L)
            {
                ulong num3;
                ulong num4;
                m_.Read(out num3);
                m_.Read(out num4);
                this.LoadPrototype(num3);
            }
            m_.CheckEnd();
        }

        public HeroDefinition LookupDefinitionId(ulong id)
        {
            if (this.definitions.ContainsKey(id))
            {
                return this.definitions[id];
            }
            return null;
        }

        public void Parse(Stream stream)
        {
            while (stream.Position < stream.Length)
            {
                byte[] buffer = new byte[8];
                stream.Read(buffer, 0, buffer.Length);
                uint num = BitConverter.ToUInt32(buffer, 0);
                uint num2 = BitConverter.ToUInt32(buffer, 4);
                if ((num != 0x424c4244) || (num2 != 1))
                {
                    if ((num != 0x424c4244) || (num2 != 2))
                    {
                        throw new InvalidDataException(string.Format("Unsupported chunk (ID={0:X}, Version={1}", num, num2));
                    }
                    this.ParseDBLB(stream, 2);
                }
                else
                {
                    this.ParseDBLB(stream, 1);
                    continue;
                }
            }
        }

        public void ParseDBLB(Stream stream, int version)
        {
            byte[] buffer = new byte[4];
            while (true)
            {
                if ((stream.Length - stream.Position) < 4L)
                {
                    throw new InvalidDataException("Cannot read length, input file truncated");
                }
                stream.Read(buffer, 0, buffer.Length);
                int num = BitConverter.ToInt32(buffer, 0);
                if (num == 0)
                {
                    return;
                }
                if ((stream.Length - stream.Position) < (num - 4))
                {
                    throw new InvalidDataException("Cannot read block, input file truncated");
                }
                byte[] destinationArray = new byte[num];
                Array.Copy(buffer, 0, destinationArray, 0, buffer.Length);
                stream.Read(destinationArray, 4, num - 4);
                this.ParseDefinition(destinationArray, version);
                int num2 = ((int) (stream.Position + 7L)) & -8;
                stream.Seek((long) num2, SeekOrigin.Begin);
            }
        }

        public void ParseDefinition(byte[] data, int version)
        {
            HeroDefinition definition = HeroDefinition.Create(data, version);
            if (definition != null)
            {
                this.definitions[definition.Id] = definition;
                string key = string.Empty;
                if (string.IsNullOrEmpty(definition.Name)) key = definition.Id.ToString();
                else key = definition.Name;
                this.DefinitionsByName[definition.Type][key] = definition;

                //Extension point
                if (addNodeAction != null) this.addNodeAction(definition);

                if (definition.Type == HeroDefinition.Types.Node)
                {
                    this.AddNode(definition as HeroNodeDef);
                }
            }
        }

        public void SortRoot()
        {
            this.root.Sort();
        }

        public Dictionary<ulong, HeroDefinition> Definitions
        {
            get
            {
                return this.definitions;
            }
        }

        public static GOM Instance
        {
            get
            {
                if (instance == null)
                {
                    instance = new GOM();
                }
                return instance;
            }
        }
    }
}

