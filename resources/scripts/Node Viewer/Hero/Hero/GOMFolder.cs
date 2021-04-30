namespace Hero
{
    using Hero.Definition;
    using System;
    using System.Collections.Generic;

    public class GOMFolder : IComparable<GOMFolder>
    {
        public Dictionary<string, GOMFolder> dictNameToFolder = new Dictionary<string, GOMFolder>();
        public List<GOMFolder> Folders = new List<GOMFolder>();
        public string Name;
        public HeroNodeDef Node;

        public int CompareTo(GOMFolder other)
        {
            return string.Compare(this.Name, other.Name);
        }

        public GOMFolder CreateFolder(string name)
        {
            GOMFolder item = this.GetFolder(name);
            if (item == null)
            {
                item = new GOMFolder {
                    Name = name
                };
                this.Folders.Add(item);
                this.dictNameToFolder[name] = item;
            }
            return item;
        }

        public GOMFolder GetFolder(string name)
        {
            GOMFolder folder = null;
            this.dictNameToFolder.TryGetValue(name, out folder);
            return folder;
        }

        public void SetNode(HeroNodeDef node)
        {
            this.Node = node;
        }

        public void Sort()
        {
            foreach (GOMFolder folder in this.Folders)
            {
                folder.Sort();
            }
            this.Folders.Sort();
        }

        public override string ToString()
        {
            return this.Name;
        }
    }
}

