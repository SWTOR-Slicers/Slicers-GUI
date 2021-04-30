namespace Hero
{
    using System;
    using System.IO;

    public class PackedStream_2 : PackedStream
    {
        public uint m_10;
        public SerializeStateBase State;

        public PackedStream_2(int style) : base(style, new MemoryStream())
        {
            this.State = null;
            this.m_10 = 0;
            base.TransportVersion = 5;
        }

        public PackedStream_2(int style, Stream stream) : base(style, stream)
        {
            this.State = null;
            this.m_10 = 0;
            base.TransportVersion = 5;
        }

        public PackedStream_2(int style, byte[] data) : base(style, new MemoryStream(data))
        {
            this.State = null;
            this.m_10 = 0;
            base.TransportVersion = 5;
        }
    }
}

