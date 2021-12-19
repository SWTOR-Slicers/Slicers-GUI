import { GOM } from "../util/Gom.js";
import { RawDeflate } from "../../externals/Inflate.js";
import { readVarInt, uint64_add, uint64C, assert, cleanString, readString, serializeMap } from "../../Util.js";
import { log } from "../../universal/Logger.js";

const fs = require('fs');
const path = require('path');
const xmlJS = require('xml-js');

const DOM_TYPES = {};
DOM_TYPES.ID = 1;
DOM_TYPES.INTEGER = 2;
DOM_TYPES.BOOLEAN = 3;
DOM_TYPES.FLOAT = 4;
DOM_TYPES.ENUM = 5;
DOM_TYPES.STRING = 6;
DOM_TYPES.LIST = 7;
DOM_TYPES.LOOKUPLIST = 8;
DOM_TYPES.CLASS = 9;
DOM_TYPES.SCRIPTREF = 14;
DOM_TYPES.NODEREF = 15;
DOM_TYPES.VECTOR3 = 18;
DOM_TYPES.TIMEINTERVAL = 20;
DOM_TYPES.DATE = 21;

function domTypeToString(type) {
    switch (type) {
    case 1:
        return 'ID';
    case 2:
        return 'Integer';
    case 3:
        return 'Boolean';
    case 4:
        return 'Float';
    case 5:
        return 'Enum';
    case 6:
        return 'String';
    case 7:
        return 'List';
    case 8:
        return 'LookupList';
    case 9:
        return 'Class';
    case 14:
        return 'ScriptRef';
    case 15:
        return 'NodeRef';
    case 18:
        return 'Vector3';
    case 20:
        return 'TimeInterval';
    case 21:
        return 'Date';
    default:
        return 'Unknown (' + type + ')'
    }
}

function fileNodeReadfield(dv, pos, id, type) {
    const out = {};
    out.len = 0;
    out.val = null;
    switch (type) {
    case DOM_TYPES.ID:
        out.val = readVarInt(dv, pos);
        out.len = out.val.len;
        break;
    case DOM_TYPES.INTEGER:
        out.val = readVarInt(dv, pos);
        out.len = out.val.len;
        break;
    case DOM_TYPES.BOOLEAN:
        {
            const bool = dv.getUint8(pos);
            if (bool === 0)
                out.val = !1;
            else if (bool === 1)
                out.val = !0;
            else {
                out.val = !1;
                console.log('Unexpected bool', bool)
            }
            out.len = 1;
            break
        }
    case DOM_TYPES.FLOAT:
        out.val = dv.getFloat32(pos, !0);
        out.len = 4;
        break;
    case DOM_TYPES.ENUM:
        out.val = readVarInt(dv, pos);
        out.len = out.val.len;
        break;
    case DOM_TYPES.STRING:
        {
            const strLength = readVarInt(dv, pos);
            out.val = readString(dv.buffer, pos + strLength.len, strLength.intLo);
            out.len = strLength.len + strLength.intLo;
            break
        }
    case DOM_TYPES.LIST:
        {
            const listType = dv.getUint8(pos);
            const count1V = readVarInt(dv, pos + 1);
            let length = 1 + count1V.len;
            const count1 = count1V.intLo;
            const count2V = readVarInt(dv, pos + length);
            length += count2V.len;
            const count2 = count2V.intLo;
            assert(count1 === count2, 'Expected 1st and 2nd count in list to be identical but they were not (' + count1 + ' != ' + count2 + ')');
            out.val = {};
            out.val.type = listType;
            out.val.list = [];
            for (let i = 0; i < count1; i++) {
                const index = readVarInt(dv, pos + length);
                length += index.len;
                assert(index.intLo === i + 1, 'Expected list index to be identical to iterator but it was ' + index.intLo + ' instead of ' + (i + 1));
                const ele = fileNodeReadfield(dv, pos + length, '0', listType);
                out.val.list[i] = ele.val;
                length += ele.len
            }
            out.len = length;
            break
        }
    case DOM_TYPES.LOOKUPLIST:
        {
            const indexerType = dv.getUint8(pos);
            const listType = dv.getUint8(pos + 1);
            const count1V = readVarInt(dv, pos + 2);
            let length = 2 + count1V.len;
            const count1 = count1V.intLo;
            const count2V = readVarInt(dv, pos + length);
            length += count2V.len;
            const count2 = count2V.intLo;
            assert(count1 === count2, 'Expected 1st and 2nd count in lookuplist to be identical but they were not (' + count1 + ' != ' + count2 + ')');
            out.val = {};
            out.val.indexType = indexerType;
            out.val.type = listType;
            out.val.list = [];
            for (let i = 0; i < count1; i++) {
                if (dv.getUint8(pos + length) === 0xD2)
                    length++;
                out.val.list[i] = {};
                const key = fileNodeReadfield(dv, pos + length, '0', indexerType);
                out.val.list[i].key = key.val;
                length += key.len;
                const ele = fileNodeReadfield(dv, pos + length, '0', listType);
                out.val.list[i].val = ele.val;
                length += ele.len
            }
            out.len = length;
            break
        }
    case DOM_TYPES.CLASS:
        {
            const const7 = dv.getUint8(pos);
            const numFieldsV = readVarInt(dv, pos + 1);
            const numFields = numFieldsV.intLo;
            let length = 1 + numFieldsV.len;
            let prevId = '0';
            out.val = [];
            for (let i = 0; i < numFields; i++) {
                out.val[i] = {};
                const idOffset = readVarInt(dv, pos + length);
                length += idOffset.len;
                prevId = uint64_add(prevId, uint64C(idOffset));
                out.val[i].id = prevId;
                out.val[i].type = dv.getUint8(pos + length);
                length++;
                const obj = fileNodeReadfield(dv, pos + length, prevId, out.val[i].type);
                out.val[i].val = obj.val;
                length += obj.len
            }
            out.len = length;
            break
        }
    case DOM_TYPES.SCRIPTREF:
        {
            out.val = readVarInt(dv, pos);
            out.len = out.val.len;
            break
        }
    case DOM_TYPES.NODEREF:
        {
            out.val = readVarInt(dv, pos);
            out.len = out.val.len;
            break
        }
    case DOM_TYPES.VECTOR3:
        {
            out.val = [dv.getFloat32(pos, !0), dv.getFloat32(pos + 4, !0), dv.getFloat32(pos + 8, !0)];
            out.len = 12;
            break
        }
    case DOM_TYPES.TIMEINTERVAL:
        {
            out.val = readVarInt(dv, pos);
            out.len = out.val.len;
            break
        }
    case DOM_TYPES.DATE:
        {
            out.val = readVarInt(dv, pos);
            out.len = out.val.len;
            break
        }
    default:
        console.log('Warning: Unexpected DOM data type ', type)
    }
    return out
}

function parseNode(node, obj, _dom) {
    const frag = document.createDocumentFragment();
    {
        const p = document.createElement('p');
        p.className = "node-header";
        let formatName = '';
        formatName += '<span style="color: #ccc">' + node.path + '</span>';
        formatName += '<span style="color: #fff">' + node.fileName + '</span>';
        p.innerHTML = '<b style="color: var(--background-yellow-slicers);">Node FQN:</b> <mark>' + formatName + '</mark><br/><b style="color: var(--background-yellow-slicers);">ID:</b> <mark>' + node.id + '</mark><br/><b style="color: var(--background-yellow-slicers);">base class:</b> <mark>' + (GOM.classes[node.baseClass] || node.baseClass) + '</mark>';
        frag.appendChild(p)
    }
    {
        const table = document.createElement('table');
        table.className = 'node-table';
        table.style.marginTop = '0px';
        const thead = document.createElement('thead');
        thead.innerHTML = '<tr style="color: var(--background-yellow-slicers);"><th>Field name</th><th>Field ID</th><th>Type</th><th>Value</th></tr>';
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        for (let i = 0, il = obj.length; i < il; i++) {
            const tr = document.createElement('tr');
            tr.childRows = [];
            const field = obj[i];
            let html = `<td><div><mark>` + (GOM.fields[field.id] || field.id) + '</mark></div></td>' + '<td style="color:#777"><div><mark>' + field.id + '</mark></div></td>' + '<td style="color:#ccc"><div><mark>' + domTypeToString(field.type) + '</mark></div></td><td><div><mark>';
            html += nodeFieldToHtml(field.type, field.value, tr, 2, field, _dom, node.id);
            html += '</mark></div></td>';
            tr.innerHTML = html;
            nodeFieldAppendToTable(tbody, tr)
        }
        table.appendChild(tbody);
        frag.appendChild(table)
    }
    return frag;
}
function nodeFieldTypeToHtml(type, value, _dom) {
    switch (type) {
    case DOM_TYPES.ID:
    case DOM_TYPES.INTEGER:
    case DOM_TYPES.SCRIPTREF:
    case DOM_TYPES.NODEREF:
    case DOM_TYPES.TIMEINTERVAL:
        return uint64C(value);
    case DOM_TYPES.ENUM:
        return uint64C(value);
    case DOM_TYPES.DATE:
        {
            const milliseconds = uint64C(value);
            const d = new Date(Number(milliseconds));
            d.setFullYear(d.getFullYear() - 369);
            const addZero = n=>(n < 10 ? '0' + n : '' + n);
            return d.getUTCFullYear() + '-' + addZero(d.getUTCMonth() + 1) + '-' + addZero(d.getUTCDate()) + ' ' + addZero(d.getUTCHours()) + ':' + addZero(d.getUTCMinutes()) + ':' + addZero(d.getUTCMinutes())
        }
    case DOM_TYPES.BOOLEAN:
    case DOM_TYPES.FLOAT:
    case DOM_TYPES.STRING:
        return value.toString();
    default:
        return '[Type not recognized]'
    }
}
function nodeFieldToHtml(type, value, tr, level, field, _dom) {
    switch (type) {
    case DOM_TYPES.ID:
    case DOM_TYPES.INTEGER:
    case DOM_TYPES.SCRIPTREF:
    case DOM_TYPES.NODEREF:
    case DOM_TYPES.TIMEINTERVAL:
        return uint64C(value);
    case DOM_TYPES.BOOLEAN:
    case DOM_TYPES.FLOAT:
    case DOM_TYPES.STRING:
        return cleanString(value.toString());
    case DOM_TYPES.DATE:
        {
            const milliseconds = uint64C(value);
            const d = new Date(Number(milliseconds));
            d.setFullYear(d.getFullYear() - 369);
            const addZero = n=>(n < 10 ? '0' + n : '' + n);
            return d.getUTCFullYear() + '-' + addZero(d.getUTCMonth() + 1) + '-' + addZero(d.getUTCDate()) + ' ' + addZero(d.getUTCHours()) + ':' + addZero(d.getUTCMinutes()) + ':' + addZero(d.getUTCMinutes())
        }
    case DOM_TYPES.LIST:
        for (let i = 0, il = value.list.length; i < il; i++) {
            const curRow = document.createElement('tr');
            curRow.childRows = [];
            let html = `<td><div><div style="height: 1px;width: ${10 * level}px;"></div><mark>` + i + '</mark></div></td>' + '<td><div></div></td>' + '<td style="color:#ccc"><div><mark>' + domTypeToString(value.type) + '</mark></div></td><td><div><mark>';
            html += nodeFieldToHtml(value.type, value.list[i], curRow, level + 1, value[i], _dom);
            html += '</mark></div></td>';
            curRow.innerHTML = html;
            tr.childRows.push(curRow)
        }
        return '<span style="color:#ccc">Type: ' + domTypeToString(value.type) + '  |  Length: ' + value.list.length + '</span>';
    case DOM_TYPES.LOOKUPLIST:
        for (let i = 0, l = value.list.length; i < l; i++) {
            const curRow = document.createElement('tr');
            curRow.childRows = [];
            let html = `<td><div><div style="height: 1px;width: ${10 * level}px;"></div><mark>` + nodeFieldTypeToHtml(value.indexType, value.list[i].key, _dom) + '</mark></div></td>' + '<td><div></div></td>' + '<td style="color:#ccc"><div><mark>' + domTypeToString(value.type) + '</mark></div></td><td><div><mark>';
            html += nodeFieldToHtml(value.type, value.list[i].val, curRow, level + 1, value[i], _dom);
            html += '</mark></div></td>';
            curRow.innerHTML = html;
            tr.childRows.push(curRow)
        }
        return '<span style="color:#ccc">Key: ' + domTypeToString(value.indexType) + '  |  Value: ' + domTypeToString(value.type) + '  |  Length: ' + value.list.length + '</span>';
    case DOM_TYPES.CLASS:
        for (let i = 0, l = value.length; i < l; i++) {
            const curRow = document.createElement('tr');
            curRow.childRows = [];
            let html = `<td><div><div style="height: 1px;width: ${10 * level}px;"></div><mark>` + (GOM.fields[value[i].id] || value[i].id) + '</mark></div></td>' + '<td style="color:#777"><div><mark>' + value[i].id + '</mark></div></td>' + '<td style="color:#ccc"><div><mark>' + domTypeToString(value[i].type) + '</mark></div></td><td><div><mark>';
            html += nodeFieldToHtml(value[i].type, value[i].val, curRow, level + 1, value[i], _dom);
            html += '</mark></div></td>';
            curRow.innerHTML = html;
            tr.childRows.push(curRow)
        }
        return '<span style="color:#ccc">Num fields: ' + value.length + '</span>';
    case DOM_TYPES.VECTOR3:
        return value[0] + ', ' + value[1] + ', ' + value[2];
    case DOM_TYPES.ENUM:
        return _dom[2][_dom[3][field.id].data].values[uint64C(value)-1];
    default:
        return '[Type not recognized]'
    }
}
function nodeFieldAppendToTable(tbody, tr) {
    tbody.appendChild(tr);
    for (let i = 0, l = tr.childRows.length; i < l; i++) {
        nodeFieldAppendToTable(tbody, tr.childRows[i])
    }
}

function parseNodeFields(type, value) {
    switch (type) {
    case DOM_TYPES.ID:
    case DOM_TYPES.INTEGER:
    case DOM_TYPES.SCRIPTREF:
    case DOM_TYPES.NODEREF:
    case DOM_TYPES.TIMEINTERVAL:
        return uint64C(value);
    case DOM_TYPES.ENUM:
        return uint64C(value);
    case DOM_TYPES.BOOLEAN:
    case DOM_TYPES.FLOAT:
    case DOM_TYPES.STRING:
        return cleanString(value.toString());
    case DOM_TYPES.DATE:
        {
            const milliseconds = uint64C(value);
            const d = new Date(Number(milliseconds));
            d.setFullYear(d.getFullYear() - 369);
            const addZero = n=>(n < 10 ? '0' + n : '' + n);
            return d.getUTCFullYear() + '-' + addZero(d.getUTCMonth() + 1) + '-' + addZero(d.getUTCDate()) + ' ' + addZero(d.getUTCHours()) + ':' + addZero(d.getUTCMinutes()) + ':' + addZero(d.getUTCMinutes())
        }
    case DOM_TYPES.LIST:
        const retList = {
            "list": [],
            "type": domTypeToString(value.type)
        };
        for (let i = 0, il = value.list.length; i < il; i++) {
            retList.list.push(parseNodeFields(value.type, value.list[i], i));
        }
        return retList;
    case DOM_TYPES.LOOKUPLIST:
        const lutObj = new Map();
        for (let i = 0, l = value.list.length; i < l; i++) {
            lutObj.set(uint64C(value.list[i].key), {
                "Id": uint64C(value.list[i].key),
                "type": domTypeToString(value.type),
                "value": parseNodeFields(value.type, value.list[i].val, uint64C(value.list[i].key))
            });
        }
        return lutObj;
    case DOM_TYPES.CLASS:
        const classObj = new Map()
        for (let i = 0, l = value.length; i < l; i++) {
            classObj.set((GOM.fields[value[i].id] || value[i].id), {
                "Id": value[i].id,
                "type": domTypeToString(value[i].type),
                "value": parseNodeFields(value[i].type, value[i].val)
            });
        }
        return classObj;
    case DOM_TYPES.VECTOR3:
        return {
            "x": value[0],
            "y": value[1],
            "z": value[2]
        };
    default:
        return '[Type not recognized]'
    }
}

function convertToJSON(obj, node, _dom) {
    const retJSON = {};
    retJSON[GOM.classes[node.baseClass] || node.baseClass] = new Map();

    for (let i = 0; i < obj.length; i++) {
        const field = obj[i];
        const type = domTypeToString(field.type);
        retJSON[GOM.classes[node.baseClass] || node.baseClass].set((GOM.fields[field.id] || field.id), {
            "Id": field.id,
            "type": type,
            "value": type == 'Enum' ? _dom[2][_dom[3][field.id].data].values[uint64C(field.value)-1] : parseNodeFields(field.type, field.value)
        });
    }

    return retJSON;
}

function formatEntr(obj) {
    const retVal = {
        
    };

    let numLists = 0;
    let numLookupLists = 0;
    let numNodes = 0;
    let numClasses = 0;
    const incriments = {
        "Node0": 0,
        "Class0": 0,
        "List0": 0,
        "IList0": 0,
        "reset": function() {
            this.Node0 = 0;
            this.Class0 = 0;
            this.List0 = 0;
            this.IList0 = 0;
        }
    }
    if (obj instanceof Map) {
        for (const [key, value] of obj) {
            switch (value.type) {
            case 'List':
                incriments.reset();
                retVal[`List${numLists}`] = {
                    "_attributes": {
                        "Id": key,
                        "type": value.type
                    }
                }
                for (let i = 0; i < value.value.list.length; i++) {
                    const prepMap = new Map();
                    prepMap.set(i, {
                        "Id": i,
                        "type": value.value.type,
                        "value": value.value.list[i]
                    });
                    const res = formatEntr(prepMap);
                    const resKeys = Object.keys(res);
                    for (const key of resKeys) {
                        retVal[`List${numLists}`][`${key}${incriments[key]}`] = res[key];
                        incriments[key]++;
                    }
                }
                numLists++;
                break;
            case 'LookupList':
                incriments.reset();
                retVal[`IList${numLookupLists}`] = {
                    "_attributes": {
                        "Id": key,
                        "type": value.type
                    }
                }
                for (const [key2, value2] of value.value) {
                    const prepMap = new Map();
                    prepMap.set(key2, {
                        "Id": key2,
                        "type": value2.type,
                        "value": value2.value
                    });
                    const res = formatEntr(prepMap);
                    const resKeys = Object.keys(res);
                    for (const key of resKeys) {
                        retVal[`IList${numLookupLists}`][`${key}${incriments[key]}`] = res[key];
                        incriments[key]++;
                    }
                }
                numLookupLists++;
                break;
            case 'Class':
                retVal[`Class${numClasses}`] = formatEntr(value.value);
                retVal[`Class${numClasses}`]["_attributes"] = {
                    "Id": key,
                    "type": value.type,
                }
                numClasses++;
                break;
            case 'ID':
            case 'Integer':
            case 'Boolean':
            case 'Float':
            case 'Enum':
            case 'String':
            case 'ScriptRef':
            case 'NodeRef':
            case 'Vector3':
            case 'TimeInterval':
            case 'Date':
            case 'Unknown (' + value.type + ')':
                retVal[`Node${numNodes}`] = {
                    "_text": value.value,
                    "_attributes": {
                        "Id": key,
                        "type": value.type,
                    }
                }
                numNodes++;
            }
        }
    } else {
        throw new Error('Expected type of map but recieved other.')
    }

    return retVal;
}

function convertToXML(obj, node, _dom) {
    const parsed = convertToJSON(obj, node);
    const className = Object.keys(parsed)[0];
    const prepObj = {};
    prepObj[className] = formatEntr(parsed[className]);
    prepObj[className]["_attributes"] = {
        "Id": GOM.fields[node.id] || node.id,
        "Name": node.fqn
    }
    const xmlStr = xmlJS.js2xml(prepObj, {
        compact: true,
        spaces: 4,
        elementNameFn: function(n) {
            if (n.indexOf('Node') == 0) {
                return 'Node';
            } else if (n.indexOf('List') == 0) {
                return 'List';
            } else if (n.indexOf('IList') == 0) {
                return 'IList';
            } else if (n.indexOf('Class') == 0) {
                return 'Class';
            } else {
                return n;
            }
        }
    });

    return '<?xml version="1.0" encoding="utf-8"?>\n' + xmlStr;
}

class Node {
    /**
     * An object wrapper for the TOR GOM Node type.
     * @param  {NodeEntr} node Node entry representing the table entry for this node.
     * @param  {Uint8Array} data The sliced data represeting the node itself.
     * @param  {Object} _dom Representation of the ClientGOM that is used to look up info.
     */
    constructor(node, data, _dom) {
        this.fqn = node.fqn;
        this.uncompressedSize = node.uncomprLength;
        const comprArray = new Uint8Array(data);
        this.compressedSize = comprArray.length;
        node.uncomprBuffLength = 0x500000;
        const uncomprBuffer = new ArrayBuffer(node.uncomprBuffLength);
        RawDeflate.inflate(comprArray, uncomprBuffer);
        const dv = new DataView(uncomprBuffer);
        let pos = node.contentOffset;
        if (node.uncomprBuffLength > 0) {
            if (node.streamStyle >= 1 && node.streamStyle <= 6) {
                const unkO = readVarInt(dv, pos);
                pos += unkO.len
            }
            const numFieldsO = readVarInt(dv, pos);
            pos += numFieldsO.len;
            const numFields = numFieldsO.intLo;
            this.numFields = numFields;
            const obj = [];
            let prevId = '0';
            for (let i = 0; i < numFields; i++) {
                const field = {};
                const idOffset = readVarInt(dv, pos);
                pos += idOffset.len;
                prevId = uint64_add(prevId, uint64C(idOffset));
                field.id = prevId;
                field.type = dv.getUint8(pos++);
                const fieldRet = fileNodeReadfield(dv, pos, prevId, field.type);
                pos += fieldRet.len;
                field.value = fieldRet.val;
                obj.push(field)
            }
            this.node = node;
            this._dom = _dom;
            this.obj = obj;
        }
    }

    render(parent, dataContainer) {
        const data = parseNode(this.node, this.obj, this._dom);
        parent.appendChild(data);

        dataContainer.innerHTML = `
        <div class="data-entr-cont">
            <div class="data-entr-label">Parent:</div>
            <div class="data-entr-val">${(this.fqn.indexOf(".") > -1) ? this.fqn.substring(0, this.fqn.lastIndexOf(".")) : "none"}</div>
        </div>
        <div class="data-entr-cont">
            <div class="data-entr-label">Compressed:</div>
            <div class="data-entr-val">${this.compressedSize} B</div>
        </div>
        <div class="data-entr-cont">
            <div class="data-entr-label">Uncompressed:</div>
            <div class="data-entr-val">${this.uncompressedSize} B</div>
        </div>
        <div class="data-entr-cont">
            <div class="data-entr-label">Num Fields:</div>
            <div class="data-entr-val">${this.numFields}</div>
        </div>
        <div class="data-entr-cont">
            <div class="data-entr-label">Node Type:</div>
            <div class="data-entr-val">Bucket</div>
        </div>
        `;
    }

    extract(dest, type) {
        let data;
        switch (type) {
            case "raw":
                const dat = fs.readFileSync(this.node.torPath);
                data = dat.buffer.slice(this.node.bkt.offset + this.node.dataOffset + 2, this.node.bkt.offset + this.node.dataOffset + this.node.dataLength - 4);
                break;
            case "xml":
                data = convertToXML(this.obj, this.node, this._dom);
                break;
            case "json":
                data = JSON.stringify(convertToJSON(this.obj, this.node, this._dom), serializeMap, '\t');
                break;
        }

        if (fs.existsSync(dest)) {
            if (data) {
                fs.writeFileSync(path.join(dest, `${this.fqn}.${type == "raw" ? "node" : type}`), data);
                log(`Sucessfully extracted node to a .${type == "raw" ? "node" : type} file`, 'info');
            } else {
                log("Error reading the node data: data is null.", "error");
            }
        } else {
            log("Invalid node extract path.", "error");
        }
    }
}

class ProtoNode {
    /**
     * An object wrapper for the TOR GOM Node type.
     * @param  {NodeEntr} node Node entry representing the table entry for this node.
     * @param  {ArrayBuffer} data The sliced data represeting the node itself.
     * @param  {Object} _dom Representation of the ClientGOM that is used to look up info.
     */
    constructor(node, data, _dom) {
        this.fqn = node.fqn;
        const dv = new DataView(data);
        let pos = 0;
        if (data.byteLength > 0) {
            const scriptTypeRes = readVarInt(dv, pos);
            pos += scriptTypeRes.len;

            const numFieldsRes = readVarInt(dv, pos);
            pos += numFieldsRes.len;
            const numFields = uint64C(numFieldsRes);
            this.numFields = numFields;
            const obj = [];

            let fieldId = BigInt(0);
            for (let i = 0; i < numFields; i++) {
                const fieldIdRes = readVarInt(dv, pos);
                pos += fieldIdRes.len;
                const fieldIdComp = uint64C(fieldIdRes);
                fieldId = fieldId + BigInt(fieldIdComp);

                let field = _dom['3'][fieldId];
                let fieldType;
                if (!field) {
                    field = {};
                    // No idea what kind of field this is, so we'll skip it but we still need to read the data..
                    fieldType = new Uint8Array(dv.buffer, pos, 1)[0];
                    if (fieldType == null) continue;
                } else {
                    fieldType = field.gomType;

                    // Confirm the type matches
                    if (!confirmType(dv, pos, field.gomType)) {
                        throw new Error("Unexpected field type for field " + field.Name);
                    }
                }
                pos++;

                const fieldValue = fileNodeReadfield(dv, pos, fieldId, fieldType);
                pos += fieldValue.len;

                // Save data to resulting script object
                const fieldName = field.name || GOM.fields[fieldId] || field.id;

                const fieldRet = {};
                fieldRet.id = fieldId;
                fieldRet.name = fieldName;
                fieldRet.type = fieldType;
                fieldRet.value = fieldValue.val;

                obj.push(fieldRet);
            }

            this.node = node;
            this._dom = _dom;
            this.obj = obj;
        }
    }

    render(parent, dataContainer) {
        const data = parseNode(this.node, this.obj, this._dom);
        parent.appendChild(data);

        dataContainer.innerHTML = `
        <div class="data-entr-cont">
            <div class="data-entr-label">Parent:</div>
            <div class="data-entr-val">${(this.fqn.indexOf(".") > -1) ? this.fqn.substring(0, this.fqn.lastIndexOf(".")) : "none"}</div>
        </div>
        <div class="data-entr-cont">
            <div class="data-entr-label">Compressed:</div>
            <div class="data-entr-val">${this.node.proto.data.comprSize} B</div>
        </div>
        <div class="data-entr-cont">
            <div class="data-entr-label">Uncompressed:</div>
            <div class="data-entr-val">${this.node.proto.data.size} B</div>
        </div>
        <div class="data-entr-cont">
            <div class="data-entr-label">Num Fields:</div>
            <div class="data-entr-val">${this.numFields}</div>
        </div>
        <div class="data-entr-cont">
            <div class="data-entr-label">Node Type:</div>
            <div class="data-entr-val">Prototype</div>
        </div>
        `;
    }

    extract(dest, type) {
        let data;
        switch (type) {
            case "raw":
                const dat = fs.readFileSync(this.node.torPath);
                let torData = null;
                if (this.node.proto.data.isCompressed) {
                    const blob = dat.slice(this.node.proto.data.offset, this.node.proto.data.offset + this.node.proto.data.comprSize);
                    const decompressed = this.node.decomprFunc({
                        buffer: Buffer.from(blob),
                        dataLength: this.node.proto.data.size
                    });
                    torData = decompressed.buffer;
                } else {
                    const blob = dat.slice(this.node.proto.data.offset, this.node.proto.data.offset + this.node.proto.data.size);
                    torData = blob;
                }

                data = torData.slice(this.dataOffset + 2, this.dataOffset + this.dataLength - 4);
                break;
            case "xml":
                data = convertToXML(this.obj, this.node, this._dom);
                break;
            case "json":
                data = JSON.stringify(convertToJSON(this.obj, this.node, this._dom), serializeMap, '\t');
                break;
        }

        if (fs.existsSync(dest)) {
            if (data) {
                fs.writeFileSync(path.join(dest, `${this.fqn}.${type == "raw" ? "node" : type}`), data);
                log(`Sucessfully extracted node to a .${type == "raw" ? "node" : type} file`, 'info');
            } else {
                log("Error reading the node data: data is null.", "error");
            }
        } else {
            log("Invalid node extract path.", "error");
        }
    }
}

function confirmType(dv, pos, exType) {
    const type = new Uint8Array(dv.buffer, pos, 1)[0];
    return type == exType;
}

class NodeEntr {
    constructor(nodeJson, torPath, _dom, decomprFunc) {
        this.id = nodeJson.id;
        this.fqn = nodeJson.fqn;
        this.baseClass = nodeJson.baseClass;
        this[nodeJson.isBucket ? 'bkt' : 'proto'] = nodeJson.isBucket ? nodeJson.bkt : nodeJson.proto;
        this.isBucket = nodeJson.isBucket;
        this.dataOffset = nodeJson.dataOffset;
        this.dataLength = nodeJson.dataLength;
        this.contentOffset = nodeJson.contentOffset;
        this.uncomprLength = nodeJson.uncomprLength;
        this.streamStyle = nodeJson.streamStyle;
        this.torPath = torPath;
        this._dom = _dom;
        if (decomprFunc) {
            this.decomprFunc = decomprFunc;
        }
    }

    render(parent, dataContainer, refSet) {
        refSet(this);
        this.readNode();
        this.node.render(parent, dataContainer);
    }

    readNode() {
        if (this.isBucket) {
            if (!this.node) {
                const data = fs.readFileSync(this.torPath);

                const blob = data.buffer.slice(this.bkt.offset + this.dataOffset + 2, this.bkt.offset + this.dataOffset + this.dataLength - 4);
                const node = new Node(this, blob, this._dom);
                this.node = node;
            }
            this.node.render(parent, dataContainer);
        } else {
            if (!this.node) {
                const data = fs.readFileSync(this.torPath);
                let torData = null;
                if (this.proto.data.isCompressed) {
                    const blob = data.slice(this.proto.data.offset, this.proto.data.offset + this.proto.data.comprSize);
                    const decompressed = this.decomprFunc({
                        buffer: Buffer.from(blob),
                        dataLength: this.proto.data.size
                    });
                    torData = decompressed.buffer;
                } else {
                    const blob = data.slice(this.proto.data.offset, this.proto.data.offset + this.proto.data.size);
                    torData = blob;
                }

                const blob = torData.slice(this.dataOffset, this.dataOffset + this.dataLength);
                const node = new ProtoNode(this, blob, this._dom);
                this.node = node;
            }
        }
    }
}

export {Node, NodeEntr, DOM_TYPES}