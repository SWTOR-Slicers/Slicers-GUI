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