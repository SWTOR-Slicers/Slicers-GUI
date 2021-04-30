namespace Hero
{
    using ICSharpCode.SharpZipLib.Zip.Compression;
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Runtime.CompilerServices;
    using System.Runtime.InteropServices;

    public class Repository
    {
        public string extractBasePath;
        protected static Repository instance = new Repository();
        private List<RepositoryFile> repositoryFiles = new List<RepositoryFile>();
        private RepoDirectory rootDirectory = new RepoDirectory();

        public bool AddFile(string name)
        {
            Stream stream = File.Open(name, FileMode.Open, FileAccess.Read, FileShare.Read);
            this.repositoryFiles.Add(new RepositoryFile(stream));
            return true;
        }

        public void ExtractAll(string basePath)
        {
            foreach (RepositoryFile file in this.repositoryFiles)
            {
                foreach (ulong num in file.Files.Keys)
                {
                    RepositoryFileInfo info = file.Files[num];
                    this.ExtractFile(info);
                }
            }
        }

        public void ExtractFile(RepositoryFileInfo info)
        {
            string str;
            Stream file = info.File.GetFile(info);
            if (info.Name != null)
            {
                str = this.extractBasePath + info.Name;
            }
            else
            {
                str = string.Format("{0}/{1:X}.bin", this.extractBasePath, info.Hash);
            }
            str = str.Replace('/', '\\');
            RepoDirectory rootDirectory = this.rootDirectory;
            string[] strArray = info.Name.Split(new char[] { '/' });
            string path = this.extractBasePath + @"\";
            for (int i = 1; i < (strArray.Length - 1); i++)
            {
                if (rootDirectory.SubDirectories.ContainsKey(strArray[i]))
                {
                    rootDirectory = rootDirectory.SubDirectories[strArray[i]];
                }
                else
                {
                    RepoDirectory directory2 = new RepoDirectory {
                        Name = strArray[i]
                    };
                    rootDirectory.SubDirectories[strArray[i]] = directory2;
                    rootDirectory = directory2;
                }
                path = path + strArray[i] + @"\";
            }
            if (!rootDirectory.Files.Contains(strArray[strArray.Length - 1]))
            {
                rootDirectory.Files.Add(strArray[strArray.Length - 1]);
            }
            Directory.CreateDirectory(path);
            Stream stream2 = File.Open(str, FileMode.Create, FileAccess.Write);
            byte[] buffer = new byte[file.Length];
            file.Read(buffer, 0, buffer.Length);
            stream2.Write(buffer, 0, buffer.Length);
            file.Close();
            stream2.Close();
        }

        public Stream GetFile(string name)
        {
            RepositoryFileInfo fileInfo = this.GetFileInfo(name);
            if (fileInfo != null)
            {
                return fileInfo.File.GetFile(fileInfo);
            }
            return null;
        }

        public RepositoryFileInfo GetFileInfo(string name)
        {
            ulong hash = Hasher.Hash(name, 0xdeadbeef);
            foreach (RepositoryFile file in this.repositoryFiles)
            {
                RepositoryFileInfo fileInfo = file.GetFileInfo(hash, name);
                if (fileInfo != null)
                {
                    return fileInfo;
                }
            }
            return null;
        }

        public void Initialize(string path)
        {
            foreach (string str in Directory.GetFiles(path, "*.tor"))
            {
                this.AddFile(str);
            }
        }

        public static Repository Instance
        {
            get
            {
                return instance;
            }
        }

        public List<RepositoryFile> RepositoryFiles
        {
            get
            {
                return this.repositoryFiles;
            }
        }

        public static class Hasher
        {
            //public static ulong Hash(string s, uint seed = 0xdeadbeef)
            //{
            //    uint num2;
            //    uint num3;
            //    uint num4;
            //    uint num5;
            //    uint num6;
            //    s = s.ToLower();
            //    uint num = num3 = num4 = num2 = num5 = num6 = 0;
            //    num2 = num6 = num5 = ((uint) s.Length) + seed;
            //    int num7 = 0;
            //    num7 = 0;
            //    while ((num7 + 12) < s.Length)
            //    {
            //        num6 = (uint)(((((s[num7 + 7] << 0x18) | (s[num7 + 6] << 0x10)) | (s[num7 + 5] << 8)) | s[num7 + 4]) + num6);
            //        num5 = (uint)(((((s[num7 + 11] << 0x18) | (s[num7 + 10] << 0x10)) | (s[num7 + 9] << 8)) | s[num7 + 8]) + num5);
            //        num = (uint)(((((s[num7 + 3] << 0x18) | (s[num7 + 2] << 0x10)) | (s[num7 + 1] << 8)) | s[num7]) - num5);
            //        num = ((num + num2) ^ (num5 >> 0x1c)) ^ (num5 << 4);
            //        num5 += num6;
            //        num6 = ((num6 - num) ^ (num >> 0x1a)) ^ (num << 6);
            //        num += num5;
            //        num5 = ((num5 - num6) ^ (num6 >> 0x18)) ^ (num6 << 8);
            //        num6 += num;
            //        num = ((num - num5) ^ (num5 >> 0x10)) ^ (num5 << 0x10);
            //        num5 += num6;
            //        num2 = num;
            //        num6 = ((num6 - num2) ^ (num2 << 0x13)) ^ (num2 >> 13);
            //        num2 += num5;
            //        num5 = ((num5 - num6) ^ (num6 >> 0x1c)) ^ (num6 << 4);
            //        num6 += num2;
            //        num7 += 12;
            //    }
            //    if ((s.Length - num7) <= 0)
            //    {
            //        return ((num5 << 0x20) | num);
            //    }
            //    switch ((s.Length - num7))
            //    {
            //        case 1:
            //            goto Label_028A;

            //        case 2:
            //            goto Label_027B;

            //        case 3:
            //            goto Label_026B;

            //        case 4:
            //            goto Label_025B;

            //        case 5:
            //            goto Label_024C;

            //        case 6:
            //            goto Label_023B;

            //        case 7:
            //            goto Label_0229;

            //        case 8:
            //            goto Label_0217;

            //        case 9:
            //            goto Label_0208;

            //        case 10:
            //            goto Label_01F6;

            //        case 11:
            //            break;

            //        case 12:
            //            num5 += (uint)(s[num7 + 11] << 0x18);
            //            break;

            //        default:
            //            goto Label_0295;
            //    }
            //    num5 += (uint)(s[num7 + 10] << 0x10);
            //Label_01F6:
            //    num5 += (uint)(s[num7 + 9] << 8);
            //Label_0208:
            //    num5 += s[num7 + 8];
            //Label_0217:
            //    num6 += (uint)(s[num7 + 7] << 0x18);
            //Label_0229:
            //    num6 += (uint)(s[num7 + 6] << 0x10);
            //Label_023B:
            //    num6 += (uint)(s[num7 + 5] << 8);
            //Label_024C:
            //    num6 += s[num7 + 4];
            //Label_025B:
            //    num2 += (uint)(s[num7 + 3] << 0x18);
            //Label_026B:
            //    num2 += (uint)(s[num7 + 2] << 0x10);
            //Label_027B:
            //    num2 += (uint)(s[num7 + 1] << 8);
            //Label_028A:
            //    num2 += s[num7];
            //Label_0295:
            //    num5 = (num5 ^ num6) - ((num6 >> 0x12) ^ (num6 << 14));
            //    num3 = (num5 ^ num2) - ((num5 >> 0x15) ^ (num5 << 11));
            //    num6 = (num6 ^ num3) - ((num3 << 0x19) ^ (num3 >> 7));
            //    num5 = (num5 ^ num6) - ((num6 >> 0x10) ^ (num6 << 0x10));
            //    num4 = (num5 ^ num3) - ((num5 >> 0x1c) ^ (num5 << 4));
            //    num6 = (num6 ^ num4) - ((num4 >> 0x12) ^ (num4 << 14));
            //    num = (num5 ^ num6) - ((num6 >> 8) ^ (num6 << 0x18));
            //    return ((num6 << 0x20) | num);
            //}

            public static ulong Hash(string s, uint seed = 0xdeadbeef)
            {
                EasyMyp.Hasher hasher = new EasyMyp.Hasher(EasyMyp.Hasher.HasherType.TOR);
                hasher.Hash(s, seed);

                return (ulong)((((long)hasher.ph) << 32) + hasher.sh);
            }
        }

        public class RepoDirectory
        {
            public List<string> Files = new List<string>();
            public string Name;
            public Dictionary<string, Repository.RepoDirectory> SubDirectories = new Dictionary<string, Repository.RepoDirectory>();
        }

        public class RepositoryFile
        {
            protected Dictionary<ulong, Repository.RepositoryFileInfo> files;

            public RepositoryFile(System.IO.Stream stream)
            {
                this.Stream = stream;
                byte[] buffer = new byte[0x100];
                stream.Read(buffer, 0, 0x100);
                long offset = BitConverter.ToInt64(buffer, 12);
                int capacity = BitConverter.ToInt32(buffer, 0x18);
                this.files = new Dictionary<ulong, Repository.RepositoryFileInfo>(capacity);
                byte[] buffer2 = new byte[12];
                while (offset != 0L)
                {
                    stream.Seek(offset, SeekOrigin.Begin);
                    stream.Read(buffer2, 0, buffer2.Length);
                    int num3 = BitConverter.ToInt32(buffer2, 0);
                    long num4 = BitConverter.ToInt64(buffer2, 4);
                    byte[] buffer3 = new byte[num3 * 0x22];
                    stream.Read(buffer3, 0, buffer3.Length);
                    for (int i = 0; i < num3; i++)
                    {
                        Repository.RepositoryFileInfo info = new Repository.RepositoryFileInfo(buffer3, i) {
                            File = this
                        };
                        this.files[info.Hash] = info;
                    }
                    offset = num4;
                }
            }

            public System.IO.Stream GetFile(Repository.RepositoryFileInfo info)
            {
                byte[] buffer = new byte[info.UncompressedSize];
                switch (info.CompressionMethod)
                {
                    case 0:
                        this.Stream.Seek(info.Offset + info.HeaderSize, SeekOrigin.Begin);
                        this.Stream.Read(buffer, 0, buffer.Length);
                        break;

                    case 1:
                    {
                        this.Stream.Seek(info.Offset + info.HeaderSize, SeekOrigin.Begin);
                        byte[] buffer2 = new byte[info.CompressedSize];
                        this.Stream.Read(buffer2, 0, buffer2.Length);
                        Inflater inflater = new Inflater();
                        inflater.SetInput(buffer2);
                        inflater.Inflate(buffer);
                        break;
                    }
                }
                return new MemoryStream(buffer);
            }

            public Repository.RepositoryFileInfo GetFileInfo(ulong hash, string name)
            {
                if (!this.files.ContainsKey(hash))
                {
                    return null;
                }
                Repository.RepositoryFileInfo info = this.files[hash];
                info.Name = name;
                return info;
            }

            public Dictionary<ulong, Repository.RepositoryFileInfo> Files
            {
                get
                {
                    return this.files;
                }
            }

            public System.IO.Stream Stream { get; set; }
        }

        public class RepositoryFileInfo
        {
            public RepositoryFileInfo(byte[] data, int num)
            {
                int startIndex = 0x22 * num;
                this.Offset = BitConverter.ToInt64(data, startIndex);
                this.HeaderSize = BitConverter.ToInt32(data, startIndex + 8);
                this.CompressedSize = BitConverter.ToInt32(data, startIndex + 12);
                this.UncompressedSize = BitConverter.ToInt32(data, startIndex + 0x10);
                this.Hash = BitConverter.ToUInt64(data, startIndex + 20);
                this.Crc = BitConverter.ToUInt32(data, startIndex + 0x1c);
                this.CompressionMethod = BitConverter.ToUInt16(data, startIndex + 0x20);
            }

            public override string ToString()
            {
                if (this.Name == null)
                {
                    return string.Format("Hash {0:X}", this.Hash);
                }
                return this.Name;
            }

            public int CompressedSize { get; set; }

            public ushort CompressionMethod { get; set; }

            public uint Crc { get; set; }

            public Repository.RepositoryFile File { get; set; }

            public ulong Hash { get; set; }

            public int HeaderSize { get; set; }

            public string Name { get; set; }

            public long Offset { get; set; }

            public int UncompressedSize { get; set; }
        }
    }
}

