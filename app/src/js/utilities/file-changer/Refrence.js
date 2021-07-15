function loadArchive(f) {
    var ftOffset = 0;
    var ftCapacity = 1000;
    var fr = new FileReader();
    fr.onload = function (e) {
      var dv = new DataView(e.target.result);
      if (dv.getUint32(0, !0) !== 0x50594d) return;
      if (dv.getUint32(4, !0) !== 5) return;
      if (dv.getUint32(8, !0) !== 0xfd23ec43) return;
      ftOffset = dv.getUint32(12, !0);
      if (ftOffset === 0) return;
      var readFiles = function (f) {
        const fr = new FileReader();
        fr.onload = function (e) {
          const dv = new DataView(e.target.result);
          ftOffset = dv.getUint32(4, !0);
          for (let i = 0; i < ftCapacity; i++) {
            const offset = dv.getUint32(12 + 34 * i + 0, !0);
            if (offset === 0) break;
            const metadataSize = dv.getUint32(12 + 34 * i + 8, !0);
            const comprSize = dv.getUint32(12 + 34 * i + 12, !0);
            const uncomprSize = dv.getUint32(12 + 34 * i + 16, !0);
            const sh = dv.getUint32(12 + 34 * i + 20, !0);
            const ph = dv.getUint32(12 + 34 * i + 24, !0);
            const compression = dv.getUint16(12 + 34 * i + 32, !0);
            let obj = Object.create(null);
            obj.a = f;
            obj.offset = offset + metadataSize;
            obj.size = uncomprSize;
            obj.comprSize = compression !== 0 ? comprSize : 0;
            window.files[sh + "|" + ph] = obj;
          }
          if (ftOffset !== 0) {
            readFiles(f);
          } else {
            checkLoaded();
          }
        };
        {
          let blob = f.slice(ftOffset, ftOffset + 12 + ftCapacity * 34);
          fr.readAsArrayBuffer(blob);
        }
      };
      readFiles(f);
    };
    {
      let blob = f.slice(0, 16);
      fr.readAsArrayBuffer(blob);
    }
}

const archiveRead = (index,file)=>{
  let ftOffset = 0;
  let ftCapacity = 1000;
  const fileName = file.name;
  let readGom = !1;
  if (fileName === 'swtor_main_global_1.tor' || fileName === 'swtor_test_main_global_1.tor') {
      postMessage(['FOUNDGOM']);
      readGom = !0;
      gomArchive.a = file;
      gomArchive.files = Object.create(null)
  }
  const readFiles = ()=>{
      const blob = file.slice(ftOffset, ftOffset + 12 + ftCapacity * 34);
      const fr = new FileReader();
      fr.onload = (e)=>{
          const dv = new DataView(e.target.result);
          const newCapacity = dv.getUint32(0, !0);
          if (newCapacity !== ftCapacity) {
              console.log('Expected capacity of', ftCapacity, 'but saw capacity', newCapacity, 'in', fileName);
              ftCapacity = newCapacity;
              return readFiles()
          }
          ftOffset = dv.getUint32(4, !0);
          const fileArr = [];
          let numNamedFiles = 0;
          for (let i = 12, c = 12 + ftCapacity * 34; i < c; i += 34) {
              let offset = dv.getUint32(i, !0);
              if (offset === 0)
                  continue;
              offset += dv.getUint32(i + 8, !0);
              const comprSize = dv.getUint32(i + 12, !0);
              const uncomprSize = dv.getUint32(i + 16, !0);
              const sh = dv.getUint32(i + 20, !0);
              const ph = dv.getUint32(i + 24, !0);
              if (sh === 0xC75A71E6 && ph === 0xE4B96113)
                  continue;
              if (sh === 0xCB34F836 && ph === 0x8478D2E1)
                  continue;
              if (sh === 0x02C9CF77 && ph === 0xF077E262)
                  continue;
              const compression = dv.getUint8(i + 32);
              const fileObj = Object.create(null);
              fileObj.sh = sh;
              fileObj.ph = ph;
              fileObj.offset = offset;
              fileObj.size = uncomprSize;
              fileObj.comprSize = (compression !== 0) ? comprSize : 0;
              fileObj.name = undefined;
              const hash = sh + '|' + ph;
              if (fileNames[hash] !== undefined) {
                  fileObj.name = fileNames[hash];
                  numNamedFiles++
              }
              fileArr.push(fileObj);
              if (readGom) {
                  gomArchive.files[hash] = fileObj
              }
          }
          if (ftOffset !== 0) {
              postMessage(['ARCHIVEUPDATE', index, fileArr, numNamedFiles]);
              return readFiles()
          } else {
              postMessage(['ARCHIVEDONE', index, fileArr, numNamedFiles]);
              archivesLoading--;
              if (archivesLoading === 0 && gomArchive.a) {
                  loadGom()
              }
              return undefined
          }
      };
      fr.onerror = ()=>{
          postMessage(['ARCHIVEERROR', index, 'File read error']);
          archivesLoading--;
          if (archivesLoading === 0 && gomArchive.a) {
              loadGom()
          }
      };
      fr.readAsArrayBuffer(blob)
  };
  const fr = new FileReader();
  fr.onload = (evt)=>{
      const dv = new DataView(evt.target.result);
      if (dv.getUint32(0, !0) !== 0x50594d) {
          return postMessage(['ARCHIVEERROR', index, 'Not a .tor file (Wrong file header)'])
      }
      if (dv.getUint32(4, !0) !== 5) {
          return postMessage(['ARCHIVEERROR', index, 'Only version 5 is supported, file has ' + dv.getUint32(4, !0)])
      }
      if (dv.getUint32(8, !0) !== 0xFD23EC43) {
          return postMessage(['ARCHIVEERROR', index, 'Unexpected byte order'])
      }
      ftOffset = dv.getUint32(12, !0);
      if (ftOffset === 0) {
          return postMessage(['ARCHIVEERROR', index, 'File is empty'])
      }
      archivesLoading++;
      return readFiles()
  };
  fr.onerror = ()=>postMessage(['ARCHIVEERROR', index, 'File read error']);
  {
      const blob = file.slice(0, 16);
      fr.readAsArrayBuffer(blob)
  }
}
function loadBucket(bktIndex, dv) {
  const magic = dv.getUint32(0, !0);
  if (magic !== 0x4B554250)
      return postMessage(['NODES', []]);
  const versionMajor = dv.getUint16(4, !0);
  const versionMinor = dv.getUint16(6, !0);
  if (versionMajor !== 2 || versionMinor !== 5)
      return postMessage(['NODES', []]);
  let pos = 8;
  const length = dv.byteLength - 12;
  const nodes = [];
  while (pos < length) {
      const dblbLength = dv.getUint32(pos, !0);
      pos += 4;
      const dblbStartOffset = pos;
      const dblbMagic = dv.getUint32(pos, !0);
      pos += 4;
      const dblbVersion = dv.getUint32(pos, !0);
      pos += 4;
      while (dblbStartOffset + dblbLength - pos >= 4) {
          const startOffset = pos;
          const tmpLength = dv.getUint32(pos, !0);
          pos += 4;
          if (tmpLength === 0)
              break;
          pos += 4;
          const idLo = dv.getUint32(pos, !0);
          pos += 4;
          const idHi = dv.getUint32(pos, !0);
          pos += 4;
          const id = uint64(idLo, idHi);
          const type = dv.getUint16(pos, !0);
          pos += 2;
          const dataOffset = dv.getUint16(pos, !0);
          pos += 2;
          const nameOffset = dv.getUint16(pos, !0);
          pos += 2;
          pos += 2;
          const baseClassLo = dv.getUint32(pos, !0);
          pos += 4;
          const baseClassHi = dv.getUint32(pos, !0);
          pos += 4;
          const baseClass = uint64(baseClassLo, baseClassHi);
          pos += 8;
          const uncomprLength = dv.getUint16(pos, !0);
          pos += 2;
          pos += 2;
          const uncomprOffset = dv.getUint16(pos, !0);
          pos += 2;
          pos += 2;
          const streamStyle = dv.getUint8(pos++);
          const name = readString(dv, startOffset + nameOffset);
          const dataLength = tmpLength - dataOffset;
          const node = Object.create(null);
          node.id = id;
          node.fqn = name;
          node.baseClass = baseClass;
          node.bkt = bktIndex;
          node.isBucket = !0;
          node.dataOffset = startOffset + dataOffset;
          node.dataLength = dataLength;
          node.contentOffset = uncomprOffset - dataOffset;
          node.uncomprLength = uncomprLength;
          node.streamStyle = streamStyle;
          nodes.push(node);
          pos = dblbStartOffset + ((startOffset - dblbStartOffset + tmpLength + 7) & -8)
      }
  }
  postMessage(['NODES', nodes])
};
function loadPrototypes() {};
function loadGom() {
  const frOnload = function(evt) {
      const dv = new DataView(evt.target.result);
      return loadBucket(this.index, dv)
  };
  const frOnerror = ()=>{
      console.log('Could not open this file; there was an error while reading the archive.');
      postMessage(['NODES', []])
  };
  for (let i = 0; i < 500; i++) {
      const hashArr = hashlittle2('/resources/systemgenerated/buckets/' + i + '.bkt');
      const file = gomArchive.files[hashArr[1] + '|' + hashArr[0]];
      if (file) {
          const fr = new FileReader();
          fr.index = i;
          fr.onload = frOnload;
          fr.onerror = frOnerror;
          {
              const blob = gomArchive.a.slice(file.offset, file.offset + file.size);
              fr.readAsArrayBuffer(blob)
          }
      } else {
          postMessage(['NODES', []])
      }
  }
  {
      const hashArr = hashlittle2('/resources/systemgenerated/prototypes.info');
      const file = gomArchive.files[hashArr[1] + '|' + hashArr[0]];
      if (file) {
          const fr = new FileReader();
          fr.onload = (evt)=>{};
          fr.onerror = ()=>{
              console.log('Could not open prototypes.info file; there was an error while reading the file.')
          };
          {
              const blob = gomArchive.a.slice(file.offset, file.offset + file.size);
              fr.readAsArrayBuffer(blob)
          }
          loadPrototypes()
      }
  }
}