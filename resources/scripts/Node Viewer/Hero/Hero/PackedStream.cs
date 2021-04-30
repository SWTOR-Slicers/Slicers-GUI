namespace Hero
{
    using System;
    using System.IO;
    using System.Runtime.CompilerServices;
    using System.Runtime.InteropServices;
    using System.Text;

    public class PackedStream : OmegaStream
    {
        public bool[] Flags;

        public PackedStream(int style, Stream stream) : base(stream)
        {
            this.Style = style;
            this.Flags = new bool[6];
            switch (style)
            {
                case 0:
                    return;

                case 1:
                    this.Flags[0] = true;
                    this.Flags[2] = true;
                    this.Flags[3] = true;
                    return;

                case 2:
                    this.Flags[1] = true;
                    this.Flags[0] = true;
                    this.Flags[2] = true;
                    this.Flags[3] = true;
                    return;

                case 3:
                    this.Flags[1] = true;
                    this.Flags[0] = true;
                    this.Flags[5] = true;
                    this.Flags[2] = true;
                    this.Flags[3] = true;
                    return;

                case 4:
                    this.Flags[0] = true;
                    this.Flags[5] = true;
                    this.Flags[2] = true;
                    this.Flags[3] = true;
                    return;

                case 5:
                    this.Flags[3] = true;
                    this.Flags[0] = true;
                    return;

                case 6:
                    this.Flags[1] = true;
                    this.Flags[3] = true;
                    return;

                case 7:
                case 8:
                    this.Flags[2] = true;
                    this.Flags[4] = true;
                    this.Flags[5] = true;
                    return;

                case 9:
                case 10:
                    this.Flags[5] = true;
                    this.Flags[2] = true;
                    this.Flags[0] = true;
                    return;
            }
            throw new InvalidDataException("Invalid stream style");
        }

        protected int BytesNeeded(ulong value)
        {
            for (int i = 7; i >= 0; i--)
            {
                if ((value & (((ulong) 0xffL) << (i * 8))) != 0L)
                {
                    return (i + 1);
                }
            }
            return 0;
        }

        public void CheckEnd()
        {
            byte num = base.ReadByte();
            if (base.TransportVersion > 1)
            {
                if (num != 0xd3)
                {
                    throw new SerializingException("Invalid token in stream");
                }
            }
            else if (num != 0xff)
            {
                throw new SerializingException("Invalid token in stream");
            }
        }

        public void Read(out bool value)
        {
            value = false;
            byte num = base.ReadByte();
            if (base.TransportVersion > 1)
            {
                switch (num)
                {
                    case 0:
                        value = false;
                        return;

                    case 1:
                        value = true;
                        return;
                }
                throw new SerializingException("Invalid value for bool");
            }
            switch (num)
            {
                case 0x80:
                    value = false;
                    return;

                case 0x81:
                    value = true;
                    return;
            }
            throw new SerializingException("Invalid token in stream");
        }

        public void Read(out long value)
        {
            ulong num;
            value = 0L;
            if (base.TransportVersion > 1)
            {
                byte length = base.ReadByte();
                if (length < 0xc0)
                {
                    value = length;
                }
                else if (((byte) (length + 0x38)) > 7)
                {
                    if (((byte) (length + 0x40)) > 7)
                    {
                        if (length != 0xd0)
                        {
                            throw new SerializingException("Invalid token in stream");
                        }
                        value = -9223372036854775808L;
                    }
                    length = (byte) (length - 0xbf);
                    this.ReadPacked(out num, length);
                    value = -((long)num);
                }
                else
                {
                    length = (byte) (length - 0xc7);
                    this.ReadPacked(out num, length);
                    value = (long) num;
                }
            }
            else
            {
                byte num3 = base.ReadByte();
                if (num3 < 0x80)
                {
                    value = num3;
                }
                else if (((byte) (num3 + 0x60)) > 15)
                {
                    if (((byte) (num3 + 0x70)) > 15)
                    {
                        if (num3 != 0x8f)
                        {
                            throw new SerializingException("Invalid token in stream");
                        }
                        value = -9223372036854775808L;
                    }
                    num3 = (byte) (num3 - 0x8f);
                    this.ReadPacked(out num, num3);
                    value = -((long)num);
                }
                else
                {
                    num3 = (byte) (num3 - 0x9f);
                    this.ReadPacked(out num, num3);
                    value = (long) num;
                }
            }
        }

        public void Read(out float value)
        {
            value = 0f;
            if (base.TransportVersion > 1)
            {
                value = BitConverter.ToSingle(BitConverter.GetBytes(base.ReadUInt()), 0);
            }
            else
            {
                if (base.ReadByte() != 130)
                {
                    throw new SerializingException("Invalid token in stream");
                }
                value = BitConverter.ToSingle(BitConverter.GetBytes(base.ReadUInt()), 0);
            }
        }

        public void Read(out string str)
        {
            ulong num2;
            str = "";
            if ((base.TransportVersion <= 1) && (base.ReadByte() != 0x89))
            {
                throw new SerializingException("Invalid token in stream");
            }
            this.Read(out num2);
            if (num2 != 0L)
            {
                str = Encoding.ASCII.GetString(base.ReadBytes((uint) num2));
            }
        }

        public void Read(out ulong value)
        {
            byte length = (byte) base.Stream.ReadByte();
            value = 0L;
            if (base.TransportVersion > 1)
            {
                if (length >= 0xc0)
                {
                    if ((length < 200) || (length > 0xcf))
                    {
                        throw new SerializingException("Invalid token in stream");
                    }
                    length = (byte) (length - 0xc7);
                    this.ReadPacked(out value, length);
                }
                else
                {
                    value = length;
                }
            }
            else if (length >= 0x80)
            {
                if ((length < 0xb0) || (length > 0xbf))
                {
                    throw new SerializingException("Invalid token in stream");
                }
                length = (byte) (length - 0xaf);
                this.ReadPacked(out value, length);
            }
            else
            {
                value = length;
            }
        }

        public void Read(out byte[] data)
        {
            ulong num2;
            data = null;
            if ((base.TransportVersion <= 1) && (base.ReadByte() != 0x85))
            {
                throw new SerializingException("Invalid token in stream");
            }
            this.Read(out num2);
            data = base.ReadBytes((uint) num2);
        }

        public void Read(out uint a, out uint b)
        {
            ulong num = 0L;
            if (this.Flags[3])
            {
                this.Read(out num);
                a = (uint) num;
                this.Read(out num);
                b = (uint) num;
            }
            else
            {
                this.Read(out num);
                a = (uint) num;
                b = (uint) num;
            }
        }

        protected void ReadPacked(out ulong value, int length)
        {
            value = 0L;
            if (length <= 8)
            {
                byte[] buffer = base.ReadBytes((uint) length);
                for (byte i = 0; i < length; i = (byte) (i + 1))
                {
                    value = (value << 8) | buffer[i];
                }
            }
        }

        public void ReadVersion(out ulong value)
        {
            value = 0L;
            byte num = base.ReadByte();
            if (base.TransportVersion > 1)
            {
                if (num != 0xd1)
                {
                    throw new SerializingException("Invalid token in stream");
                }
            }
            else if (num != 0xfe)
            {
                throw new SerializingException("Invalid token in stream");
            }
            this.Read(out value);
        }

        public void Write(bool value)
        {
            if (base.TransportVersion > 1)
            {
                if (!value)
                {
                    base.WriteByte(0);
                }
                else if (value)
                {
                    base.WriteByte(1);
                }
            }
            else if (!value)
            {
                base.WriteByte(0x80);
            }
            else if (value)
            {
                base.WriteByte(0x81);
            }
        }

        public void Write(float value)
        {
            if (base.TransportVersion > 1)
            {
                base.WriteBytes(BitConverter.GetBytes(value));
            }
            else
            {
                base.WriteByte(130);
                base.WriteBytes(BitConverter.GetBytes(value));
            }
        }

        public void Write(byte[] data)
        {
            if (base.TransportVersion <= 1)
            {
                base.WriteByte(0x85);
            }
            this.Write((ulong) data.Length);
            base.WriteBytes(data);
        }

        public void Write(long value)
        {
            if (base.TransportVersion > 1)
            {
                if ((value >= 0L) && (value < 0xc0L))
                {
                    base.WriteByte((byte) value);
                }
                else if (value >= 0xc0L)
                {
                    ulong num = (ulong) value;
                    int length = this.BytesNeeded(num);
                    base.WriteByte((byte) (0xc7 + length));
                    this.WritePacked(num, length);
                }
                else if (value == -9223372036854775808L)
                {
                    base.WriteByte(0xd0);
                }
                else
                {
                    ulong num3 = (ulong) -value;
                    int num4 = this.BytesNeeded(num3);
                    base.WriteByte((byte) (0xbf + num4));
                    this.WritePacked(num3, num4);
                }
            }
            else if ((value >= 0L) && (value < 0x80L))
            {
                base.WriteByte((byte) value);
            }
            else if (value >= 0x80L)
            {
                ulong num5 = (ulong) value;
                int num6 = this.BytesNeeded(num5);
                base.WriteByte((byte) (0x9f + num6));
                this.WritePacked(num5, num6);
            }
            else if (value == -9223372036854775808L)
            {
                base.WriteByte(0x8f);
            }
            else
            {
                ulong num7 = (ulong) -value;
                int num8 = this.BytesNeeded(num7);
                base.WriteByte((byte) (0x8f + num8));
                this.WritePacked(num7, num8);
            }
        }

        public void Write(string str)
        {
            if (base.TransportVersion <= 1)
            {
                base.WriteByte(0x89);
            }
            if ((str == null) || (str.Length == 0))
            {
                this.Write((ulong) 0L);
            }
            else
            {
                byte[] bytes = Encoding.ASCII.GetBytes(str);
                this.Write((ulong) bytes.Length);
                base.WriteBytes(bytes);
            }
        }

        public void Write(ulong value)
        {
            if (base.TransportVersion > 1)
            {
                if (value < 0xc0L)
                {
                    base.WriteByte((byte) value);
                }
                else
                {
                    int length = this.BytesNeeded(value);
                    base.WriteByte((byte) (0xc7 + length));
                    this.WritePacked(value, length);
                }
            }
            else if (value < 0x80L)
            {
                base.WriteByte((byte) value);
            }
            else
            {
                int num2 = this.BytesNeeded(value);
                base.WriteByte((byte) (0xaf + num2));
                this.WritePacked(value, num2);
            }
        }

        public void Write(int a, int b)
        {
            if (this.Flags[3])
            {
                this.Write((ulong) a);
                this.Write((ulong) b);
            }
            else
            {
                if (a != b)
                {
                    throw new SerializingException("counters must be equal for this stream type");
                }
                this.Write((ulong) a);
            }
        }

        public void WriteEnd()
        {
            if (base.TransportVersion > 1)
            {
                base.WriteByte(0xd3);
            }
            else
            {
                base.WriteByte(0xff);
            }
        }

        protected void WritePacked(ulong value, int length)
        {
            byte[] buffer = new byte[length];
            byte[] bytes = BitConverter.GetBytes(value);
            for (int i = 0; i < length; i++)
            {
                buffer[i] = bytes[(length - i) - 1];
            }
            base.WriteBytes(buffer);
        }

        public void WriteVersion(ulong value)
        {
            if (base.TransportVersion > 1)
            {
                base.WriteByte(0xd1);
            }
            else
            {
                base.WriteByte(0xfe);
            }
            this.Write(value);
        }

        public int Style { get; set; }
    }
}

