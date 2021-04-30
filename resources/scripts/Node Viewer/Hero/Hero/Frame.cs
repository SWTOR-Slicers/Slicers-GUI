namespace Hero
{
    using System;
    using System.Text;

    public class Frame
    {
        protected byte[] buffer;
        protected int readPosition;
        protected int writePosition;

        public Frame()
        {
            this.buffer = null;
            this.readPosition = 0;
            this.writePosition = 0;
        }

        public Frame(byte[] data)
        {
            this.buffer = data;
            this.readPosition = 0;
            this.writePosition = this.buffer.Length;
        }

        public void CheckSize(int length)
        {
            if (this.buffer == null)
            {
                this.buffer = new byte[length];
            }
            else if (this.GetAvailForWrite() < length)
            {
                byte[] destinationArray = new byte[this.buffer.Length + length];
                Array.Copy(this.buffer, destinationArray, this.buffer.Length);
                this.buffer = destinationArray;
            }
        }

        public void Empty()
        {
            this.buffer = null;
            this.readPosition = 0;
            this.writePosition = 0;
        }

        public int GetAvailForRead()
        {
            return (this.writePosition - this.readPosition);
        }

        public int GetAvailForWrite()
        {
            if (this.buffer == null)
            {
                return 0;
            }
            return (this.buffer.Length - this.writePosition);
        }

        public byte[] GetBuffer()
        {
            return this.buffer;
        }

        public int GetSize()
        {
            return this.writePosition;
        }

        public uint[] ReadArrayUInt()
        {
            uint num = this.ReadUInt();
            uint[] numArray = new uint[num];
            for (uint i = 0; i < num; i++)
            {
                numArray[i] = this.ReadUInt();
            }
            return numArray;
        }

        public ulong[] ReadArrayULong()
        {
            uint num = this.ReadUInt();
            ulong[] numArray = new ulong[num];
            for (uint i = 0; i < num; i++)
            {
                numArray[i] = this.ReadULong();
            }
            return numArray;
        }

        public bool ReadBool()
        {
            if (this.GetAvailForRead() < 1)
            {
                throw new EndOfBufferException();
            }
            bool flag = BitConverter.ToBoolean(this.buffer, this.readPosition);
            this.readPosition++;
            return flag;
        }

        public byte ReadByte()
        {
            if (this.GetAvailForRead() < 1)
            {
                throw new EndOfBufferException();
            }
            byte num = this.buffer[this.readPosition];
            this.readPosition++;
            return num;
        }

        public byte[] ReadBytes(int length)
        {
            if (this.GetAvailForRead() < length)
            {
                throw new EndOfBufferException();
            }
            byte[] destinationArray = new byte[length];
            Array.Copy(this.buffer, this.readPosition, destinationArray, 0, length);
            this.readPosition += length;
            return destinationArray;
        }

        public void ReadBytes(byte[] value)
        {
            this.ReadBytes(value, 0, value.Length);
        }

        public void ReadBytes(byte[] value, int length)
        {
            this.ReadBytes(value, 0, length);
        }

        public void ReadBytes(byte[] value, int offset, int length)
        {
            if (this.GetAvailForRead() < length)
            {
                throw new EndOfBufferException();
            }
            Array.Copy(this.buffer, this.readPosition, value, offset, length);
            this.readPosition += length;
        }

        public byte[] ReadData()
        {
            uint num = this.ReadUInt();
            if (this.GetAvailForRead() < num)
            {
                throw new EndOfBufferException();
            }
            byte[] destinationArray = new byte[num];
            Array.Copy(this.buffer, (long) this.readPosition, destinationArray, 0L, (long) num);
            this.readPosition += (int) num;
            return destinationArray;
        }

        public double ReadDouble()
        {
            if (this.GetAvailForRead() < 8)
            {
                throw new EndOfBufferException();
            }
            double num = BitConverter.ToDouble(this.buffer, this.readPosition);
            this.readPosition += 8;
            return num;
        }

        public float ReadFloat()
        {
            if (this.GetAvailForRead() < 4)
            {
                throw new EndOfBufferException();
            }
            float num = BitConverter.ToSingle(this.buffer, this.readPosition);
            this.readPosition += 4;
            return num;
        }

        public int ReadInt()
        {
            if (this.GetAvailForRead() < 4)
            {
                throw new EndOfBufferException();
            }
            int num = BitConverter.ToInt32(this.buffer, this.readPosition);
            this.readPosition += 4;
            return num;
        }

        public long ReadLong()
        {
            if (this.GetAvailForRead() < 8)
            {
                throw new EndOfBufferException();
            }
            long num = BitConverter.ToInt64(this.buffer, this.readPosition);
            this.readPosition += 8;
            return num;
        }

        public sbyte ReadSByte()
        {
            if (this.GetAvailForRead() < 1)
            {
                throw new EndOfBufferException();
            }
            sbyte num = (sbyte) this.buffer[this.readPosition];
            this.readPosition++;
            return num;
        }

        public short ReadShort()
        {
            if (this.GetAvailForRead() < 2)
            {
                throw new EndOfBufferException();
            }
            short num = BitConverter.ToInt16(this.buffer, this.readPosition);
            this.readPosition += 2;
            return num;
        }

        public string ReadString()
        {
            int num = this.ReadInt();
            if (this.GetAvailForRead() < num)
            {
                throw new EndOfBufferException();
            }
            string str = Encoding.ASCII.GetString(this.buffer, this.readPosition, num - 1);
            this.readPosition += num;
            return str;
        }

        public uint ReadUInt()
        {
            if (this.GetAvailForRead() < 4)
            {
                throw new EndOfBufferException();
            }
            uint num = BitConverter.ToUInt32(this.buffer, this.readPosition);
            this.readPosition += 4;
            return num;
        }

        public ulong ReadULong()
        {
            if (this.GetAvailForRead() < 8)
            {
                throw new EndOfBufferException();
            }
            ulong num = BitConverter.ToUInt64(this.buffer, this.readPosition);
            this.readPosition += 8;
            return num;
        }

        public ushort ReadUShort()
        {
            if (this.GetAvailForRead() < 2)
            {
                throw new EndOfBufferException();
            }
            ushort num = BitConverter.ToUInt16(this.buffer, this.readPosition);
            this.readPosition += 2;
            return num;
        }

        public void SeekToBegin()
        {
            this.readPosition = 0;
        }

        public void Write(bool value)
        {
            this.CheckSize(1);
            this.buffer[this.writePosition] = value ? ((byte) 1) : ((byte) 0);
            this.writePosition++;
        }

        public void Write(byte value)
        {
            this.CheckSize(1);
            this.buffer[this.writePosition] = value;
            this.writePosition++;
        }

        public void Write(double value)
        {
            byte[] bytes = BitConverter.GetBytes(value);
            this.Write(bytes);
        }

        public void Write(short value)
        {
            byte[] bytes = BitConverter.GetBytes(value);
            this.Write(bytes);
        }

        public void Write(int value)
        {
            byte[] bytes = BitConverter.GetBytes(value);
            this.Write(bytes);
        }

        public void Write(byte[] data)
        {
            this.Write(data, 0, data.Length);
        }

        public void Write(long value)
        {
            byte[] bytes = BitConverter.GetBytes(value);
            this.Write(bytes);
        }

        public void Write(sbyte value)
        {
            this.CheckSize(1);
            this.buffer[this.writePosition] = (byte) value;
            this.writePosition++;
        }

        public void Write(float value)
        {
            byte[] bytes = BitConverter.GetBytes(value);
            this.Write(bytes);
        }

        public void Write(string value)
        {
            if (value == null)
            {
                value = "";
            }
            byte[] bytes = Encoding.ASCII.GetBytes(value);
            this.Write((int) (bytes.Length + 1));
            this.Write(bytes);
            this.Write((byte) 0);
        }

        public void Write(ushort value)
        {
            byte[] bytes = BitConverter.GetBytes(value);
            this.Write(bytes);
        }

        public void Write(uint value)
        {
            byte[] bytes = BitConverter.GetBytes(value);
            this.Write(bytes);
        }

        public void Write(ulong value)
        {
            byte[] bytes = BitConverter.GetBytes(value);
            this.Write(bytes);
        }

        public void Write(uint[] data)
        {
            uint length = (uint) data.Length;
            this.Write(length);
            for (uint i = 0; i < length; i++)
            {
                this.Write(data[i]);
            }
        }

        public void Write(ulong[] data)
        {
            uint length = (uint) data.Length;
            this.Write(length);
            for (uint i = 0; i < length; i++)
            {
                this.Write(data[i]);
            }
        }

        public void Write(byte[] data, int offset, int length)
        {
            this.CheckSize(length);
            Array.Copy(data, offset, this.buffer, this.writePosition, length);
            this.writePosition += length;
        }

        public void WriteData(byte[] data)
        {
            if (data == null)
            {
                this.Write(0);
            }
            else
            {
                int length = data.Length;
                this.CheckSize(length + 4);
                this.Write(length);
                Array.Copy(data, 0, this.buffer, this.writePosition, length);
                this.writePosition += length;
            }
        }

        public int ReadPosition
        {
            get
            {
                return this.readPosition;
            }
        }

        public class EndOfBufferException : Exception
        {
            public EndOfBufferException() : base("End of buffer reached.")
            {
            }
        }
    }
}

