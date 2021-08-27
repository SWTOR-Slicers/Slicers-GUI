import {GOM} from "./util/Gom.js";
import { RawDeflate } from "../externals/Inflate.js";
import { readVarInt, uint64_add, uint64C, assert, testFilename, hashlittle2 } from "../Util.js";
import { STB } from "./STB.js";

const fs = require('fs');

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

const stb = {};
const stbLoading = {};
const filesByHash = {};

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

function readString(dv, pos) {
    let curChar = 0;
    let outName = '';
    while ((curChar = dv.getUint8(pos++)) !== 0) {
        outName += String.fromCharCode(curChar)
    }
    return outName
}

function file_node_readfield(dv, pos, id, type) {
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
            out.val = readString(dv, pos + strLength.len, strLength.intLo);
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
                const ele = file_node_readfield(dv, pos + length, '0', listType);
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
                const key = file_node_readfield(dv, pos + length, '0', indexerType);
                out.val.list[i].key = key.val;
                length += key.len;
                const ele = file_node_readfield(dv, pos + length, '0', listType);
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
                const obj = file_node_readfield(dv, pos + length, prevId, out.val[i].type);
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

function parseNode(node, obj) {
    const frag = document.createDocumentFragment();
    {
        const p = document.createElement('p');
        p.className = "node-header";
        let formatName = '';
        formatName += node.path;
        formatName += '<span style="var(--background-yellow-slicers)">' + node.fileName + '</span>';
        p.innerHTML = '<b>Node FQN:</b> <mark>' + formatName + '</mark><br/><b>ID:</b> <mark>' + node.id + '</mark><b>base class:</b> <mark>' + node.baseClass + '</mark>';
        frag.appendChild(p)
    }
    {
        const table = document.createElement('table');
        table.className = 'node-table';
        table.style.marginTop = '10px';
        const thead = document.createElement('thead');
        thead.innerHTML = '<tr style="color: var(--background-yellow-slicers);"><th>Field name</th><th>Field ID</th><th>Type</th><th>Value</th></tr>';
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        for (let i = 0, il = obj.length; i < il; i++) {
            const tr = document.createElement('tr');
            tr.childRows = [];
            const field = obj[i];
            let html = '<td><span style="var(--background-yellow-slicers);font-family:monospace">-> </span><mark>' + (GOM.fields[field.id] || field.id) + '</mark></td>' + '<td style="color:#777"><mark>' + field.id + '</mark></td>' + '<td style="color:#ccc"><mark>' + domTypeToString(field.type) + '</mark></td><td><mark>';
            html += node_fieldToHtml(field.type, field.value, tr, 2);
            html += '</mark></td>';
            tr.innerHTML = html;
            node_fieldAppendToTable(tbody, tr)
        }
        table.appendChild(tbody);
        frag.appendChild(table)
    }
    return frag;
}
function node_fieldTypeToHtml(type, value) {
    switch (type) {
    case DOM_TYPES.ID:
    case DOM_TYPES.INTEGER:
    case DOM_TYPES.ENUM:
    case DOM_TYPES.SCRIPTREF:
    case DOM_TYPES.NODEREF:
    case DOM_TYPES.TIMEINTERVAL:
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
function node_fieldToHtml(type, value, tr, level) {
    switch (type) {
    case DOM_TYPES.ID:
    case DOM_TYPES.INTEGER:
    case DOM_TYPES.ENUM:
    case DOM_TYPES.SCRIPTREF:
    case DOM_TYPES.NODEREF:
    case DOM_TYPES.TIMEINTERVAL:
        return uint64C(value);
    case DOM_TYPES.BOOLEAN:
    case DOM_TYPES.FLOAT:
    case DOM_TYPES.STRING:
        return value.toString();
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
            let html = '<td><span style="color:#777;font-family:monospace">' + ('|-').repeat(level) + '</span><mark>' + i + '</mark></td>' + '<td></td>' + '<td style="color:#ccc"><mark>' + domTypeToString(value.type) + '</mark></td><td><mark>';
            html += node_fieldToHtml(value.type, value.list[i], curRow, level + 1);
            html += '</mark></td>';
            curRow.innerHTML = html;
            tr.childRows.push(curRow)
        }
        return '<span style="color:#ccc">of type ' + domTypeToString(value.type) + ', length ' + value.list.length + '</span>';
    case DOM_TYPES.LOOKUPLIST:
        for (let i = 0, l = value.list.length; i < l; i++) {
            const curRow = document.createElement('tr');
            curRow.childRows = [];
            let html = '<td><span style="color:#777;font-family:monospace">' + ('|-').repeat(level) + '</span><mark>' + node_fieldTypeToHtml(value.indexType, value.list[i].key) + '</mark></td>' + '<td></td>' + '<td style="color:#ccc"><mark>' + domTypeToString(value.type) + '</mark></td><td><mark>';
            html += node_fieldToHtml(value.type, value.list[i].val, curRow, level + 1);
            html += '</mark></td>';
            curRow.innerHTML = html;
            tr.childRows.push(curRow)
        }
        return '<span style="color:#ccc">indexed by ' + domTypeToString(value.indexType) + ' of type ' + domTypeToString(value.type) + ', length ' + value.list.length + '</span>';
    case DOM_TYPES.CLASS:
        for (let i = 0, l = value.length; i < l; i++) {
            const curRow = document.createElement('tr');
            curRow.childRows = [];
            let html = '<td><span style="color:#777;font-family:monospace">' + ('|-').repeat(level) + '</span><mark>' + (GOM.fields[value[i].id] || value[i].id) + '</mark></td>' + '<td style="color:#777"><mark>' + value[i].id + '</mark></td>' + '<td style="color:#ccc"><mark>' + domTypeToString(value[i].type) + '</mark></td><td><mark>';
            html += node_fieldToHtml(value[i].type, value[i].val, curRow, level + 1);
            html += '</mark></td>';
            curRow.innerHTML = html;
            tr.childRows.push(curRow)
        }
        return '<span style="color:#ccc">with ' + value.length + ' fields</span>';
    case DOM_TYPES.VECTOR3:
        return value[0] + ', ' + value[1] + ', ' + value[2];
    default:
        return '[Type not recognized]'
    }
}
function node_fieldAppendToTable(tbody, tr) {
    tbody.appendChild(tr);
    for (let i = 0, l = tr.childRows.length; i < l; i++) {
        node_fieldAppendToTable(tbody, tr.childRows[i])
    }
}

class Node {
    /**
     * An object wrapper for the TOR GOM Node type.
     * @param  {NodeEntr} node Node entry representing the table entry for this node.
     * @param  {Uint8Array} data The sliced data represeting the node itself.
     */
    constructor(node, data) {
        const comprArray = new Uint8Array(data);
        node.uncomprLength = 0x500000;
        const uncomprBuffer = new ArrayBuffer(node.uncomprLength);
        RawDeflate.inflate(comprArray, uncomprBuffer);
        const dv = new DataView(uncomprBuffer);
        let pos = node.contentOffset;
        if (node.uncomprLength > 0) {
            if (node.streamStyle >= 1 && node.streamStyle <= 6) {
                const unkO = readVarInt(dv, pos);
                pos += unkO.len
            }
            const numFieldsO = readVarInt(dv, pos);
            pos += numFieldsO.len;
            const numFields = numFieldsO.intLo;
            const obj = [];
            let prevId = '0';
            for (let i = 0; i < numFields; i++) {
                const field = {};
                const idOffset = readVarInt(dv, pos);
                pos += idOffset.len;
                prevId = uint64_add(prevId, uint64C(idOffset));
                field.id = prevId;
                field.type = dv.getUint8(pos++);
                const fieldRet = file_node_readfield(dv, pos, prevId, field.type);
                pos += fieldRet.len;
                field.value = fieldRet.val;
                obj.push(field)
            }
            this.node = node;
            this.obj = obj;
        }
    }

    render(parent) {
        const data = parseNode(this.node, this.obj);
        console.log(data);
        parent.appendChild(data);
    }
}

class NodeEntr {
    constructor(nodeJson, torPath) {
        this.id = nodeJson.id;
        this.fqn = nodeJson.fqn;
        this.baseClass = nodeJson.baseClass;
        this.bkt = nodeJson.bkt
        this.isBucket = nodeJson.isBucket;
        this.dataOffset = nodeJson.dataOffset;
        this.dataLength = nodeJson.dataLength;
        this.contentOffset = nodeJson.contentOffset;
        this.uncomprLength = nodeJson.uncomprLength;
        this.streamStyle = nodeJson.streamStyle;
        this.torPath = torPath;
    }

    render(parent) {
        if (!this.isBucket) return
        parent.innerHtml = "";

        const data = fs.readFileSync(this.torPath);

        const blob = data.buffer.slice(this.bkt.offset + this.dataOffset + 2, this.bkt.offset + this.dataOffset + this.dataLength - 4);
        const node = new Node(this, blob);
        node.render(parent);
    }
}

export {Node, NodeEntr}