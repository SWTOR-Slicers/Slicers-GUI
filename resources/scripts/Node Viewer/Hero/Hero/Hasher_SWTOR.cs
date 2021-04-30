using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Hero.EasyMyp
{
    public partial class Hasher
    {
        private void HashSWTOR(string s, uint seed)
        {

            #region MyRegion
            //MOV EAX,DWORD PTR SS:[ESP+C]
            //MOV ECX,DWORD PTR SS:[ESP+4]
            //PUSH EBX
            //PUSH EBP
            //MOV EBP,DWORD PTR SS:[ESP+10]
            //PUSH ESI
            //LEA ESI,DWORD PTR DS:[EAX+EBP+DEADBEEF]
            //PUSH EDI
            //MOV EDI,ESI
            //MOV EBX,ESI
            //CMP EBP,0C
            //JBE swtor.009C5C46 
            #endregion

            eax = ecx = edx = ebx = esi = edi = 0;
            ebx = edi = esi = (uint)s.Length + seed;

            int i = 0;

            for (i = 0; i + 12 < s.Length; i += 12)
            {
                #region MyRegion
                //MOVZX EAX,BYTE PTR DS:[ECX+7]
                //MOVZX EDX,BYTE PTR DS:[ECX+6]
                //SHL EAX,8
                //ADD EAX,EDX
                //MOVZX EDX,BYTE PTR DS:[ECX+5]
                //SHL EAX,8
                //ADD EAX,EDX
                //MOVZX EDX,BYTE PTR DS:[ECX+4]
                //ADD EDX,EDI
                //SHL EAX,8
                //LEA EDI,DWORD PTR DS:[EDX+EAX] 
                #endregion
                edi = (uint)((s[i + 7] << 24) | (s[i + 6] << 16) | (s[i + 5] << 8) | s[i + 4]) + edi; // can be a sum instead of ors if one multiplies correctly
                #region MyRegion
                //MOVZX EAX,BYTE PTR DS:[ECX+B]
                //MOVZX EDX,BYTE PTR DS:[ECX+A]
                //SHL EAX,8
                //ADD EAX,EDX
                //MOVZX EDX,BYTE PTR DS:[ECX+9]
                //SHL EAX,8
                //ADD EAX,EDX
                //MOVZX EDX,BYTE PTR DS:[ECX+8]
                //ADD EDX,ESI
                //SHL EAX,8
                //LEA ESI,DWORD PTR DS:[EDX+EAX] 
                #endregion
                esi = (uint)((s[i + 11] << 24) | (s[i + 10] << 16) | (s[i + 9] << 8) | s[i + 8]) + esi;
                #region MyRegion
                //MOVZX EAX,BYTE PTR DS:[ECX+3]
                //MOVZX EDX,BYTE PTR DS:[ECX+2]
                //SHL EAX,8
                //ADD EAX,EDX
                //MOVZX EDX,BYTE PTR DS:[ECX+1]
                //SHL EAX,8
                //ADD EAX,EDX
                //MOVZX EDX,BYTE PTR DS:[ECX]
                //SHL EAX,8
                //ADD EAX,EDX 
                //SUB EAX,ESI
                #endregion
                eax = (uint)((s[i + 3] << 24) | (s[i + 2] << 16) | (s[i + 1] << 8) | s[i]) - esi; // edx in war, but same anyway

                #region MyRegion
                //eax = eax + ebx;                // ADD EAX,EBX
                //edx = esi;                      // MOV EDX,ESI
                //edx = edx >> 0x1C;              // SHR EDX,1C
                //eax = eax ^ edx;                // XOR EAX,EDX
                //edx = esi;                      // MOV EDX,ESI
                //edx = edx << 4;                 // SHL EDX,4
                //eax = eax ^ edx;                // XOR EAX,EDX 
                #endregion
                eax = ((eax + ebx) ^ (esi >> 0x1C)) ^ (esi << 4);
                esi = esi + edi;                // ADD ESI,EDI
                #region MyRegion
                // SUB EDI,EAX
                // MOV EDX,EAX
                // SHR EDX,1A
                // XOR EDI,EDX
                // MOV EDX,EAX
                // SHL EDX,6
                // XOR EDI,EDX 
                #endregion
                edi = ((edi - eax) ^ (eax >> 0x1A)) ^ (eax << 6);
                eax = eax + esi;                // ADD EAX,ESI
                #region MyRegion
                // SUB ESI,EDI
                // MOV EDX,EDI
                // SHR EDX,18
                // XOR ESI,EDX
                // MOV EDX,EDI
                // SHL EDX,8
                // XOR ESI,EDX 
                #endregion
                esi = ((esi - edi) ^ (edi >> 0x18)) ^ (edi << 8);
                edi = edi + eax;                // ADD EDI,EAX
                #region MyRegion
                // SUB EAX,ESI
                // MOV EDX,ESI
                // SHR EDX,10
                // XOR EAX,EDX
                // MOV EDX,ESI
                // SHL EDX,10
                // XOR EAX,EDX 
                #endregion
                eax = ((eax - esi) ^ (esi >> 0x10)) ^ (esi << 0x10);
                esi = esi + edi;                // ADD ESI,EDI
                #region MyRegion
                // MOV EBX,EAX
                // SUB EDI,EBX
                // SHL EAX,13
                // XOR EDI,EAX
                // MOV EDX,EBX
                // SHR EDX,0D
                // XOR EDI,EDX 
                #endregion
                ebx = eax;
                edi = ((edi - ebx) ^ (ebx << 0x13)) ^ (ebx >> 0x0D);
                ebx = ebx + esi;                // ADD EBX,ESI
                #region MyRegion
                // MOV EAX,EDI
                // SUB ESI,EDI
                // SHR EAX,1C
                // MOV EDX,EDI
                // XOR ESI,EAX
                // SHL EDX,4
                // XOR ESI,EDX 
                #endregion
                esi = ((esi - edi) ^ (edi >> 0x1C)) ^ (edi << 4);
                edi = edi + ebx;// ADD EDI,EBX
            }

            if (s.Length - i > 0)
            {
                switch (s.Length - i)
                {
                    case 12:
                        #region MyRegion
                        //MOVZX EAX,BYTE PTR DS:[ECX+B]
                        //SHL EAX,18
                        //ADD ESI,EAX 
                        #endregion
                        esi += (uint)s[i + 11] << 24;
                        goto case 11;
                    case 11:
                        #region MyRegion
                        //MOVZX EDX,BYTE PTR DS:[ECX+A]
                        //SHL EDX,10
                        //ADD ESI,EDX 
                        #endregion
                        esi += (uint)s[i + 10] << 16;
                        goto case 10;
                    case 10:
                        #region MyRegion
                        //MOVZX EAX,BYTE PTR DS:[ECX+9]
                        //SHL EAX,8
                        //ADD ESI,EAX 
                        #endregion
                        esi += (uint)s[i + 9] << 8;
                        goto case 9;
                    case 9:
                        #region MyRegion
                        //MOVZX EDX,BYTE PTR DS:[ECX+8]
                        //ADD ESI,EDX 
                        #endregion
                        esi += (uint)s[i + 8];
                        goto case 8;
                    case 8:
                        #region MyRegion
                        //MOVZX EAX,BYTE PTR DS:[ECX+7]
                        //SHL EAX,18
                        //ADD EDI,EAX 
                        #endregion
                        edi += (uint)s[i + 7] << 24;
                        goto case 7;
                    case 7:
                        #region MyRegion
                        //MOVZX EDX,BYTE PTR DS:[ECX+6]
                        //SHL EDX,10
                        //ADD EDI,EDX 
                        #endregion
                        edi += (uint)s[i + 6] << 16;
                        goto case 6;
                    case 6:
                        #region MyRegion
                        //MOVZX EAX,BYTE PTR DS:[ECX+5]
                        //SHL EAX,8
                        //ADD EDI,EAX 
                        #endregion
                        edi += (uint)s[i + 5] << 8;
                        goto case 5;
                    case 5:
                        #region MyRegion
                        //MOVZX EDX,BYTE PTR DS:[ECX+4]
                        //ADD EDI,EDX 
                        #endregion
                        edi += (uint)s[i + 4];
                        goto case 4;
                    case 4:
                        #region MyRegion
                        //MOVZX EAX,BYTE PTR DS:[ECX+3]
                        //SHL EAX,18
                        //ADD EBX,EAX 
                        #endregion
                        ebx += (uint)s[i + 3] << 24;
                        goto case 3;
                    case 3:
                        #region MyRegion
                        //MOVZX EDX,BYTE PTR DS:[ECX+2]
                        //SHL EDX,10
                        //ADD EBX,EDX 
                        #endregion
                        ebx += (uint)s[i + 2] << 16;
                        goto case 2;
                    case 2:
                        #region MyRegion
                        //MOVZX EAX,BYTE PTR DS:[ECX+1]
                        //SHL EAX,8
                        //ADD EBX,EAX 
                        #endregion
                        ebx += (uint)s[i + 1] << 8;
                        goto case 1;
                    case 1:
                        #region MyRegion
                        //MOVZX ECX,BYTE PTR DS:[ECX]
                        //ADD EBX,ECX  
                        #endregion
                        ebx += (uint)s[i];
                        break;


                }

                #region MyRegion
                /*
                esi = esi ^ edi;                    // XOR ESI,EDI
                edx = edi;                          // MOV EDX,EDI
                edx = edx >> 0x12;                  // SHR EDX,12
                eax = edi;                          // MOV EAX,EDI
                eax = eax << 0x0E;                  // SHL EAX,0E
                edx = edx ^ eax;                    // XOR EDX,EAX
                esi = esi - edx;                    // SUB ESI,EDX
                */
                #endregion
                esi = (esi ^ edi) - ((edi >> 0x12) ^ (edi << 0x0E));
                #region MyRegion
                /*
                edx = esi;                          // MOV EDX,ESI
                edx = edx >> 0x15;                  // SHR EDX,15
                eax = esi;                          // MOV EAX,ESI
                eax = eax << 0x0B;                  // SHL EAX,0B
                edx = edx ^ eax;                    // XOR EDX,EAX
                ecx = esi;                          // MOV ECX,ESI
                ecx = ecx ^ ebx;                    // XOR ECX,EBX
                ecx = ecx - edx;                    // SUB ECX,EDX
                */

                #endregion
                ecx = (esi ^ ebx) - ((esi >> 0x15) ^ (esi << 0x0B));
                #region MyRegion
                /*
                edx = ecx;                          // MOV EDX,ECX
                edx = edx << 0x19;                  // SHL EDX,19
                eax = ecx;                          // MOV EAX,ECX
                edi = edi ^ ecx;                    // XOR EDI,ECX
                eax = eax >> 0x07;                  // SHR EAX,7
                edx = edx ^ eax;                    // XOR EDX,EAX
                edi = edi - edx;                    // SUB EDI,EDX
                */

                #endregion
                edi = (edi ^ ecx) - ((ecx << 0x19) ^ (ecx >> 0x07));
                #region MyRegion
                /*
                esi = esi ^ edi;                    // XOR ESI,EDI
                edx = edi;                          // MOV EDX,EDI
                edx = edx >> 0x10;                  // SHR EDX,10
                eax = edi;                          // MOV EAX,EDI
                eax = eax << 0x10;                  // SHL EAX,10
                edx = edx ^ eax;                    // XOR EDX,EAX
                esi = esi - edx;                    // SUB ESI,EDX
                */

                #endregion
                esi = (esi ^ edi) - ((edi >> 0x10) ^ (edi << 0x10));
                #region MyRegion
                //eax = esi;                          // MOV EAX,ESI
                //esi = esi >> 0x1C;                  // SHR ESI,1C
                //edx = eax;                          // MOV EDX,EAX
                //edx = edx << 4;                     // SHL EDX,4
                //esi = esi ^ edx;                    // XOR ESI,EDX
                //edx = eax;                          // MOV EDX,EAX
                //edx = edx ^ ecx;                    // XOR EDX,ECX
                //edx = edx - esi;                    // SUB EDX,ESI 
                #endregion
                edx = (esi ^ ecx) - ((esi >> 0x1C) ^ (esi << 0x04));
                #region MyRegion
                //ecx = edx;                          // MOV ECX,EDX
                //esi = edx;                          // MOV ESI,EDX
                //ecx = ecx >> 0x12;                  // SHR ECX,12
                //edi = edi ^ edx;                    // XOR EDI,EDX
                //esi = esi << 0x0E;                  // SHL ESI,0E
                //ecx = ecx ^ esi;                    // XOR ECX,ESI
                //edi = edi - ecx;                    // SUB EDI,ECX 
                #endregion
                edi = (edi ^ edx) - ((edx >> 0x12) ^ (edx << 0x0E));
                #region MyRegion
                //edx = edi;                          // MOV EDX,EDI
                //ecx = edi;                          // MOV ECX,EDI
                //eax = eax ^ edi;                    // XOR EAX,EDI
                ////POP EDI
                //edx = edx << 0x18;                  // SHL EDX,18
                //ecx = ecx >> 0x08;                  // SHR ECX,8
                ////POP ESI
                //edx = edx ^ ecx;                    // XOR EDX,ECX
                ////POP EBP
                //eax = eax - edx;                    // SUB EAX,EDX
                ////POP EBX 
                #endregion
                eax = (esi ^ edi) - ((edi >> 0x08) ^ (edi << 0x18));

                ph = edi;
                sh = eax;

                return;                             //RETN
            }
            ph = esi;
            sh = eax;

            // -------------------------
            // POP EDI
            // MOV EAX,ESI
            // POP ESI
            // POP EBP
            // POP EBX
            return;                 // RETN  


        }
    }

    public class TorHasher
    {
        private uint _hashPartOne;
        private uint _hashPartThree;
        private uint _hashPartTwo;
        private int _strReadPos;
        private string _strToHash = "";

        #region Utilities

        private uint GetUInt32FromString(string str, int start)
        {
            byte[] strBytes = Encoding.ASCII.GetBytes(str);

            return BitConverter.ToUInt32(strBytes, _strReadPos + start);
        }

        private ushort GetUInt16FromString(string str, int start)
        {
            byte[] strBytes = Encoding.ASCII.GetBytes(str);

            return BitConverter.ToUInt16(strBytes, _strReadPos + start);
        }

        private byte GetUInt8FromString(string str, int start)
        {
            byte[] strBytes = Encoding.ASCII.GetBytes(str);

            return strBytes[_strReadPos + start];
        }

        #endregion

        private SwitchResult SwitchUseDwords(int val)
        {
            switch (val)
            {
                case 12:
                    _hashPartOne += GetUInt32FromString(_strToHash, 8);
                    goto case 8;

                case 8:
                    _hashPartTwo += GetUInt32FromString(_strToHash, 4);
                    goto case 4;

                case 4:
                    _hashPartThree += GetUInt32FromString(_strToHash, 0);
                    break;

                case 11:
                    _hashPartOne += GetUInt32FromString(_strToHash, 0);
                    _hashPartTwo += GetUInt32FromString(_strToHash, 4);
                    _hashPartThree += (GetUInt32FromString(_strToHash, 8) & 0xffffff);
                    break;

                case 10:
                    _hashPartOne += GetUInt16FromString(_strToHash, 8);
                    _hashPartTwo += GetUInt32FromString(_strToHash, 4);
                    _hashPartThree += GetUInt32FromString(_strToHash, 0);
                    break;

                case 9:
                    _hashPartOne += GetUInt8FromString(_strToHash, 8);
                    _hashPartTwo += GetUInt32FromString(_strToHash, 4);
                    _hashPartThree += GetUInt32FromString(_strToHash, 0);
                    break;

                case 7:
                    _hashPartTwo += (GetUInt32FromString(_strToHash, 4) & 0xffffff);
                    _hashPartThree = GetUInt32FromString(_strToHash, 0);
                    break;

                case 6:
                    _hashPartTwo += GetUInt16FromString(_strToHash, 4);
                    _hashPartThree += GetUInt32FromString(_strToHash, 0);
                    break;

                case 5:
                    _hashPartTwo += GetUInt8FromString(_strToHash, 4);
                    _hashPartThree += GetUInt32FromString(_strToHash, 0);
                    break;

                case 3:
                    _hashPartThree += GetUInt32FromString(_strToHash, 0) & 0xffffff;
                    break;

                case 2:
                    _hashPartThree += GetUInt16FromString(_strToHash, 0);
                    break;

                case 0:
                    return SwitchResult.Final;

                case 1:
                    return SwitchResult.Continue;
            }

            return SwitchResult.Bitmath;
        }

        private void FirstBlockUseDwords(ref int len)
        {
            int numIterations = (len - 13) / 12 + 1;

            while (numIterations-- > 0)
            {
                uint tmp1 = GetUInt32FromString(_strToHash, 0);
                uint tmp2 = GetUInt32FromString(_strToHash, 4) + _hashPartTwo;
                uint tmp3 = GetUInt32FromString(_strToHash, 8) + _hashPartOne;

                uint v12 = 16 * tmp3 ^ (tmp3 >> 28) ^ (_hashPartThree + tmp1 - tmp3);
                uint v13 = tmp2 + tmp3;
                uint v16 = v13 + v12;
                uint v17 = (v12 << 6) ^ (v12 >> 26) ^ (tmp2 - v12);
                uint v18 = (v17 >> 24) ^ (v13 - v17);
                uint v20 = v16 + v17;
                uint v21 = (v17 << 8) ^ v18;
                uint v22 = (v21 << 16) ^ (v21 >> 16) ^ (v16 - v21);
                uint v23 = v20 + v21;
                uint v24 = (v22 >> 13) ^ (v22 << 19) ^ (v20 - v22);

                _hashPartThree = v23 + v22;
                _hashPartOne = 16 * v24 ^ (v24 >> 28) ^ (v23 - v24);
                _hashPartTwo = _hashPartThree + v24;

                len -= 12;
                _strReadPos += 12;
            }
        }

        public void Hash(string stringToHash, ref uint hashOne, ref uint hashTwo)
        {
            stringToHash += '\0';

            _strToHash = stringToHash;

            int len = _strToHash.Length - 1;
            _hashPartTwo = (uint)(hashOne + len + 0xdeadbeef);
            _hashPartThree = (uint)(hashOne + len + 0xdeadbeef);
            _hashPartOne = (hashTwo + _hashPartTwo);

            if (len > 12)
                FirstBlockUseDwords(ref len);

            SwitchResult switchResult = SwitchUseDwords(len);

            if (switchResult == SwitchResult.Final)
            {
                hashOne = _hashPartOne;
                hashTwo = _hashPartTwo;

                return;
            }

            if (switchResult == SwitchResult.Continue)
                _hashPartThree += _strToHash[_strReadPos];

            // Bitmath

            uint v52 = (_hashPartTwo ^ _hashPartOne) - ((_hashPartTwo << 14) ^ (_hashPartTwo >> 18));
            uint v53 = (_hashPartThree ^ v52) - ((v52 << 11) ^ (v52 >> 21));
            uint v54 = (v53 ^ _hashPartTwo) -
                       ((((_hashPartThree ^ v52) - ((v52 << 11) ^ (v52 >> 21))) >> 7) ^
                        (((_hashPartThree ^ v52) - ((v52 << 11) ^ (v52 >> 21))) << 25));

            uint v55 = (v54 ^ v52) - ((v54 << 16) ^ (v54 >> 16));
            uint v56 = (v53 ^ v55) - (16 * v55 ^ (v55 >> 28));
            _hashPartTwo = (v56 ^ v54) - ((v56 << 14) ^ (v56 >> 18));
            _hashPartOne = (_hashPartTwo ^ v55) - ((_hashPartTwo >> 8) ^ (_hashPartTwo << 24));

            hashOne = _hashPartOne;
            hashTwo = _hashPartTwo;
        }

        #region Nested type: SwitchResult

        private enum SwitchResult
        {
            Final,
            Bitmath,
            Continue
        }

        #endregion
    }
}
