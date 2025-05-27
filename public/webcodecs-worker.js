"use strict";
var EncoderWorkerGlobal = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/webm-muxer/build/webm-muxer.js
  var require_webm_muxer = __commonJS({
    "node_modules/webm-muxer/build/webm-muxer.js"(exports, module) {
      "use strict";
      var WebMMuxer2 = (() => {
        var __defProp3 = Object.defineProperty;
        var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
        var __getOwnPropNames2 = Object.getOwnPropertyNames;
        var __hasOwnProp3 = Object.prototype.hasOwnProperty;
        var __pow2 = Math.pow;
        var __export = (target, all) => {
          for (var name in all)
            __defProp3(target, name, { get: all[name], enumerable: true });
        };
        var __copyProps2 = (to, from, except, desc) => {
          if (from && typeof from === "object" || typeof from === "function") {
            for (let key of __getOwnPropNames2(from))
              if (!__hasOwnProp3.call(to, key) && key !== except)
                __defProp3(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
          }
          return to;
        };
        var __toCommonJS = (mod) => __copyProps2(__defProp3({}, "__esModule", { value: true }), mod);
        var __accessCheck2 = (obj, member, msg) => {
          if (!member.has(obj))
            throw TypeError("Cannot " + msg);
        };
        var __privateGet2 = (obj, member, getter) => {
          __accessCheck2(obj, member, "read from private field");
          return getter ? getter.call(obj) : member.get(obj);
        };
        var __privateAdd2 = (obj, member, value) => {
          if (member.has(obj))
            throw TypeError("Cannot add the same private member more than once");
          member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
        };
        var __privateSet2 = (obj, member, value, setter) => {
          __accessCheck2(obj, member, "write to private field");
          setter ? setter.call(obj, value) : member.set(obj, value);
          return value;
        };
        var __privateMethod2 = (obj, member, method) => {
          __accessCheck2(obj, member, "access private method");
          return method;
        };
        var main_exports = {};
        __export(main_exports, {
          default: () => main_default
        });
        var EBMLFloat32 = class {
          constructor(value) {
            this.value = value;
          }
        };
        var EBMLFloat64 = class {
          constructor(value) {
            this.value = value;
          }
        };
        var WriteTarget = class {
          constructor() {
            this.pos = 0;
            this.helper = new Uint8Array(8);
            this.helperView = new DataView(this.helper.buffer);
            this.offsets = /* @__PURE__ */ new WeakMap();
            this.dataOffsets = /* @__PURE__ */ new WeakMap();
          }
          writeFloat32(value) {
            this.helperView.setFloat32(0, value, false);
            this.write(this.helper.subarray(0, 4));
          }
          writeFloat64(value) {
            this.helperView.setFloat64(0, value, false);
            this.write(this.helper);
          }
          writeUnsignedInt(value, width = measureUnsignedInt(value)) {
            let pos = 0;
            switch (width) {
              case 6:
                this.helperView.setUint8(pos++, value / __pow2(2, 40) | 0);
              case 5:
                this.helperView.setUint8(pos++, value / __pow2(2, 32) | 0);
              case 4:
                this.helperView.setUint8(pos++, value >> 24);
              case 3:
                this.helperView.setUint8(pos++, value >> 16);
              case 2:
                this.helperView.setUint8(pos++, value >> 8);
              case 1:
                this.helperView.setUint8(pos++, value);
                break;
              default:
                throw new Error("Bad UINT size " + width);
            }
            this.write(this.helper.subarray(0, pos));
          }
          writeEBMLVarInt(value, width = measureEBMLVarInt(value)) {
            let pos = 0;
            switch (width) {
              case 1:
                this.helperView.setUint8(pos++, 1 << 7 | value);
                break;
              case 2:
                this.helperView.setUint8(pos++, 1 << 6 | value >> 8);
                this.helperView.setUint8(pos++, value);
                break;
              case 3:
                this.helperView.setUint8(pos++, 1 << 5 | value >> 16);
                this.helperView.setUint8(pos++, value >> 8);
                this.helperView.setUint8(pos++, value);
                break;
              case 4:
                this.helperView.setUint8(pos++, 1 << 4 | value >> 24);
                this.helperView.setUint8(pos++, value >> 16);
                this.helperView.setUint8(pos++, value >> 8);
                this.helperView.setUint8(pos++, value);
                break;
              case 5:
                this.helperView.setUint8(pos++, 1 << 3 | value / __pow2(2, 32) & 7);
                this.helperView.setUint8(pos++, value >> 24);
                this.helperView.setUint8(pos++, value >> 16);
                this.helperView.setUint8(pos++, value >> 8);
                this.helperView.setUint8(pos++, value);
                break;
              case 6:
                this.helperView.setUint8(pos++, 1 << 2 | value / __pow2(2, 40) & 3);
                this.helperView.setUint8(pos++, value / __pow2(2, 32) | 0);
                this.helperView.setUint8(pos++, value >> 24);
                this.helperView.setUint8(pos++, value >> 16);
                this.helperView.setUint8(pos++, value >> 8);
                this.helperView.setUint8(pos++, value);
                break;
              default:
                throw new Error("Bad EBML VINT size " + width);
            }
            this.write(this.helper.subarray(0, pos));
          }
          writeString(str) {
            this.write(new Uint8Array(str.split("").map((x) => x.charCodeAt(0))));
          }
          writeEBML(data) {
            var _a, _b;
            if (data instanceof Uint8Array) {
              this.write(data);
            } else if (Array.isArray(data)) {
              for (let elem of data) {
                this.writeEBML(elem);
              }
            } else {
              this.offsets.set(data, this.pos);
              this.writeUnsignedInt(data.id);
              if (Array.isArray(data.data)) {
                let sizePos = this.pos;
                let sizeSize = (_a = data.size) != null ? _a : 4;
                this.seek(this.pos + sizeSize);
                let startPos = this.pos;
                this.dataOffsets.set(data, startPos);
                this.writeEBML(data.data);
                let size = this.pos - startPos;
                let endPos = this.pos;
                this.seek(sizePos);
                this.writeEBMLVarInt(size, sizeSize);
                this.seek(endPos);
              } else if (typeof data.data === "number") {
                let size = (_b = data.size) != null ? _b : measureUnsignedInt(data.data);
                this.writeEBMLVarInt(size);
                this.writeUnsignedInt(data.data, size);
              } else if (typeof data.data === "string") {
                this.writeEBMLVarInt(data.data.length);
                this.writeString(data.data);
              } else if (data.data instanceof Uint8Array) {
                this.writeEBMLVarInt(data.data.byteLength, data.size);
                this.write(data.data);
              } else if (data.data instanceof EBMLFloat32) {
                this.writeEBMLVarInt(4);
                this.writeFloat32(data.data.value);
              } else if (data.data instanceof EBMLFloat64) {
                this.writeEBMLVarInt(8);
                this.writeFloat64(data.data.value);
              }
            }
          }
        };
        var measureUnsignedInt = (value) => {
          if (value < 1 << 8) {
            return 1;
          } else if (value < 1 << 16) {
            return 2;
          } else if (value < 1 << 24) {
            return 3;
          } else if (value < __pow2(2, 32)) {
            return 4;
          } else if (value < __pow2(2, 40)) {
            return 5;
          } else {
            return 6;
          }
        };
        var measureEBMLVarInt = (value) => {
          if (value < (1 << 7) - 1) {
            return 1;
          } else if (value < (1 << 14) - 1) {
            return 2;
          } else if (value < (1 << 21) - 1) {
            return 3;
          } else if (value < (1 << 28) - 1) {
            return 4;
          } else if (value < __pow2(2, 35) - 1) {
            return 5;
          } else if (value < __pow2(2, 42) - 1) {
            return 6;
          } else {
            throw new Error("EBML VINT size not supported " + value);
          }
        };
        var ArrayBufferWriteTarget = class extends WriteTarget {
          constructor() {
            super();
            this.buffer = new ArrayBuffer(__pow2(2, 16));
            this.bytes = new Uint8Array(this.buffer);
          }
          ensureSize(size) {
            let newLength = this.buffer.byteLength;
            while (newLength < size)
              newLength *= 2;
            if (newLength === this.buffer.byteLength)
              return;
            let newBuffer = new ArrayBuffer(newLength);
            let newBytes = new Uint8Array(newBuffer);
            newBytes.set(this.bytes, 0);
            this.buffer = newBuffer;
            this.bytes = newBytes;
          }
          write(data) {
            this.ensureSize(this.pos + data.byteLength);
            this.bytes.set(data, this.pos);
            this.pos += data.byteLength;
          }
          seek(newPos) {
            this.pos = newPos;
          }
          finalize() {
            this.ensureSize(this.pos);
            return this.buffer.slice(0, this.pos);
          }
        };
        var FILE_CHUNK_SIZE = __pow2(2, 24);
        var MAX_CHUNKS_AT_ONCE2 = 2;
        var FileSystemWritableFileStreamWriteTarget = class extends WriteTarget {
          constructor(stream) {
            super();
            this.chunks = [];
            this.stream = stream;
          }
          write(data) {
            this.writeDataIntoChunks(data, this.pos);
            this.flushChunks();
            this.pos += data.byteLength;
          }
          writeDataIntoChunks(data, position) {
            let chunkIndex = this.chunks.findIndex((x) => x.start <= position && position < x.start + FILE_CHUNK_SIZE);
            if (chunkIndex === -1)
              chunkIndex = this.createChunk(position);
            let chunk = this.chunks[chunkIndex];
            let relativePosition = position - chunk.start;
            let toWrite = data.subarray(0, Math.min(FILE_CHUNK_SIZE - relativePosition, data.byteLength));
            chunk.data.set(toWrite, relativePosition);
            let section = {
              start: relativePosition,
              end: relativePosition + toWrite.byteLength
            };
            insertSectionIntoFileChunk(chunk, section);
            if (chunk.written[0].start === 0 && chunk.written[0].end === FILE_CHUNK_SIZE) {
              chunk.shouldFlush = true;
            }
            if (this.chunks.length > MAX_CHUNKS_AT_ONCE2) {
              for (let i = 0; i < this.chunks.length - 1; i++) {
                this.chunks[i].shouldFlush = true;
              }
              this.flushChunks();
            }
            if (toWrite.byteLength < data.byteLength) {
              this.writeDataIntoChunks(data.subarray(toWrite.byteLength), position + toWrite.byteLength);
            }
          }
          createChunk(includesPosition) {
            let start = Math.floor(includesPosition / FILE_CHUNK_SIZE) * FILE_CHUNK_SIZE;
            let chunk = {
              start,
              data: new Uint8Array(FILE_CHUNK_SIZE),
              written: [],
              shouldFlush: false
            };
            this.chunks.push(chunk);
            this.chunks.sort((a, b) => a.start - b.start);
            return this.chunks.indexOf(chunk);
          }
          flushChunks(force = false) {
            for (let i = 0; i < this.chunks.length; i++) {
              let chunk = this.chunks[i];
              if (!chunk.shouldFlush && !force)
                continue;
              for (let section of chunk.written) {
                this.stream.write({
                  type: "write",
                  data: chunk.data.subarray(section.start, section.end),
                  position: chunk.start + section.start
                });
              }
              this.chunks.splice(i--, 1);
            }
          }
          seek(newPos) {
            this.pos = newPos;
          }
          finalize() {
            this.flushChunks(true);
          }
        };
        var insertSectionIntoFileChunk = (chunk, section) => {
          let low = 0;
          let high = chunk.written.length - 1;
          let index = -1;
          while (low <= high) {
            let mid = Math.floor(low + (high - low + 1) / 2);
            if (chunk.written[mid].start <= section.start) {
              low = mid + 1;
              index = mid;
            } else {
              high = mid - 1;
            }
          }
          chunk.written.splice(index + 1, 0, section);
          if (index === -1 || chunk.written[index].end < section.start)
            index++;
          while (index < chunk.written.length - 1 && chunk.written[index].end >= chunk.written[index + 1].start) {
            chunk.written[index].end = Math.max(chunk.written[index].end, chunk.written[index + 1].end);
            chunk.written.splice(index + 1, 1);
          }
        };
        var VIDEO_TRACK_NUMBER = 1;
        var AUDIO_TRACK_NUMBER = 2;
        var VIDEO_TRACK_TYPE = 1;
        var AUDIO_TRACK_TYPE = 2;
        var MAX_CHUNK_LENGTH_MS = __pow2(2, 15);
        var CODEC_PRIVATE_MAX_SIZE = __pow2(2, 12);
        var APP_NAME = "https://github.com/Vanilagy/webm-muxer";
        var SEGMENT_SIZE_BYTES = 6;
        var CLUSTER_SIZE_BYTES = 5;
        var _target4, _options2, _segment, _segmentInfo, _seekHead, _tracksElement, _segmentDuration, _colourElement, _videoCodecPrivate, _audioCodecPrivate, _cues, _currentCluster, _currentClusterTimestamp, _duration, _videoChunkQueue, _audioChunkQueue, _lastVideoTimestamp, _lastAudioTimestamp, _colorSpace, _finalized2, _validateOptions2, validateOptions_fn2, _createFileHeader, createFileHeader_fn, _writeEBMLHeader, writeEBMLHeader_fn, _createSeekHead, createSeekHead_fn, _createSegmentInfo, createSegmentInfo_fn, _createTracks, createTracks_fn, _createSegment, createSegment_fn, _createCues, createCues_fn, _segmentDataOffset, segmentDataOffset_get, _writeVideoDecoderConfig, writeVideoDecoderConfig_fn, _fixVP9ColorSpace, fixVP9ColorSpace_fn, _createInternalChunk, createInternalChunk_fn, _writeSimpleBlock, writeSimpleBlock_fn, _writeCodecPrivate, writeCodecPrivate_fn, _createNewCluster, createNewCluster_fn, _finalizeCurrentCluster, finalizeCurrentCluster_fn, _ensureNotFinalized2, ensureNotFinalized_fn2;
        var WebMMuxer3 = class {
          constructor(options) {
            __privateAdd2(this, _validateOptions2);
            __privateAdd2(this, _createFileHeader);
            __privateAdd2(this, _writeEBMLHeader);
            __privateAdd2(this, _createSeekHead);
            __privateAdd2(this, _createSegmentInfo);
            __privateAdd2(this, _createTracks);
            __privateAdd2(this, _createSegment);
            __privateAdd2(this, _createCues);
            __privateAdd2(this, _segmentDataOffset);
            __privateAdd2(this, _writeVideoDecoderConfig);
            __privateAdd2(this, _fixVP9ColorSpace);
            __privateAdd2(this, _createInternalChunk);
            __privateAdd2(this, _writeSimpleBlock);
            __privateAdd2(this, _writeCodecPrivate);
            __privateAdd2(this, _createNewCluster);
            __privateAdd2(this, _finalizeCurrentCluster);
            __privateAdd2(this, _ensureNotFinalized2);
            __privateAdd2(this, _target4, void 0);
            __privateAdd2(this, _options2, void 0);
            __privateAdd2(this, _segment, void 0);
            __privateAdd2(this, _segmentInfo, void 0);
            __privateAdd2(this, _seekHead, void 0);
            __privateAdd2(this, _tracksElement, void 0);
            __privateAdd2(this, _segmentDuration, void 0);
            __privateAdd2(this, _colourElement, void 0);
            __privateAdd2(this, _videoCodecPrivate, void 0);
            __privateAdd2(this, _audioCodecPrivate, void 0);
            __privateAdd2(this, _cues, void 0);
            __privateAdd2(this, _currentCluster, void 0);
            __privateAdd2(this, _currentClusterTimestamp, void 0);
            __privateAdd2(this, _duration, 0);
            __privateAdd2(this, _videoChunkQueue, []);
            __privateAdd2(this, _audioChunkQueue, []);
            __privateAdd2(this, _lastVideoTimestamp, 0);
            __privateAdd2(this, _lastAudioTimestamp, 0);
            __privateAdd2(this, _colorSpace, void 0);
            __privateAdd2(this, _finalized2, false);
            __privateMethod2(this, _validateOptions2, validateOptions_fn2).call(this, options);
            __privateSet2(this, _options2, options);
            if (options.target === "buffer") {
              __privateSet2(this, _target4, new ArrayBufferWriteTarget());
            } else {
              __privateSet2(this, _target4, new FileSystemWritableFileStreamWriteTarget(options.target));
            }
            __privateMethod2(this, _createFileHeader, createFileHeader_fn).call(this);
          }
          addVideoChunk(chunk, meta, timestamp) {
            let data = new Uint8Array(chunk.byteLength);
            chunk.copyTo(data);
            this.addVideoChunkRaw(data, chunk.type, timestamp != null ? timestamp : chunk.timestamp, meta);
          }
          addVideoChunkRaw(data, type, timestamp, meta) {
            __privateMethod2(this, _ensureNotFinalized2, ensureNotFinalized_fn2).call(this);
            if (!__privateGet2(this, _options2).video)
              throw new Error("No video track declared.");
            if (meta)
              __privateMethod2(this, _writeVideoDecoderConfig, writeVideoDecoderConfig_fn).call(this, meta);
            let internalChunk = __privateMethod2(this, _createInternalChunk, createInternalChunk_fn).call(this, data, type, timestamp, VIDEO_TRACK_NUMBER);
            if (__privateGet2(this, _options2).video.codec === "V_VP9")
              __privateMethod2(this, _fixVP9ColorSpace, fixVP9ColorSpace_fn).call(this, internalChunk);
            __privateSet2(this, _lastVideoTimestamp, internalChunk.timestamp);
            while (__privateGet2(this, _audioChunkQueue).length > 0 && __privateGet2(this, _audioChunkQueue)[0].timestamp <= internalChunk.timestamp) {
              let audioChunk = __privateGet2(this, _audioChunkQueue).shift();
              __privateMethod2(this, _writeSimpleBlock, writeSimpleBlock_fn).call(this, audioChunk);
            }
            if (!__privateGet2(this, _options2).audio || internalChunk.timestamp <= __privateGet2(this, _lastAudioTimestamp)) {
              __privateMethod2(this, _writeSimpleBlock, writeSimpleBlock_fn).call(this, internalChunk);
            } else {
              __privateGet2(this, _videoChunkQueue).push(internalChunk);
            }
          }
          addAudioChunk(chunk, meta, timestamp) {
            let data = new Uint8Array(chunk.byteLength);
            chunk.copyTo(data);
            this.addAudioChunkRaw(data, chunk.type, timestamp != null ? timestamp : chunk.timestamp, meta);
          }
          addAudioChunkRaw(data, type, timestamp, meta) {
            __privateMethod2(this, _ensureNotFinalized2, ensureNotFinalized_fn2).call(this);
            if (!__privateGet2(this, _options2).audio)
              throw new Error("No audio track declared.");
            let internalChunk = __privateMethod2(this, _createInternalChunk, createInternalChunk_fn).call(this, data, type, timestamp, AUDIO_TRACK_NUMBER);
            __privateSet2(this, _lastAudioTimestamp, internalChunk.timestamp);
            while (__privateGet2(this, _videoChunkQueue).length > 0 && __privateGet2(this, _videoChunkQueue)[0].timestamp <= internalChunk.timestamp) {
              let videoChunk = __privateGet2(this, _videoChunkQueue).shift();
              __privateMethod2(this, _writeSimpleBlock, writeSimpleBlock_fn).call(this, videoChunk);
            }
            if (!__privateGet2(this, _options2).video || internalChunk.timestamp <= __privateGet2(this, _lastVideoTimestamp)) {
              __privateMethod2(this, _writeSimpleBlock, writeSimpleBlock_fn).call(this, internalChunk);
            } else {
              __privateGet2(this, _audioChunkQueue).push(internalChunk);
            }
            if (meta == null ? void 0 : meta.decoderConfig) {
              __privateMethod2(this, _writeCodecPrivate, writeCodecPrivate_fn).call(this, __privateGet2(this, _audioCodecPrivate), meta.decoderConfig.description);
            }
          }
          finalize() {
            while (__privateGet2(this, _videoChunkQueue).length > 0)
              __privateMethod2(this, _writeSimpleBlock, writeSimpleBlock_fn).call(this, __privateGet2(this, _videoChunkQueue).shift());
            while (__privateGet2(this, _audioChunkQueue).length > 0)
              __privateMethod2(this, _writeSimpleBlock, writeSimpleBlock_fn).call(this, __privateGet2(this, _audioChunkQueue).shift());
            __privateMethod2(this, _finalizeCurrentCluster, finalizeCurrentCluster_fn).call(this);
            __privateGet2(this, _target4).writeEBML(__privateGet2(this, _cues));
            let endPos = __privateGet2(this, _target4).pos;
            let segmentSize = __privateGet2(this, _target4).pos - __privateGet2(this, _segmentDataOffset, segmentDataOffset_get);
            __privateGet2(this, _target4).seek(__privateGet2(this, _target4).offsets.get(__privateGet2(this, _segment)) + 4);
            __privateGet2(this, _target4).writeEBMLVarInt(segmentSize, SEGMENT_SIZE_BYTES);
            __privateGet2(this, _segmentDuration).data = new EBMLFloat64(__privateGet2(this, _duration));
            __privateGet2(this, _target4).seek(__privateGet2(this, _target4).offsets.get(__privateGet2(this, _segmentDuration)));
            __privateGet2(this, _target4).writeEBML(__privateGet2(this, _segmentDuration));
            __privateGet2(this, _seekHead).data[0].data[1].data = __privateGet2(this, _target4).offsets.get(__privateGet2(this, _cues)) - __privateGet2(this, _segmentDataOffset, segmentDataOffset_get);
            __privateGet2(this, _seekHead).data[1].data[1].data = __privateGet2(this, _target4).offsets.get(__privateGet2(this, _segmentInfo)) - __privateGet2(this, _segmentDataOffset, segmentDataOffset_get);
            __privateGet2(this, _seekHead).data[2].data[1].data = __privateGet2(this, _target4).offsets.get(__privateGet2(this, _tracksElement)) - __privateGet2(this, _segmentDataOffset, segmentDataOffset_get);
            __privateGet2(this, _target4).seek(__privateGet2(this, _target4).offsets.get(__privateGet2(this, _seekHead)));
            __privateGet2(this, _target4).writeEBML(__privateGet2(this, _seekHead));
            __privateGet2(this, _target4).seek(endPos);
            __privateSet2(this, _finalized2, true);
            if (__privateGet2(this, _target4) instanceof ArrayBufferWriteTarget) {
              return __privateGet2(this, _target4).finalize();
            } else if (__privateGet2(this, _target4) instanceof FileSystemWritableFileStreamWriteTarget) {
              __privateGet2(this, _target4).finalize();
            }
            return null;
          }
        };
        _target4 = /* @__PURE__ */ new WeakMap();
        _options2 = /* @__PURE__ */ new WeakMap();
        _segment = /* @__PURE__ */ new WeakMap();
        _segmentInfo = /* @__PURE__ */ new WeakMap();
        _seekHead = /* @__PURE__ */ new WeakMap();
        _tracksElement = /* @__PURE__ */ new WeakMap();
        _segmentDuration = /* @__PURE__ */ new WeakMap();
        _colourElement = /* @__PURE__ */ new WeakMap();
        _videoCodecPrivate = /* @__PURE__ */ new WeakMap();
        _audioCodecPrivate = /* @__PURE__ */ new WeakMap();
        _cues = /* @__PURE__ */ new WeakMap();
        _currentCluster = /* @__PURE__ */ new WeakMap();
        _currentClusterTimestamp = /* @__PURE__ */ new WeakMap();
        _duration = /* @__PURE__ */ new WeakMap();
        _videoChunkQueue = /* @__PURE__ */ new WeakMap();
        _audioChunkQueue = /* @__PURE__ */ new WeakMap();
        _lastVideoTimestamp = /* @__PURE__ */ new WeakMap();
        _lastAudioTimestamp = /* @__PURE__ */ new WeakMap();
        _colorSpace = /* @__PURE__ */ new WeakMap();
        _finalized2 = /* @__PURE__ */ new WeakMap();
        _validateOptions2 = /* @__PURE__ */ new WeakSet();
        validateOptions_fn2 = function(options) {
          if (options.type && options.type !== "webm" && options.type !== "matroska") {
            throw new Error(`Invalid type: ${options.type}`);
          }
        };
        _createFileHeader = /* @__PURE__ */ new WeakSet();
        createFileHeader_fn = function() {
          __privateMethod2(this, _writeEBMLHeader, writeEBMLHeader_fn).call(this);
          __privateMethod2(this, _createSeekHead, createSeekHead_fn).call(this);
          __privateMethod2(this, _createSegmentInfo, createSegmentInfo_fn).call(this);
          __privateMethod2(this, _createTracks, createTracks_fn).call(this);
          __privateMethod2(this, _createSegment, createSegment_fn).call(this);
          __privateMethod2(this, _createCues, createCues_fn).call(this);
        };
        _writeEBMLHeader = /* @__PURE__ */ new WeakSet();
        writeEBMLHeader_fn = function() {
          var _a;
          let ebmlHeader = { id: 440786851, data: [
            { id: 17030, data: 1 },
            { id: 17143, data: 1 },
            { id: 17138, data: 4 },
            { id: 17139, data: 8 },
            { id: 17026, data: (_a = __privateGet2(this, _options2).type) != null ? _a : "webm" },
            { id: 17031, data: 2 },
            { id: 17029, data: 2 }
          ] };
          __privateGet2(this, _target4).writeEBML(ebmlHeader);
        };
        _createSeekHead = /* @__PURE__ */ new WeakSet();
        createSeekHead_fn = function() {
          const kaxCues = new Uint8Array([28, 83, 187, 107]);
          const kaxInfo = new Uint8Array([21, 73, 169, 102]);
          const kaxTracks = new Uint8Array([22, 84, 174, 107]);
          let seekHead = { id: 290298740, data: [
            { id: 19899, data: [
              { id: 21419, data: kaxCues },
              { id: 21420, size: 5, data: 0 }
            ] },
            { id: 19899, data: [
              { id: 21419, data: kaxInfo },
              { id: 21420, size: 5, data: 0 }
            ] },
            { id: 19899, data: [
              { id: 21419, data: kaxTracks },
              { id: 21420, size: 5, data: 0 }
            ] }
          ] };
          __privateSet2(this, _seekHead, seekHead);
        };
        _createSegmentInfo = /* @__PURE__ */ new WeakSet();
        createSegmentInfo_fn = function() {
          let segmentDuration = { id: 17545, data: new EBMLFloat64(0) };
          __privateSet2(this, _segmentDuration, segmentDuration);
          let segmentInfo = { id: 357149030, data: [
            { id: 2807729, data: 1e6 },
            { id: 19840, data: APP_NAME },
            { id: 22337, data: APP_NAME },
            segmentDuration
          ] };
          __privateSet2(this, _segmentInfo, segmentInfo);
        };
        _createTracks = /* @__PURE__ */ new WeakSet();
        createTracks_fn = function() {
          let tracksElement = { id: 374648427, data: [] };
          __privateSet2(this, _tracksElement, tracksElement);
          if (__privateGet2(this, _options2).video) {
            __privateSet2(this, _videoCodecPrivate, { id: 236, size: 4, data: new Uint8Array(CODEC_PRIVATE_MAX_SIZE) });
            let colourElement = { id: 21936, data: [
              { id: 21937, data: 2 },
              { id: 21946, data: 2 },
              { id: 21947, data: 2 },
              { id: 21945, data: 0 }
            ] };
            __privateSet2(this, _colourElement, colourElement);
            tracksElement.data.push({ id: 174, data: [
              { id: 215, data: VIDEO_TRACK_NUMBER },
              { id: 29637, data: VIDEO_TRACK_NUMBER },
              { id: 131, data: VIDEO_TRACK_TYPE },
              { id: 134, data: __privateGet2(this, _options2).video.codec },
              __privateGet2(this, _videoCodecPrivate),
              __privateGet2(this, _options2).video.frameRate ? { id: 2352003, data: 1e9 / __privateGet2(this, _options2).video.frameRate } : null,
              { id: 224, data: [
                { id: 176, data: __privateGet2(this, _options2).video.width },
                { id: 186, data: __privateGet2(this, _options2).video.height },
                colourElement
              ] }
            ].filter(Boolean) });
          }
          if (__privateGet2(this, _options2).audio) {
            __privateSet2(this, _audioCodecPrivate, { id: 236, size: 4, data: new Uint8Array(CODEC_PRIVATE_MAX_SIZE) });
            tracksElement.data.push({ id: 174, data: [
              { id: 215, data: AUDIO_TRACK_NUMBER },
              { id: 29637, data: AUDIO_TRACK_NUMBER },
              { id: 131, data: AUDIO_TRACK_TYPE },
              { id: 134, data: __privateGet2(this, _options2).audio.codec },
              __privateGet2(this, _audioCodecPrivate),
              { id: 225, data: [
                { id: 181, data: new EBMLFloat32(__privateGet2(this, _options2).audio.sampleRate) },
                { id: 159, data: __privateGet2(this, _options2).audio.numberOfChannels },
                __privateGet2(this, _options2).audio.bitDepth ? { id: 25188, data: __privateGet2(this, _options2).audio.bitDepth } : null
              ].filter(Boolean) }
            ] });
          }
        };
        _createSegment = /* @__PURE__ */ new WeakSet();
        createSegment_fn = function() {
          let segment = { id: 408125543, size: SEGMENT_SIZE_BYTES, data: [
            __privateGet2(this, _seekHead),
            __privateGet2(this, _segmentInfo),
            __privateGet2(this, _tracksElement)
          ] };
          __privateSet2(this, _segment, segment);
          __privateGet2(this, _target4).writeEBML(segment);
        };
        _createCues = /* @__PURE__ */ new WeakSet();
        createCues_fn = function() {
          __privateSet2(this, _cues, { id: 475249515, data: [] });
        };
        _segmentDataOffset = /* @__PURE__ */ new WeakSet();
        segmentDataOffset_get = function() {
          return __privateGet2(this, _target4).dataOffsets.get(__privateGet2(this, _segment));
        };
        _writeVideoDecoderConfig = /* @__PURE__ */ new WeakSet();
        writeVideoDecoderConfig_fn = function(meta) {
          if (meta.decoderConfig) {
            if (meta.decoderConfig.colorSpace) {
              let colorSpace = meta.decoderConfig.colorSpace;
              __privateSet2(this, _colorSpace, colorSpace);
              __privateGet2(this, _colourElement).data = [
                { id: 21937, data: {
                  "rgb": 1,
                  "bt709": 1,
                  "bt470bg": 5,
                  "smpte170m": 6
                }[colorSpace.matrix] },
                { id: 21946, data: {
                  "bt709": 1,
                  "smpte170m": 6,
                  "iec61966-2-1": 13
                }[colorSpace.transfer] },
                { id: 21947, data: {
                  "bt709": 1,
                  "bt470bg": 5,
                  "smpte170m": 6
                }[colorSpace.primaries] },
                { id: 21945, data: [1, 2][Number(colorSpace.fullRange)] }
              ];
              let endPos = __privateGet2(this, _target4).pos;
              __privateGet2(this, _target4).seek(__privateGet2(this, _target4).offsets.get(__privateGet2(this, _colourElement)));
              __privateGet2(this, _target4).writeEBML(__privateGet2(this, _colourElement));
              __privateGet2(this, _target4).seek(endPos);
            }
            if (meta.decoderConfig.description) {
              __privateMethod2(this, _writeCodecPrivate, writeCodecPrivate_fn).call(this, __privateGet2(this, _videoCodecPrivate), meta.decoderConfig.description);
            }
          }
        };
        _fixVP9ColorSpace = /* @__PURE__ */ new WeakSet();
        fixVP9ColorSpace_fn = function(chunk) {
          if (chunk.type !== "key")
            return;
          if (!__privateGet2(this, _colorSpace))
            return;
          let i = 0;
          if (readBits(chunk.data, 0, 2) !== 2)
            return;
          i += 2;
          let profile = (readBits(chunk.data, i + 1, i + 2) << 1) + readBits(chunk.data, i + 0, i + 1);
          i += 2;
          if (profile === 3)
            i++;
          let showExistingFrame = readBits(chunk.data, i + 0, i + 1);
          i++;
          if (showExistingFrame)
            return;
          let frameType = readBits(chunk.data, i + 0, i + 1);
          i++;
          if (frameType !== 0)
            return;
          i += 2;
          let syncCode = readBits(chunk.data, i + 0, i + 24);
          i += 24;
          if (syncCode !== 4817730)
            return;
          if (profile >= 2)
            i++;
          let colorSpaceID = {
            "rgb": 7,
            "bt709": 2,
            "bt470bg": 1,
            "smpte170m": 3
          }[__privateGet2(this, _colorSpace).matrix];
          writeBits(chunk.data, i + 0, i + 3, colorSpaceID);
        };
        _createInternalChunk = /* @__PURE__ */ new WeakSet();
        createInternalChunk_fn = function(data, type, timestamp, trackNumber) {
          let internalChunk = {
            data,
            type,
            timestamp,
            trackNumber
          };
          return internalChunk;
        };
        _writeSimpleBlock = /* @__PURE__ */ new WeakSet();
        writeSimpleBlock_fn = function(chunk) {
          let msTime = Math.floor(chunk.timestamp / 1e3);
          let clusterIsTooLong = chunk.type !== "key" && msTime - __privateGet2(this, _currentClusterTimestamp) >= MAX_CHUNK_LENGTH_MS;
          if (clusterIsTooLong) {
            throw new Error(
              `Current Matroska cluster exceeded its maximum allowed length of ${MAX_CHUNK_LENGTH_MS} milliseconds. In order to produce a correct WebM file, you must pass in a video key frame at least every ${MAX_CHUNK_LENGTH_MS} milliseconds.`
            );
          }
          let shouldCreateNewClusterFromKeyFrame = (chunk.trackNumber === VIDEO_TRACK_NUMBER || !__privateGet2(this, _options2).video) && chunk.type === "key" && msTime - __privateGet2(this, _currentClusterTimestamp) >= 1e3;
          if (!__privateGet2(this, _currentCluster) || shouldCreateNewClusterFromKeyFrame) {
            __privateMethod2(this, _createNewCluster, createNewCluster_fn).call(this, msTime);
          }
          let prelude = new Uint8Array(4);
          let view2 = new DataView(prelude.buffer);
          view2.setUint8(0, 128 | chunk.trackNumber);
          view2.setUint16(1, msTime - __privateGet2(this, _currentClusterTimestamp), false);
          view2.setUint8(3, Number(chunk.type === "key") << 7);
          let simpleBlock = { id: 163, data: [
            prelude,
            chunk.data
          ] };
          __privateGet2(this, _target4).writeEBML(simpleBlock);
          __privateSet2(this, _duration, Math.max(__privateGet2(this, _duration), msTime));
        };
        _writeCodecPrivate = /* @__PURE__ */ new WeakSet();
        writeCodecPrivate_fn = function(element, data) {
          let endPos = __privateGet2(this, _target4).pos;
          __privateGet2(this, _target4).seek(__privateGet2(this, _target4).offsets.get(element));
          element = [
            { id: 25506, size: 4, data: new Uint8Array(data) },
            { id: 236, size: 4, data: new Uint8Array(CODEC_PRIVATE_MAX_SIZE - 2 - 4 - data.byteLength) }
          ];
          __privateGet2(this, _target4).writeEBML(element);
          __privateGet2(this, _target4).seek(endPos);
        };
        _createNewCluster = /* @__PURE__ */ new WeakSet();
        createNewCluster_fn = function(timestamp) {
          if (__privateGet2(this, _currentCluster)) {
            __privateMethod2(this, _finalizeCurrentCluster, finalizeCurrentCluster_fn).call(this);
          }
          __privateSet2(this, _currentCluster, { id: 524531317, size: CLUSTER_SIZE_BYTES, data: [
            { id: 231, data: timestamp }
          ] });
          __privateGet2(this, _target4).writeEBML(__privateGet2(this, _currentCluster));
          __privateSet2(this, _currentClusterTimestamp, timestamp);
          let clusterOffsetFromSegment = __privateGet2(this, _target4).offsets.get(__privateGet2(this, _currentCluster)) - __privateGet2(this, _segmentDataOffset, segmentDataOffset_get);
          __privateGet2(this, _cues).data.push({ id: 187, data: [
            { id: 179, data: timestamp },
            { id: 183, data: [
              { id: 247, data: VIDEO_TRACK_NUMBER },
              { id: 241, data: clusterOffsetFromSegment }
            ] }
          ] });
        };
        _finalizeCurrentCluster = /* @__PURE__ */ new WeakSet();
        finalizeCurrentCluster_fn = function() {
          let clusterSize = __privateGet2(this, _target4).pos - __privateGet2(this, _target4).dataOffsets.get(__privateGet2(this, _currentCluster));
          let endPos = __privateGet2(this, _target4).pos;
          __privateGet2(this, _target4).seek(__privateGet2(this, _target4).offsets.get(__privateGet2(this, _currentCluster)) + 4);
          __privateGet2(this, _target4).writeEBMLVarInt(clusterSize, CLUSTER_SIZE_BYTES);
          __privateGet2(this, _target4).seek(endPos);
        };
        _ensureNotFinalized2 = /* @__PURE__ */ new WeakSet();
        ensureNotFinalized_fn2 = function() {
          if (__privateGet2(this, _finalized2)) {
            throw new Error("Cannot add new video or audio chunks after the file has been finalized.");
          }
        };
        var main_default = WebMMuxer3;
        var readBits = (bytes2, start, end) => {
          let result = 0;
          for (let i = start; i < end; i++) {
            let byteIndex = Math.floor(i / 8);
            let byte = bytes2[byteIndex];
            let bitIndex = 7 - (i & 7);
            let bit = (byte & 1 << bitIndex) >> bitIndex;
            result <<= 1;
            result |= bit;
          }
          return result;
        };
        var writeBits = (bytes2, start, end, value) => {
          for (let i = start; i < end; i++) {
            let byteIndex = Math.floor(i / 8);
            let byte = bytes2[byteIndex];
            let bitIndex = 7 - (i & 7);
            byte &= ~(1 << bitIndex);
            byte |= (value & 1 << end - i - 1) >> end - i - 1 << bitIndex;
            bytes2[byteIndex] = byte;
          }
        };
        return __toCommonJS(main_exports);
      })();
      WebMMuxer2 = WebMMuxer2.default;
      if (typeof module === "object" && typeof module.exports === "object") module.exports = WebMMuxer2;
    }
  });

  // node_modules/mp4-muxer/build/mp4-muxer.mjs
  var __defProp2 = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp2 = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __pow = Math.pow;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp2.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __accessCheck = (obj, member, msg) => {
    if (!member.has(obj))
      throw TypeError("Cannot " + msg);
  };
  var __privateGet = (obj, member, getter) => {
    __accessCheck(obj, member, "read from private field");
    return getter ? getter.call(obj) : member.get(obj);
  };
  var __privateAdd = (obj, member, value) => {
    if (member.has(obj))
      throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  };
  var __privateSet = (obj, member, value, setter) => {
    __accessCheck(obj, member, "write to private field");
    setter ? setter.call(obj, value) : member.set(obj, value);
    return value;
  };
  var __privateMethod = (obj, member, method) => {
    __accessCheck(obj, member, "access private method");
    return method;
  };
  var bytes = new Uint8Array(8);
  var view = new DataView(bytes.buffer);
  var u8 = (value) => {
    return [(value % 256 + 256) % 256];
  };
  var u16 = (value) => {
    view.setUint16(0, value, false);
    return [bytes[0], bytes[1]];
  };
  var i16 = (value) => {
    view.setInt16(0, value, false);
    return [bytes[0], bytes[1]];
  };
  var u24 = (value) => {
    view.setUint32(0, value, false);
    return [bytes[1], bytes[2], bytes[3]];
  };
  var u32 = (value) => {
    view.setUint32(0, value, false);
    return [bytes[0], bytes[1], bytes[2], bytes[3]];
  };
  var u64 = (value) => {
    view.setUint32(0, Math.floor(value / __pow(2, 32)), false);
    view.setUint32(4, value, false);
    return [bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7]];
  };
  var fixed_8_8 = (value) => {
    view.setInt16(0, __pow(2, 8) * value, false);
    return [bytes[0], bytes[1]];
  };
  var fixed_16_16 = (value) => {
    view.setInt32(0, __pow(2, 16) * value, false);
    return [bytes[0], bytes[1], bytes[2], bytes[3]];
  };
  var fixed_2_30 = (value) => {
    view.setInt32(0, __pow(2, 30) * value, false);
    return [bytes[0], bytes[1], bytes[2], bytes[3]];
  };
  var ascii = (text, nullTerminated = false) => {
    let bytes2 = Array(text.length).fill(null).map((_, i) => text.charCodeAt(i));
    if (nullTerminated)
      bytes2.push(0);
    return bytes2;
  };
  var last = (arr) => {
    return arr && arr[arr.length - 1];
  };
  var intoTimescale = (timeInSeconds, timescale, round = true) => {
    let value = timeInSeconds * timescale;
    return round ? Math.round(value) : value;
  };
  var rotationMatrix = (rotationInDegrees) => {
    let theta = rotationInDegrees * (Math.PI / 180);
    let cosTheta = Math.cos(theta);
    let sinTheta = Math.sin(theta);
    return [
      cosTheta,
      sinTheta,
      0,
      -sinTheta,
      cosTheta,
      0,
      0,
      0,
      1
    ];
  };
  var IDENTITY_MATRIX = rotationMatrix(0);
  var matrixToBytes = (matrix) => {
    return [
      fixed_16_16(matrix[0]),
      fixed_16_16(matrix[1]),
      fixed_2_30(matrix[2]),
      fixed_16_16(matrix[3]),
      fixed_16_16(matrix[4]),
      fixed_2_30(matrix[5]),
      fixed_16_16(matrix[6]),
      fixed_16_16(matrix[7]),
      fixed_2_30(matrix[8])
    ];
  };
  var box = (type, contents, children) => ({
    type,
    contents: contents && new Uint8Array(contents.flat(10)),
    children
  });
  var fullBox = (type, version, flags, contents, children) => box(
    type,
    [u8(version), u24(flags), contents != null ? contents : []],
    children
  );
  var ftyp = (holdsHevc) => {
    if (holdsHevc)
      return box("ftyp", [
        ascii("isom"),
        // Major brand
        u32(0),
        // Minor version
        ascii("iso4"),
        // Compatible brand 1
        ascii("hvc1")
        // Compatible brand 2
      ]);
    return box("ftyp", [
      ascii("isom"),
      // Major brand
      u32(0),
      // Minor version
      ascii("isom"),
      // Compatible brand 1
      ascii("avc1"),
      // Compatible brand 2
      ascii("mp41")
      // Compatible brand 3
    ]);
  };
  var mdat = () => ({ type: "mdat", largeSize: true });
  var moov = (tracks, creationTime) => box("moov", null, [
    mvhd(creationTime, tracks),
    ...tracks.map((x) => trak(x, creationTime))
  ]);
  var mvhd = (creationTime, tracks) => {
    let duration = intoTimescale(Math.max(
      0,
      ...tracks.filter((x) => x.samples.length > 0).map((x) => last(x.samples).timestamp + last(x.samples).duration)
    ), GLOBAL_TIMESCALE);
    let nextTrackId = Math.max(...tracks.map((x) => x.id)) + 1;
    return fullBox("mvhd", 0, 0, [
      u32(creationTime),
      // Creation time
      u32(creationTime),
      // Modification time
      u32(GLOBAL_TIMESCALE),
      // Timescale
      u32(duration),
      // Duration
      fixed_16_16(1),
      // Preferred rate
      fixed_8_8(1),
      // Preferred volume
      Array(10).fill(0),
      // Reserved
      matrixToBytes(IDENTITY_MATRIX),
      // Matrix
      Array(24).fill(0),
      // Pre-defined
      u32(nextTrackId)
      // Next track ID
    ]);
  };
  var trak = (track, creationTime) => box("trak", null, [
    tkhd(track, creationTime),
    mdia(track, creationTime)
  ]);
  var tkhd = (track, creationTime) => {
    let lastSample = last(track.samples);
    let durationInGlobalTimescale = intoTimescale(
      lastSample ? lastSample.timestamp + lastSample.duration : 0,
      GLOBAL_TIMESCALE
    );
    return fullBox("tkhd", 0, 3, [
      u32(creationTime),
      // Creation time
      u32(creationTime),
      // Modification time
      u32(track.id),
      // Track ID
      u32(0),
      // Reserved
      u32(durationInGlobalTimescale),
      // Duration
      Array(8).fill(0),
      // Reserved
      u16(0),
      // Layer
      u16(0),
      // Alternate group
      fixed_8_8(track.info.type === "audio" ? 1 : 0),
      // Volume
      u16(0),
      // Reserved
      matrixToBytes(rotationMatrix(track.info.type === "video" ? track.info.rotation : 0)),
      // Matrix
      fixed_16_16(track.info.type === "video" ? track.info.width : 0),
      // Track width
      fixed_16_16(track.info.type === "video" ? track.info.height : 0)
      // Track height
    ]);
  };
  var mdia = (track, creationTime) => box("mdia", null, [
    mdhd(track, creationTime),
    hdlr(track.info.type === "video" ? "vide" : "soun"),
    minf(track)
  ]);
  var mdhd = (track, creationTime) => {
    let lastSample = last(track.samples);
    let localDuration = intoTimescale(
      lastSample ? lastSample.timestamp + lastSample.duration : 0,
      track.timescale
    );
    return fullBox("mdhd", 0, 0, [
      u32(creationTime),
      // Creation time
      u32(creationTime),
      // Modification time
      u32(track.timescale),
      // Timescale
      u32(localDuration),
      // Duration
      u16(21956),
      // Language ("und", undetermined)
      u16(0)
      // Quality
    ]);
  };
  var hdlr = (componentSubtype) => fullBox("hdlr", 0, 0, [
    ascii("mhlr"),
    // Component type
    ascii(componentSubtype),
    // Component subtype
    u32(0),
    // Component manufacturer
    u32(0),
    // Component flags
    u32(0),
    // Component flags mask
    ascii("mp4-muxer-hdlr")
    // Component name
  ]);
  var minf = (track) => box("minf", null, [
    track.info.type === "video" ? vmhd() : smhd(),
    dinf(),
    stbl(track)
  ]);
  var vmhd = () => fullBox("vmhd", 0, 1, [
    u16(0),
    // Graphics mode
    u16(0),
    // Opcolor R
    u16(0),
    // Opcolor G
    u16(0)
    // Opcolor B
  ]);
  var smhd = () => fullBox("smhd", 0, 0, [
    u16(0),
    // Balance
    u16(0)
    // Reserved
  ]);
  var dinf = () => box("dinf", null, [
    dref()
  ]);
  var dref = () => fullBox("dref", 0, 0, [
    u32(1)
    // Entry count
  ], [
    url()
  ]);
  var url = () => fullBox("url ", 0, 1);
  var stbl = (track) => box("stbl", null, [
    stsd(track),
    stts(track),
    stss(track),
    stsc(track),
    stsz(track),
    stco(track)
  ]);
  var stsd = (track) => fullBox("stsd", 0, 0, [
    u32(1)
    // Entry count
  ], [
    track.info.type === "video" ? videoSampleDescription(
      VIDEO_CODEC_TO_BOX_NAME[track.info.codec],
      track
    ) : soundSampleDescription(
      AUDIO_CODEC_TO_BOX_NAME[track.info.codec],
      track
    )
  ]);
  var videoSampleDescription = (compressionType, track) => box(compressionType, [
    Array(6).fill(0),
    // Reserved
    u16(1),
    // Data reference index
    u16(0),
    // Pre-defined
    u16(0),
    // Reserved
    Array(12).fill(0),
    // Pre-defined
    u16(track.info.width),
    // Width
    u16(track.info.height),
    // Height
    u32(4718592),
    // Horizontal resolution
    u32(4718592),
    // Vertical resolution
    u32(0),
    // Reserved
    u16(1),
    // Frame count
    Array(32).fill(0),
    // Compressor name
    u16(24),
    // Depth
    i16(65535)
    // Pre-defined
  ], [
    VIDEO_CODEC_TO_CONFIGURATION_BOX[track.info.codec](track)
  ]);
  var avcC = (track) => track.codecPrivate && box("avcC", [...track.codecPrivate]);
  var hvcC = (track) => track.codecPrivate && box("hvcC", [...track.codecPrivate]);
  var vpcC = (track) => track.codecPrivate && box("vpcC", [...track.codecPrivate]);
  var av1C = (track) => track.codecPrivate && box("av1C", [...track.codecPrivate]);
  var soundSampleDescription = (compressionType, track) => box(compressionType, [
    Array(6).fill(0),
    // Reserved
    u16(1),
    // Data reference index
    u16(0),
    // Version
    u16(0),
    // Revision level
    u32(0),
    // Vendor
    u16(track.info.numberOfChannels),
    // Number of channels
    u16(16),
    // Sample size (bits)
    u16(0),
    // Compression ID
    u16(0),
    // Packet size
    fixed_16_16(track.info.sampleRate)
    // Sample rate
  ], [
    AUDIO_CODEC_TO_CONFIGURATION_BOX[track.info.codec](track)
  ]);
  var esds = (track) => fullBox("esds", 0, 0, [
    // https://stackoverflow.com/a/54803118
    u32(58753152),
    // TAG(3) = Object Descriptor ([2])
    u8(32 + track.codecPrivate.byteLength),
    // length of this OD (which includes the next 2 tags)
    u16(1),
    // ES_ID = 1
    u8(0),
    // flags etc = 0
    u32(75530368),
    // TAG(4) = ES Descriptor ([2]) embedded in above OD
    u8(18 + track.codecPrivate.byteLength),
    // length of this ESD
    u8(64),
    // MPEG-4 Audio
    u8(21),
    // stream type(6bits)=5 audio, flags(2bits)=1
    u24(0),
    // 24bit buffer size
    u32(130071),
    // max bitrate
    u32(130071),
    // avg bitrate
    u32(92307584),
    // TAG(5) = ASC ([2],[3]) embedded in above OD
    u8(track.codecPrivate.byteLength),
    // length
    ...track.codecPrivate,
    u32(109084800),
    // TAG(6)
    u8(1),
    // length
    u8(2)
    // data
  ]);
  var dOps = (track) => box("dOps", [
    u8(0),
    // Version
    u8(track.info.numberOfChannels),
    // OutputChannelCount
    u16(3840),
    // PreSkip, should be at least 80 milliseconds worth of playback, measured in 48000 Hz samples
    u32(track.info.sampleRate),
    // InputSampleRate
    fixed_8_8(0),
    // OutputGain
    u8(0)
    // ChannelMappingFamily
  ]);
  var stts = (track) => {
    return fullBox("stts", 0, 0, [
      u32(track.timeToSampleTable.length),
      // Number of entries
      track.timeToSampleTable.map((x) => [
        // Time-to-sample table
        u32(x.sampleCount),
        // Sample count
        u32(x.sampleDelta)
        // Sample duration
      ])
    ]);
  };
  var stss = (track) => {
    if (track.samples.every((x) => x.type === "key"))
      return null;
    let keySamples = [...track.samples.entries()].filter(([, sample]) => sample.type === "key");
    return fullBox("stss", 0, 0, [
      u32(keySamples.length),
      // Number of entries
      keySamples.map(([index]) => u32(index + 1))
      // Sync sample table
    ]);
  };
  var stsc = (track) => {
    return fullBox("stsc", 0, 0, [
      u32(track.compactlyCodedChunkTable.length),
      // Number of entries
      track.compactlyCodedChunkTable.map((x) => [
        // Sample-to-chunk table
        u32(x.firstChunk),
        // First chunk
        u32(x.samplesPerChunk),
        // Samples per chunk
        u32(1)
        // Sample description index
      ])
    ]);
  };
  var stsz = (track) => fullBox("stsz", 0, 0, [
    u32(0),
    // Sample size (0 means non-constant size)
    u32(track.samples.length),
    // Number of entries
    track.samples.map((x) => u32(x.size))
    // Sample size table
  ]);
  var stco = (track) => {
    if (track.writtenChunks.length > 0 && last(track.writtenChunks).offset >= __pow(2, 32)) {
      return fullBox("co64", 0, 0, [
        u32(track.writtenChunks.length),
        // Number of entries
        track.writtenChunks.map((x) => u64(x.offset))
        // Chunk offset table
      ]);
    }
    return fullBox("stco", 0, 0, [
      u32(track.writtenChunks.length),
      // Number of entries
      track.writtenChunks.map((x) => u32(x.offset))
      // Chunk offset table
    ]);
  };
  var VIDEO_CODEC_TO_BOX_NAME = {
    "avc": "avc1",
    "hevc": "hvc1",
    "vp9": "vp09",
    "av1": "av01"
  };
  var VIDEO_CODEC_TO_CONFIGURATION_BOX = {
    "avc": avcC,
    "hevc": hvcC,
    "vp9": vpcC,
    "av1": av1C
  };
  var AUDIO_CODEC_TO_BOX_NAME = {
    "aac": "mp4a",
    "opus": "opus"
  };
  var AUDIO_CODEC_TO_CONFIGURATION_BOX = {
    "aac": esds,
    "opus": dOps
  };
  var ArrayBufferTarget = class {
    constructor() {
      this.buffer = null;
    }
  };
  var StreamTarget = class {
    constructor(onData, onDone, options) {
      this.onData = onData;
      this.onDone = onDone;
      this.options = options;
    }
  };
  var FileSystemWritableFileStreamTarget = class {
    constructor(stream, options) {
      this.stream = stream;
      this.options = options;
    }
  };
  var _helper;
  var _helperView;
  var Writer = class {
    constructor() {
      this.pos = 0;
      __privateAdd(this, _helper, new Uint8Array(8));
      __privateAdd(this, _helperView, new DataView(__privateGet(this, _helper).buffer));
      this.offsets = /* @__PURE__ */ new WeakMap();
    }
    /** Sets the current position for future writes to a new one. */
    seek(newPos) {
      this.pos = newPos;
    }
    writeU32(value) {
      __privateGet(this, _helperView).setUint32(0, value, false);
      this.write(__privateGet(this, _helper).subarray(0, 4));
    }
    writeU64(value) {
      __privateGet(this, _helperView).setUint32(0, Math.floor(value / __pow(2, 32)), false);
      __privateGet(this, _helperView).setUint32(4, value, false);
      this.write(__privateGet(this, _helper).subarray(0, 8));
    }
    writeAscii(text) {
      for (let i = 0; i < text.length; i++) {
        __privateGet(this, _helperView).setUint8(i % 8, text.charCodeAt(i));
        if (i % 8 === 7)
          this.write(__privateGet(this, _helper));
      }
      if (text.length % 8 !== 0) {
        this.write(__privateGet(this, _helper).subarray(0, text.length % 8));
      }
    }
    writeBox(box2) {
      var _a, _b;
      this.offsets.set(box2, this.pos);
      if (box2.contents && !box2.children) {
        this.writeBoxHeader(box2, (_a = box2.size) != null ? _a : box2.contents.byteLength + 8);
        this.write(box2.contents);
      } else {
        let startPos = this.pos;
        this.writeBoxHeader(box2, 0);
        if (box2.contents)
          this.write(box2.contents);
        if (box2.children) {
          for (let child of box2.children)
            if (child)
              this.writeBox(child);
        }
        let endPos = this.pos;
        let size = (_b = box2.size) != null ? _b : endPos - startPos;
        this.seek(startPos);
        this.writeBoxHeader(box2, size);
        this.seek(endPos);
      }
    }
    writeBoxHeader(box2, size) {
      this.writeU32(box2.largeSize ? 1 : size);
      this.writeAscii(box2.type);
      if (box2.largeSize)
        this.writeU64(size);
    }
    patchBox(box2) {
      let endPos = this.pos;
      this.seek(this.offsets.get(box2));
      this.writeBox(box2);
      this.seek(endPos);
    }
  };
  _helper = /* @__PURE__ */ new WeakMap();
  _helperView = /* @__PURE__ */ new WeakMap();
  var _target;
  var _buffer;
  var _bytes;
  var _ensureSize;
  var ensureSize_fn;
  var ArrayBufferTargetWriter = class extends Writer {
    constructor(target) {
      super();
      __privateAdd(this, _ensureSize);
      __privateAdd(this, _target, void 0);
      __privateAdd(this, _buffer, new ArrayBuffer(__pow(2, 16)));
      __privateAdd(this, _bytes, new Uint8Array(__privateGet(this, _buffer)));
      __privateSet(this, _target, target);
    }
    write(data) {
      __privateMethod(this, _ensureSize, ensureSize_fn).call(this, this.pos + data.byteLength);
      __privateGet(this, _bytes).set(data, this.pos);
      this.pos += data.byteLength;
    }
    finalize() {
      __privateMethod(this, _ensureSize, ensureSize_fn).call(this, this.pos);
      __privateGet(this, _target).buffer = __privateGet(this, _buffer).slice(0, this.pos);
    }
  };
  _target = /* @__PURE__ */ new WeakMap();
  _buffer = /* @__PURE__ */ new WeakMap();
  _bytes = /* @__PURE__ */ new WeakMap();
  _ensureSize = /* @__PURE__ */ new WeakSet();
  ensureSize_fn = function(size) {
    let newLength = __privateGet(this, _buffer).byteLength;
    while (newLength < size)
      newLength *= 2;
    if (newLength === __privateGet(this, _buffer).byteLength)
      return;
    let newBuffer = new ArrayBuffer(newLength);
    let newBytes = new Uint8Array(newBuffer);
    newBytes.set(__privateGet(this, _bytes), 0);
    __privateSet(this, _buffer, newBuffer);
    __privateSet(this, _bytes, newBytes);
  };
  var _target2;
  var _sections;
  var StreamTargetWriter = class extends Writer {
    constructor(target) {
      super();
      __privateAdd(this, _target2, void 0);
      __privateAdd(this, _sections, []);
      __privateSet(this, _target2, target);
    }
    write(data) {
      __privateGet(this, _sections).push({
        data: data.slice(),
        start: this.pos
      });
      this.pos += data.byteLength;
    }
    flush() {
      if (__privateGet(this, _sections).length === 0)
        return;
      let chunks = [];
      let sorted = [...__privateGet(this, _sections)].sort((a, b) => a.start - b.start);
      chunks.push({
        start: sorted[0].start,
        size: sorted[0].data.byteLength
      });
      for (let i = 1; i < sorted.length; i++) {
        let lastChunk = chunks[chunks.length - 1];
        let section = sorted[i];
        if (section.start <= lastChunk.start + lastChunk.size) {
          lastChunk.size = Math.max(lastChunk.size, section.start + section.data.byteLength - lastChunk.start);
        } else {
          chunks.push({
            start: section.start,
            size: section.data.byteLength
          });
        }
      }
      for (let chunk of chunks) {
        chunk.data = new Uint8Array(chunk.size);
        for (let section of __privateGet(this, _sections)) {
          if (chunk.start <= section.start && section.start < chunk.start + chunk.size) {
            chunk.data.set(section.data, section.start - chunk.start);
          }
        }
        __privateGet(this, _target2).onData(chunk.data, chunk.start);
      }
      __privateGet(this, _sections).length = 0;
    }
    finalize() {
      var _a, _b;
      (_b = (_a = __privateGet(this, _target2)).onDone) == null ? void 0 : _b.call(_a);
    }
  };
  _target2 = /* @__PURE__ */ new WeakMap();
  _sections = /* @__PURE__ */ new WeakMap();
  var DEFAULT_CHUNK_SIZE = __pow(2, 24);
  var MAX_CHUNKS_AT_ONCE = 2;
  var _target3;
  var _chunkSize;
  var _chunks;
  var _writeDataIntoChunks;
  var writeDataIntoChunks_fn;
  var _insertSectionIntoChunk;
  var insertSectionIntoChunk_fn;
  var _createChunk;
  var createChunk_fn;
  var _flushChunks;
  var flushChunks_fn;
  var ChunkedStreamTargetWriter = class extends Writer {
    constructor(target) {
      var _a, _b;
      super();
      __privateAdd(this, _writeDataIntoChunks);
      __privateAdd(this, _insertSectionIntoChunk);
      __privateAdd(this, _createChunk);
      __privateAdd(this, _flushChunks);
      __privateAdd(this, _target3, void 0);
      __privateAdd(this, _chunkSize, void 0);
      __privateAdd(this, _chunks, []);
      __privateSet(this, _target3, target);
      __privateSet(this, _chunkSize, (_b = (_a = target.options) == null ? void 0 : _a.chunkSize) != null ? _b : DEFAULT_CHUNK_SIZE);
      if (!Number.isInteger(__privateGet(this, _chunkSize)) || __privateGet(this, _chunkSize) < __pow(2, 10)) {
        throw new Error("Invalid StreamTarget options: chunkSize must be an integer not smaller than 1024.");
      }
    }
    write(data) {
      __privateMethod(this, _writeDataIntoChunks, writeDataIntoChunks_fn).call(this, data, this.pos);
      __privateMethod(this, _flushChunks, flushChunks_fn).call(this);
      this.pos += data.byteLength;
    }
    finalize() {
      var _a, _b;
      __privateMethod(this, _flushChunks, flushChunks_fn).call(this, true);
      (_b = (_a = __privateGet(this, _target3)).onDone) == null ? void 0 : _b.call(_a);
    }
  };
  _target3 = /* @__PURE__ */ new WeakMap();
  _chunkSize = /* @__PURE__ */ new WeakMap();
  _chunks = /* @__PURE__ */ new WeakMap();
  _writeDataIntoChunks = /* @__PURE__ */ new WeakSet();
  writeDataIntoChunks_fn = function(data, position) {
    let chunkIndex = __privateGet(this, _chunks).findIndex((x) => x.start <= position && position < x.start + __privateGet(this, _chunkSize));
    if (chunkIndex === -1)
      chunkIndex = __privateMethod(this, _createChunk, createChunk_fn).call(this, position);
    let chunk = __privateGet(this, _chunks)[chunkIndex];
    let relativePosition = position - chunk.start;
    let toWrite = data.subarray(0, Math.min(__privateGet(this, _chunkSize) - relativePosition, data.byteLength));
    chunk.data.set(toWrite, relativePosition);
    let section = {
      start: relativePosition,
      end: relativePosition + toWrite.byteLength
    };
    __privateMethod(this, _insertSectionIntoChunk, insertSectionIntoChunk_fn).call(this, chunk, section);
    if (chunk.written[0].start === 0 && chunk.written[0].end === __privateGet(this, _chunkSize)) {
      chunk.shouldFlush = true;
    }
    if (__privateGet(this, _chunks).length > MAX_CHUNKS_AT_ONCE) {
      for (let i = 0; i < __privateGet(this, _chunks).length - 1; i++) {
        __privateGet(this, _chunks)[i].shouldFlush = true;
      }
      __privateMethod(this, _flushChunks, flushChunks_fn).call(this);
    }
    if (toWrite.byteLength < data.byteLength) {
      __privateMethod(this, _writeDataIntoChunks, writeDataIntoChunks_fn).call(this, data.subarray(toWrite.byteLength), position + toWrite.byteLength);
    }
  };
  _insertSectionIntoChunk = /* @__PURE__ */ new WeakSet();
  insertSectionIntoChunk_fn = function(chunk, section) {
    let low = 0;
    let high = chunk.written.length - 1;
    let index = -1;
    while (low <= high) {
      let mid = Math.floor(low + (high - low + 1) / 2);
      if (chunk.written[mid].start <= section.start) {
        low = mid + 1;
        index = mid;
      } else {
        high = mid - 1;
      }
    }
    chunk.written.splice(index + 1, 0, section);
    if (index === -1 || chunk.written[index].end < section.start)
      index++;
    while (index < chunk.written.length - 1 && chunk.written[index].end >= chunk.written[index + 1].start) {
      chunk.written[index].end = Math.max(chunk.written[index].end, chunk.written[index + 1].end);
      chunk.written.splice(index + 1, 1);
    }
  };
  _createChunk = /* @__PURE__ */ new WeakSet();
  createChunk_fn = function(includesPosition) {
    let start = Math.floor(includesPosition / __privateGet(this, _chunkSize)) * __privateGet(this, _chunkSize);
    let chunk = {
      start,
      data: new Uint8Array(__privateGet(this, _chunkSize)),
      written: [],
      shouldFlush: false
    };
    __privateGet(this, _chunks).push(chunk);
    __privateGet(this, _chunks).sort((a, b) => a.start - b.start);
    return __privateGet(this, _chunks).indexOf(chunk);
  };
  _flushChunks = /* @__PURE__ */ new WeakSet();
  flushChunks_fn = function(force = false) {
    for (let i = 0; i < __privateGet(this, _chunks).length; i++) {
      let chunk = __privateGet(this, _chunks)[i];
      if (!chunk.shouldFlush && !force)
        continue;
      for (let section of chunk.written) {
        __privateGet(this, _target3).onData(
          chunk.data.subarray(section.start, section.end),
          chunk.start + section.start
        );
      }
      __privateGet(this, _chunks).splice(i--, 1);
    }
  };
  var FileSystemWritableFileStreamTargetWriter = class extends ChunkedStreamTargetWriter {
    constructor(target) {
      var _a;
      super(new StreamTarget(
        (data, position) => target.stream.write({
          type: "write",
          data,
          position
        }),
        void 0,
        { chunkSize: (_a = target.options) == null ? void 0 : _a.chunkSize }
      ));
    }
  };
  var GLOBAL_TIMESCALE = 1e3;
  var SUPPORTED_VIDEO_CODECS2 = ["avc", "hevc", "vp9", "av1"];
  var SUPPORTED_AUDIO_CODECS2 = ["aac", "opus"];
  var TIMESTAMP_OFFSET = 2082844800;
  var MAX_CHUNK_DURATION = 0.5;
  var FIRST_TIMESTAMP_BEHAVIORS = ["strict", "offset"];
  var _options;
  var _writer;
  var _mdat;
  var _videoTrack;
  var _audioTrack;
  var _creationTime;
  var _finalized;
  var _validateOptions;
  var validateOptions_fn;
  var _writeHeader;
  var writeHeader_fn;
  var _prepareTracks;
  var prepareTracks_fn;
  var _generateMpeg4AudioSpecificConfig;
  var generateMpeg4AudioSpecificConfig_fn;
  var _addSampleToTrack;
  var addSampleToTrack_fn;
  var _validateTimestamp;
  var validateTimestamp_fn;
  var _writeCurrentChunk;
  var writeCurrentChunk_fn;
  var _maybeFlushStreamingTargetWriter;
  var maybeFlushStreamingTargetWriter_fn;
  var _ensureNotFinalized;
  var ensureNotFinalized_fn;
  var Muxer = class {
    constructor(options) {
      __privateAdd(this, _validateOptions);
      __privateAdd(this, _writeHeader);
      __privateAdd(this, _prepareTracks);
      __privateAdd(this, _generateMpeg4AudioSpecificConfig);
      __privateAdd(this, _addSampleToTrack);
      __privateAdd(this, _validateTimestamp);
      __privateAdd(this, _writeCurrentChunk);
      __privateAdd(this, _maybeFlushStreamingTargetWriter);
      __privateAdd(this, _ensureNotFinalized);
      __privateAdd(this, _options, void 0);
      __privateAdd(this, _writer, void 0);
      __privateAdd(this, _mdat, void 0);
      __privateAdd(this, _videoTrack, null);
      __privateAdd(this, _audioTrack, null);
      __privateAdd(this, _creationTime, Math.floor(Date.now() / 1e3) + TIMESTAMP_OFFSET);
      __privateAdd(this, _finalized, false);
      var _a;
      __privateMethod(this, _validateOptions, validateOptions_fn).call(this, options);
      this.target = options.target;
      __privateSet(this, _options, __spreadValues({
        firstTimestampBehavior: "strict"
      }, options));
      if (options.target instanceof ArrayBufferTarget) {
        __privateSet(this, _writer, new ArrayBufferTargetWriter(options.target));
      } else if (options.target instanceof StreamTarget) {
        __privateSet(this, _writer, ((_a = options.target.options) == null ? void 0 : _a.chunked) ? new ChunkedStreamTargetWriter(options.target) : new StreamTargetWriter(options.target));
      } else if (options.target instanceof FileSystemWritableFileStreamTarget) {
        __privateSet(this, _writer, new FileSystemWritableFileStreamTargetWriter(options.target));
      } else {
        throw new Error(`Invalid target: ${options.target}`);
      }
      __privateMethod(this, _writeHeader, writeHeader_fn).call(this);
      __privateMethod(this, _prepareTracks, prepareTracks_fn).call(this);
    }
    addVideoChunk(sample, meta, timestamp) {
      let data = new Uint8Array(sample.byteLength);
      sample.copyTo(data);
      this.addVideoChunkRaw(data, sample.type, timestamp != null ? timestamp : sample.timestamp, sample.duration, meta);
    }
    addVideoChunkRaw(data, type, timestamp, duration, meta) {
      __privateMethod(this, _ensureNotFinalized, ensureNotFinalized_fn).call(this);
      if (!__privateGet(this, _options).video)
        throw new Error("No video track declared.");
      __privateMethod(this, _addSampleToTrack, addSampleToTrack_fn).call(this, __privateGet(this, _videoTrack), data, type, timestamp, duration, meta);
    }
    addAudioChunk(sample, meta, timestamp) {
      let data = new Uint8Array(sample.byteLength);
      sample.copyTo(data);
      this.addAudioChunkRaw(data, sample.type, timestamp != null ? timestamp : sample.timestamp, sample.duration, meta);
    }
    addAudioChunkRaw(data, type, timestamp, duration, meta) {
      __privateMethod(this, _ensureNotFinalized, ensureNotFinalized_fn).call(this);
      if (!__privateGet(this, _options).audio)
        throw new Error("No audio track declared.");
      __privateMethod(this, _addSampleToTrack, addSampleToTrack_fn).call(this, __privateGet(this, _audioTrack), data, type, timestamp, duration, meta);
    }
    /** Finalizes the file, making it ready for use. Must be called after all video and audio chunks have been added. */
    finalize() {
      if (__privateGet(this, _videoTrack))
        __privateMethod(this, _writeCurrentChunk, writeCurrentChunk_fn).call(this, __privateGet(this, _videoTrack));
      if (__privateGet(this, _audioTrack))
        __privateMethod(this, _writeCurrentChunk, writeCurrentChunk_fn).call(this, __privateGet(this, _audioTrack));
      let mdatPos = __privateGet(this, _writer).offsets.get(__privateGet(this, _mdat));
      let mdatSize = __privateGet(this, _writer).pos - mdatPos;
      __privateGet(this, _mdat).size = mdatSize;
      __privateGet(this, _writer).patchBox(__privateGet(this, _mdat));
      let movieBox = moov([__privateGet(this, _videoTrack), __privateGet(this, _audioTrack)].filter(Boolean), __privateGet(this, _creationTime));
      __privateGet(this, _writer).writeBox(movieBox);
      __privateMethod(this, _maybeFlushStreamingTargetWriter, maybeFlushStreamingTargetWriter_fn).call(this);
      __privateGet(this, _writer).finalize();
      __privateSet(this, _finalized, true);
    }
  };
  _options = /* @__PURE__ */ new WeakMap();
  _writer = /* @__PURE__ */ new WeakMap();
  _mdat = /* @__PURE__ */ new WeakMap();
  _videoTrack = /* @__PURE__ */ new WeakMap();
  _audioTrack = /* @__PURE__ */ new WeakMap();
  _creationTime = /* @__PURE__ */ new WeakMap();
  _finalized = /* @__PURE__ */ new WeakMap();
  _validateOptions = /* @__PURE__ */ new WeakSet();
  validateOptions_fn = function(options) {
    if (options.video) {
      if (!SUPPORTED_VIDEO_CODECS2.includes(options.video.codec)) {
        throw new Error(`Unsupported video codec: ${options.video.codec}`);
      }
      if (options.video.rotation !== void 0 && ![0, 90, 180, 270].includes(options.video.rotation)) {
        throw new Error(`Invalid video rotation: ${options.video.rotation}. Has to be 0, 90, 180 or 270.`);
      }
    }
    if (options.audio && !SUPPORTED_AUDIO_CODECS2.includes(options.audio.codec)) {
      throw new Error(`Unsupported audio codec: ${options.audio.codec}`);
    }
    if (options.firstTimestampBehavior && !FIRST_TIMESTAMP_BEHAVIORS.includes(options.firstTimestampBehavior)) {
      throw new Error(`Invalid first timestamp behavior: ${options.firstTimestampBehavior}`);
    }
  };
  _writeHeader = /* @__PURE__ */ new WeakSet();
  writeHeader_fn = function() {
    var _a;
    let holdsHevc = ((_a = __privateGet(this, _options).video) == null ? void 0 : _a.codec) === "hevc";
    __privateGet(this, _writer).writeBox(ftyp(holdsHevc));
    __privateSet(this, _mdat, mdat());
    __privateGet(this, _writer).writeBox(__privateGet(this, _mdat));
    __privateMethod(this, _maybeFlushStreamingTargetWriter, maybeFlushStreamingTargetWriter_fn).call(this);
  };
  _prepareTracks = /* @__PURE__ */ new WeakSet();
  prepareTracks_fn = function() {
    var _a;
    if (__privateGet(this, _options).video) {
      __privateSet(this, _videoTrack, {
        id: 1,
        info: {
          type: "video",
          codec: __privateGet(this, _options).video.codec,
          width: __privateGet(this, _options).video.width,
          height: __privateGet(this, _options).video.height,
          rotation: (_a = __privateGet(this, _options).video.rotation) != null ? _a : 0
        },
        timescale: 720,
        // = lcm(24, 30, 60, 120, 144, 240, 360), so should fit with many framerates
        codecPrivate: new Uint8Array(0),
        samples: [],
        writtenChunks: [],
        currentChunk: null,
        firstTimestamp: void 0,
        lastTimestamp: -1,
        timeToSampleTable: [],
        lastTimescaleUnits: null,
        compactlyCodedChunkTable: []
      });
    }
    if (__privateGet(this, _options).audio) {
      let guessedCodecPrivate = __privateMethod(this, _generateMpeg4AudioSpecificConfig, generateMpeg4AudioSpecificConfig_fn).call(
        this,
        2,
        // Object type for AAC-LC, since it's the most common
        __privateGet(this, _options).audio.sampleRate,
        __privateGet(this, _options).audio.numberOfChannels
      );
      __privateSet(this, _audioTrack, {
        id: __privateGet(this, _options).video ? 2 : 1,
        info: {
          type: "audio",
          codec: __privateGet(this, _options).audio.codec,
          numberOfChannels: __privateGet(this, _options).audio.numberOfChannels,
          sampleRate: __privateGet(this, _options).audio.sampleRate
        },
        timescale: __privateGet(this, _options).audio.sampleRate,
        codecPrivate: guessedCodecPrivate,
        samples: [],
        writtenChunks: [],
        currentChunk: null,
        firstTimestamp: void 0,
        lastTimestamp: -1,
        timeToSampleTable: [],
        lastTimescaleUnits: null,
        compactlyCodedChunkTable: []
      });
    }
  };
  _generateMpeg4AudioSpecificConfig = /* @__PURE__ */ new WeakSet();
  generateMpeg4AudioSpecificConfig_fn = function(objectType, sampleRate, numberOfChannels) {
    let frequencyIndices = [96e3, 88200, 64e3, 48e3, 44100, 32e3, 24e3, 22050, 16e3, 12e3, 11025, 8e3, 7350];
    let frequencyIndex = frequencyIndices.indexOf(sampleRate);
    let channelConfig = numberOfChannels;
    let configBits = "";
    configBits += objectType.toString(2).padStart(5, "0");
    configBits += frequencyIndex.toString(2).padStart(4, "0");
    if (frequencyIndex === 15)
      configBits += sampleRate.toString(2).padStart(24, "0");
    configBits += channelConfig.toString(2).padStart(4, "0");
    let paddingLength = Math.ceil(configBits.length / 8) * 8;
    configBits = configBits.padEnd(paddingLength, "0");
    let configBytes = new Uint8Array(configBits.length / 8);
    for (let i = 0; i < configBits.length; i += 8) {
      configBytes[i / 8] = parseInt(configBits.slice(i, i + 8), 2);
    }
    return configBytes;
  };
  _addSampleToTrack = /* @__PURE__ */ new WeakSet();
  addSampleToTrack_fn = function(track, data, type, timestamp, duration, meta) {
    var _a;
    let timestampInSeconds = timestamp / 1e6;
    let durationInSeconds = duration / 1e6;
    if (track.firstTimestamp === void 0)
      track.firstTimestamp = timestampInSeconds;
    timestampInSeconds = __privateMethod(this, _validateTimestamp, validateTimestamp_fn).call(this, timestampInSeconds, track);
    track.lastTimestamp = timestampInSeconds;
    if (!track.currentChunk || timestampInSeconds - track.currentChunk.startTimestamp >= MAX_CHUNK_DURATION) {
      if (track.currentChunk)
        __privateMethod(this, _writeCurrentChunk, writeCurrentChunk_fn).call(this, track);
      track.currentChunk = {
        startTimestamp: timestampInSeconds,
        sampleData: [],
        sampleCount: 0
      };
    }
    track.currentChunk.sampleData.push(data);
    track.currentChunk.sampleCount++;
    if ((_a = meta == null ? void 0 : meta.decoderConfig) == null ? void 0 : _a.description) {
      track.codecPrivate = new Uint8Array(meta.decoderConfig.description);
    }
    track.samples.push({
      timestamp: timestampInSeconds,
      duration: durationInSeconds,
      size: data.byteLength,
      type
    });
    if (track.lastTimescaleUnits !== null) {
      let timescaleUnits = intoTimescale(timestampInSeconds, track.timescale, false);
      let delta = Math.round(timescaleUnits - track.lastTimescaleUnits);
      track.lastTimescaleUnits += delta;
      let lastTableEntry = last(track.timeToSampleTable);
      if (lastTableEntry.sampleCount === 1) {
        lastTableEntry.sampleDelta = delta;
        lastTableEntry.sampleCount++;
      } else if (lastTableEntry.sampleDelta === delta) {
        lastTableEntry.sampleCount++;
      } else {
        lastTableEntry.sampleCount--;
        track.timeToSampleTable.push({
          sampleCount: 2,
          sampleDelta: delta
        });
      }
    } else {
      track.lastTimescaleUnits = 0;
      track.timeToSampleTable.push({
        sampleCount: 1,
        sampleDelta: intoTimescale(durationInSeconds, track.timescale)
      });
    }
  };
  _validateTimestamp = /* @__PURE__ */ new WeakSet();
  validateTimestamp_fn = function(timestamp, track) {
    if (__privateGet(this, _options).firstTimestampBehavior === "strict" && track.lastTimestamp === -1 && timestamp !== 0) {
      throw new Error(
        `The first chunk for your media track must have a timestamp of 0 (received ${timestamp}). Non-zero first timestamps are often caused by directly piping frames or audio data from a MediaStreamTrack into the encoder. Their timestamps are typically relative to the age of the document, which is probably what you want.

If you want to offset all timestamps of a track such that the first one is zero, set firstTimestampBehavior: 'offset' in the options.
`
      );
    } else if (__privateGet(this, _options).firstTimestampBehavior === "offset") {
      timestamp -= track.firstTimestamp;
    }
    if (timestamp < track.lastTimestamp) {
      throw new Error(
        `Timestamps must be monotonically increasing (went from ${track.lastTimestamp * 1e6} to ${timestamp * 1e6}).`
      );
    }
    return timestamp;
  };
  _writeCurrentChunk = /* @__PURE__ */ new WeakSet();
  writeCurrentChunk_fn = function(track) {
    if (!track.currentChunk)
      return;
    track.currentChunk.offset = __privateGet(this, _writer).pos;
    for (let bytes2 of track.currentChunk.sampleData)
      __privateGet(this, _writer).write(bytes2);
    track.currentChunk.sampleData = null;
    if (track.compactlyCodedChunkTable.length === 0 || last(track.compactlyCodedChunkTable).samplesPerChunk !== track.currentChunk.sampleCount) {
      track.compactlyCodedChunkTable.push({
        firstChunk: track.writtenChunks.length + 1,
        // 1-indexed
        samplesPerChunk: track.currentChunk.sampleCount
      });
    }
    track.writtenChunks.push(track.currentChunk);
    __privateMethod(this, _maybeFlushStreamingTargetWriter, maybeFlushStreamingTargetWriter_fn).call(this);
  };
  _maybeFlushStreamingTargetWriter = /* @__PURE__ */ new WeakSet();
  maybeFlushStreamingTargetWriter_fn = function() {
    if (__privateGet(this, _writer) instanceof StreamTargetWriter) {
      __privateGet(this, _writer).flush();
    }
  };
  _ensureNotFinalized = /* @__PURE__ */ new WeakSet();
  ensureNotFinalized_fn = function() {
    if (__privateGet(this, _finalized)) {
      throw new Error("Cannot add new video or audio chunks after the file has been finalized.");
    }
  };

  // src/mp4muxer.ts
  var Mp4MuxerWrapper = class {
    constructor(config, postMessageCallback, options) {
      this.videoConfigured = false;
      this.audioConfigured = false;
      this.firstAudioTimestamp = null;
      this.firstVideoTimestamp = null;
      this.config = config;
      this.postMessageToMain = postMessageCallback;
      const disableAudio = options?.disableAudio ?? false;
      const videoCodecOption = config.codec?.video ?? "avc";
      let muxerVideoCodec;
      switch (videoCodecOption) {
        case "hevc":
          muxerVideoCodec = "hevc";
          break;
        case "vp9":
          muxerVideoCodec = "vp9";
          break;
        case "av1":
          muxerVideoCodec = "av1";
          break;
        case "avc":
        default:
          muxerVideoCodec = "avc";
          break;
      }
      const audioCodecOption = config.codec?.audio ?? "aac";
      const muxerAudioCodec = audioCodecOption;
      const commonMuxerOptions = {
        video: {
          codec: muxerVideoCodec,
          width: config.width,
          height: config.height
          // framerate is not directly a muxer option here, but good to have in config
        }
      };
      if (!disableAudio) {
        commonMuxerOptions.audio = {
          codec: muxerAudioCodec,
          sampleRate: config.sampleRate,
          numberOfChannels: config.channels
        };
      }
      if (config.latencyMode === "realtime") {
        this.target = new StreamTarget({
          onData: (chunk, position) => {
            const chunkCopy = new Uint8Array(chunk.slice(0));
            const isHeader = position === 0;
            const message = {
              type: "dataChunk",
              chunk: chunkCopy,
              offset: position,
              // Use position as offset
              isHeader,
              container: "mp4"
            };
            this.postMessageToMain(message, [chunkCopy.buffer]);
          }
        });
        this.muxer = new Muxer({
          target: this.target,
          ...commonMuxerOptions,
          fastStart: "fragmented"
        });
      } else {
        this.target = new ArrayBufferTarget();
        this.muxer = new Muxer({
          target: this.target,
          ...commonMuxerOptions,
          fastStart: "in-memory"
          // or false, depending on desired behavior for non-realtime
        });
      }
      this.videoConfigured = true;
      this.audioConfigured = !disableAudio;
    }
    addVideoChunk(chunk, meta) {
      if (!this.videoConfigured) {
        this.postMessageToMain({
          type: "error",
          errorDetail: {
            message: "MP4: Video track not configured.",
            type: "configuration-error" /* ConfigurationError */
          }
        });
        return;
      }
      try {
        let adjustedChunk = chunk;
        const adjustedMeta = meta;
        if (this.config.firstTimestampBehavior === "offset" && typeof chunk.timestamp === "number") {
          if (this.firstVideoTimestamp === null) {
            this.firstVideoTimestamp = chunk.timestamp;
            const data = new Uint8Array(chunk.byteLength);
            chunk.copyTo(data.buffer);
            chunk.close?.();
            adjustedChunk = new EncodedVideoChunk({
              type: chunk.type,
              timestamp: 0,
              // First frame becomes 0
              duration: chunk.duration ?? void 0,
              data: data.buffer
            });
          } else {
            const newTimestamp = Math.max(
              0,
              chunk.timestamp - this.firstVideoTimestamp
            );
            const data = new Uint8Array(chunk.byteLength);
            chunk.copyTo(data.buffer);
            chunk.close?.();
            adjustedChunk = new EncodedVideoChunk({
              type: chunk.type,
              timestamp: newTimestamp,
              duration: chunk.duration ?? void 0,
              data: data.buffer
            });
          }
        } else if (typeof chunk.timestamp !== "number" && this.config.firstTimestampBehavior === "offset") {
        }
        this.muxer.addVideoChunk(adjustedChunk, adjustedMeta);
      } catch (e) {
        this.postMessageToMain({
          type: "error",
          errorDetail: {
            message: `MP4: Error adding video chunk: ${e.message}`,
            type: "muxing-failed" /* MuxingFailed */,
            stack: e.stack
          }
        });
      }
    }
    addAudioChunk(chunk, meta) {
      if (!this.audioConfigured) {
        return;
      }
      try {
        let adjustedChunk = chunk;
        const adjustedMeta = meta;
        if (this.config.firstTimestampBehavior === "offset" && typeof chunk.timestamp === "number") {
          if (this.firstAudioTimestamp === null) {
            this.firstAudioTimestamp = chunk.timestamp;
            const data = new Uint8Array(chunk.byteLength);
            chunk.copyTo(data.buffer);
            chunk.close?.();
            adjustedChunk = new EncodedAudioChunk({
              type: chunk.type,
              timestamp: 0,
              // First audio frame becomes 0
              duration: chunk.duration ?? void 0,
              data: data.buffer
            });
          } else {
            const newTimestamp = Math.max(
              0,
              chunk.timestamp - this.firstAudioTimestamp
            );
            const data = new Uint8Array(chunk.byteLength);
            chunk.copyTo(data.buffer);
            chunk.close?.();
            adjustedChunk = new EncodedAudioChunk({
              type: chunk.type,
              timestamp: newTimestamp,
              duration: chunk.duration ?? void 0,
              data: data.buffer
            });
          }
        } else if (typeof chunk.timestamp !== "number" && this.config.firstTimestampBehavior === "offset") {
        }
        this.muxer.addAudioChunk(adjustedChunk, adjustedMeta);
      } catch (e) {
        this.postMessageToMain({
          type: "error",
          errorDetail: {
            message: `MP4: Error adding audio chunk: ${e.message}`,
            type: "muxing-failed" /* MuxingFailed */,
            stack: e.stack
          }
        });
      }
    }
    finalize() {
      if (this.config.latencyMode === "realtime") {
        try {
          this.muxer.finalize();
        } catch (e) {
          this.postMessageToMain({
            type: "error",
            errorDetail: {
              message: `MP4: Error finalizing muxer (realtime): ${e.message}`,
              type: "muxing-failed" /* MuxingFailed */,
              stack: e.stack
            }
          });
        }
        return null;
      }
      if (!(this.target instanceof ArrayBufferTarget)) {
        this.postMessageToMain({
          type: "error",
          errorDetail: {
            message: "MP4: Muxer target is not ArrayBufferTarget in non-realtime mode.",
            type: "internal-error" /* InternalError */
          }
        });
        return null;
      }
      try {
        this.muxer.finalize();
        const buffer = this.target.buffer;
        this.target = new ArrayBufferTarget();
        return new Uint8Array(buffer);
      } catch (e) {
        this.postMessageToMain({
          type: "error",
          errorDetail: {
            message: `MP4: Error finalizing muxer (non-realtime): ${e.message}`,
            type: "muxing-failed" /* MuxingFailed */,
            stack: e.stack
          }
        });
        return null;
      }
    }
  };

  // src/webmmuxer.ts
  var import_webm_muxer = __toESM(require_webm_muxer(), 1);
  var CallbackWritableStream = class {
    constructor(onData) {
      this.onData = onData;
      this.position = 0;
    }
    write({ data, position }) {
      this.onData(data, position);
      this.position = position + data.byteLength;
    }
  };
  var WebMMuxerWrapper = class {
    constructor(config, postMessageCallback, options) {
      this.videoConfigured = false;
      this.audioConfigured = false;
      this.firstAudioTimestamp = null;
      this.firstVideoTimestamp = null;
      this.config = config;
      this.postMessageToMain = postMessageCallback;
      const disableAudio = options?.disableAudio ?? false;
      const videoCodecOption = config.codec?.video ?? "vp9";
      let muxerVideoCodec;
      switch (videoCodecOption) {
        case "vp8":
          muxerVideoCodec = "V_VP8";
          break;
        case "vp9":
          muxerVideoCodec = "V_VP9";
          break;
        case "av1":
          muxerVideoCodec = "V_AV1";
          break;
        default:
          muxerVideoCodec = "V_VP9";
          break;
      }
      const muxerAudioCodec = "A_OPUS";
      const target = config.latencyMode === "realtime" ? new CallbackWritableStream((chunk, position) => {
        const chunkCopy = new Uint8Array(chunk.slice(0));
        const isHeader = position === 0;
        const message = {
          type: "dataChunk",
          chunk: chunkCopy,
          offset: position,
          isHeader,
          container: "webm"
        };
        this.postMessageToMain(message, [chunkCopy.buffer]);
      }) : "buffer";
      const optionsForMuxer = {
        target,
        video: {
          codec: muxerVideoCodec,
          width: config.width,
          height: config.height,
          frameRate: config.frameRate
        }
      };
      if (!disableAudio) {
        optionsForMuxer.audio = {
          codec: muxerAudioCodec,
          numberOfChannels: config.channels,
          sampleRate: config.sampleRate
        };
      }
      this.muxer = new import_webm_muxer.default(optionsForMuxer);
      this.videoConfigured = true;
      this.audioConfigured = !disableAudio;
    }
    addVideoChunk(chunk, meta) {
      if (!this.videoConfigured) {
        this.postMessageToMain({
          type: "error",
          errorDetail: {
            message: "WebM: Video track not configured.",
            type: "configuration-error" /* ConfigurationError */
          }
        });
        return;
      }
      try {
        let adjustedChunk = chunk;
        const adjustedMeta = meta;
        if (this.config.firstTimestampBehavior === "offset" && typeof chunk.timestamp === "number") {
          if (this.firstVideoTimestamp === null) {
            this.firstVideoTimestamp = chunk.timestamp;
            const data = new Uint8Array(chunk.byteLength);
            chunk.copyTo(data.buffer);
            chunk.close?.();
            adjustedChunk = new EncodedVideoChunk({
              type: chunk.type,
              timestamp: 0,
              duration: chunk.duration ?? void 0,
              data: data.buffer
            });
          } else {
            const newTimestamp = Math.max(
              0,
              chunk.timestamp - this.firstVideoTimestamp
            );
            const data = new Uint8Array(chunk.byteLength);
            chunk.copyTo(data.buffer);
            chunk.close?.();
            adjustedChunk = new EncodedVideoChunk({
              type: chunk.type,
              timestamp: newTimestamp,
              duration: chunk.duration ?? void 0,
              data: data.buffer
            });
          }
        }
        this.muxer.addVideoChunk(adjustedChunk, adjustedMeta);
      } catch (e) {
        this.postMessageToMain({
          type: "error",
          errorDetail: {
            message: `WebM: Error adding video chunk: ${e.message}`,
            type: "muxing-failed" /* MuxingFailed */,
            stack: e.stack
          }
        });
      }
    }
    addAudioChunk(chunk, meta) {
      if (!this.audioConfigured) return;
      try {
        let adjustedChunk = chunk;
        const adjustedMeta = meta;
        if (this.config.firstTimestampBehavior === "offset" && typeof chunk.timestamp === "number") {
          if (this.firstAudioTimestamp === null) {
            this.firstAudioTimestamp = chunk.timestamp;
            const data = new Uint8Array(chunk.byteLength);
            chunk.copyTo(data.buffer);
            chunk.close?.();
            adjustedChunk = new EncodedAudioChunk({
              type: chunk.type,
              timestamp: 0,
              duration: chunk.duration ?? void 0,
              data: data.buffer
            });
          } else {
            const newTimestamp = Math.max(
              0,
              chunk.timestamp - this.firstAudioTimestamp
            );
            const data = new Uint8Array(chunk.byteLength);
            chunk.copyTo(data.buffer);
            chunk.close?.();
            adjustedChunk = new EncodedAudioChunk({
              type: chunk.type,
              timestamp: newTimestamp,
              duration: chunk.duration ?? void 0,
              data: data.buffer
            });
          }
        }
        this.muxer.addAudioChunk(adjustedChunk, adjustedMeta);
      } catch (e) {
        this.postMessageToMain({
          type: "error",
          errorDetail: {
            message: `WebM: Error adding audio chunk: ${e.message}`,
            type: "muxing-failed" /* MuxingFailed */,
            stack: e.stack
          }
        });
      }
    }
    finalize() {
      if (this.config.latencyMode === "realtime") {
        try {
          this.muxer.finalize();
        } catch (e) {
          this.postMessageToMain({
            type: "error",
            errorDetail: {
              message: `WebM: Error finalizing muxer (realtime): ${e.message}`,
              type: "muxing-failed" /* MuxingFailed */,
              stack: e.stack
            }
          });
        }
        return null;
      }
      try {
        const buffer = this.muxer.finalize();
        if (buffer) return new Uint8Array(buffer);
        this.postMessageToMain({
          type: "error",
          errorDetail: {
            message: "WebM: Muxer finalized without output in non-realtime mode.",
            type: "muxing-failed" /* MuxingFailed */
          }
        });
        return null;
      } catch (e) {
        this.postMessageToMain({
          type: "error",
          errorDetail: {
            message: `WebM: Error finalizing muxer (non-realtime): ${e.message}`,
            type: "muxing-failed" /* MuxingFailed */,
            stack: e.stack
          }
        });
        return null;
      }
    }
  };

  // src/logger.ts
  var logger = {
    log: (...args) => {
      console.log(...args);
    },
    warn: (...args) => {
      console.warn(...args);
    },
    error: (...args) => {
      console.error(...args);
    }
  };
  var logger_default = logger;

  // src/worker.ts
  if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
    self.addEventListener("error", (event) => {
      console.error("Unhandled global error in worker. Event:", event);
      const errorDetails = {
        message: event.message || "Unknown global error",
        name: event.error?.name || "Error",
        stack: event.error?.stack || void 0,
        filename: event.filename || void 0,
        lineno: event.lineno || void 0,
        colno: event.colno || void 0
      };
      self.postMessage({
        type: "worker-error",
        error: {
          message: `Unhandled global error: ${errorDetails.message} (at ${errorDetails.filename}:${errorDetails.lineno}:${errorDetails.colno})`,
          name: errorDetails.name,
          stack: errorDetails.stack
          // cause: event.error?.cause // event.errorがErrorインスタンスであればcauseも取得可能
        }
      });
    });
  }
  if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
    self.addEventListener(
      "unhandledrejection",
      (event) => {
        console.error(
          "Unhandled promise rejection in worker. Reason:",
          event.reason
        );
        const reason = event.reason;
        let errorDetails;
        if (reason instanceof Error) {
          errorDetails = {
            message: reason.message,
            name: reason.name,
            stack: reason.stack
            // cause: reason.cause,
          };
        } else {
          errorDetails = {
            message: String(reason),
            name: "UnhandledRejection",
            stack: void 0
          };
        }
        self.postMessage({
          type: "worker-error",
          error: {
            message: `Unhandled promise rejection: ${errorDetails.message}`,
            name: errorDetails.name,
            stack: errorDetails.stack
            // cause: errorDetails.cause,
          }
        });
      }
    );
  }
  var getVideoEncoder = () => self.VideoEncoder ?? globalThis.VideoEncoder;
  var getAudioEncoder = () => self.AudioEncoder ?? globalThis.AudioEncoder;
  var getAudioData = () => self.AudioData ?? globalThis.AudioData;
  var EncoderWorker = class {
    constructor() {
      this.videoEncoder = null;
      this.audioEncoder = null;
      this.muxer = null;
      this.currentConfig = null;
      this.processedFrames = 0;
      this.videoFrameCount = 0;
      this.isCancelled = false;
      this.audioWorkletPort = null;
    }
    postMessageToMainThread(message, transfer) {
      if (transfer && transfer.length > 0) {
        self.postMessage(message, transfer);
      } else {
        self.postMessage(message);
      }
    }
    defaultAvcCodecString(width, height, frameRate, profile) {
      const mbPerSec = Math.ceil(width / 16) * Math.ceil(height / 16) * frameRate;
      let level;
      if (mbPerSec <= 108e3) level = 31;
      else if (mbPerSec <= 216e3) level = 32;
      else if (mbPerSec <= 245760) level = 40;
      else if (mbPerSec <= 589824) level = 50;
      else if (mbPerSec <= 983040) level = 51;
      else level = 52;
      const chosenProfile = profile ?? (width >= 1280 || height >= 720 ? "high" : "baseline");
      const profileHex = chosenProfile === "high" ? "64" : chosenProfile === "main" ? "4d" : "42";
      const levelHex = level.toString(16).padStart(2, "0");
      return `avc1.${profileHex}00${levelHex}`;
    }
    avcProfileFromCodecString(codec) {
      if (codec.startsWith("avc1.64")) return "high";
      if (codec.startsWith("avc1.4d")) return "main";
      if (codec.startsWith("avc1.42")) return "baseline";
      return null;
    }
    async isConfigSupportedWithHwFallback(Ctor, config, label) {
      let support = await Ctor.isConfigSupported(config);
      if (support?.supported && support.config) return support.config;
      const pref = config.hardwareAcceleration;
      if (pref) {
        let altPref;
        if (pref === "prefer-hardware") altPref = "prefer-software";
        else if (pref === "prefer-software") altPref = "prefer-hardware";
        if (altPref) {
          const opposite = { ...config, hardwareAcceleration: altPref };
          support = await Ctor.isConfigSupported(opposite);
          if (support?.supported && support.config) {
            console.warn(
              `${label}: hardwareAcceleration preference '${pref}' not supported. Using '${altPref}'.`
            );
            return support.config;
          }
        }
        const noPref = { ...config };
        delete noPref.hardwareAcceleration;
        support = await Ctor.isConfigSupported(noPref);
        if (support?.supported && support.config) {
          console.warn(
            `${label}: hardwareAcceleration preference '${pref}' not supported. Using no preference.`
          );
          return support.config;
        }
        console.warn(
          `${label}: Failed to find a supported hardware acceleration configuration for codec ${config.codec}.`
        );
      }
      return null;
    }
    postQueueSize() {
      this.postMessageToMainThread({
        type: "queueSize",
        videoQueueSize: this.videoEncoder?.encodeQueueSize ?? 0,
        audioQueueSize: this.audioEncoder?.encodeQueueSize ?? 0
      });
    }
    async initializeEncoders(data) {
      this.currentConfig = data.config;
      this.totalFramesToProcess = data.totalFrames;
      this.processedFrames = 0;
      this.videoFrameCount = 0;
      this.isCancelled = false;
      if (!this.currentConfig) {
        this.postMessageToMainThread({
          type: "error",
          errorDetail: {
            message: "Worker: Configuration is missing.",
            type: "initialization-failed" /* InitializationFailed */
          }
        });
        return;
      }
      const audioDisabled = !this.currentConfig.audioBitrate || this.currentConfig.audioBitrate <= 0 || !this.currentConfig.channels || this.currentConfig.channels <= 0 || !this.currentConfig.sampleRate || this.currentConfig.sampleRate <= 0 || !this.currentConfig.codec?.audio;
      try {
        const MuxerCtor = this.currentConfig.container === "webm" ? WebMMuxerWrapper : Mp4MuxerWrapper;
        this.muxer = new MuxerCtor(
          this.currentConfig,
          this.postMessageToMainThread.bind(this),
          {
            disableAudio: audioDisabled
          }
        );
      } catch (e) {
        this.postMessageToMainThread({
          type: "error",
          errorDetail: {
            message: `Worker: Failed to initialize Muxer: ${e.message}`,
            type: "initialization-failed" /* InitializationFailed */,
            stack: e.stack
          }
        });
        this.cleanup();
        return;
      }
      let videoCodec = this.currentConfig.codec?.video ?? (this.currentConfig.container === "webm" ? "vp9" : "avc");
      if (this.currentConfig.container === "webm" && (videoCodec === "avc" || videoCodec === "hevc")) {
        console.warn(
          `Worker: Video codec ${videoCodec} not compatible with WebM. Switching to VP9.`
        );
        videoCodec = "vp9";
      }
      let finalVideoEncoderConfig = null;
      const resolvedVideoCodecString = this.currentConfig.codecString?.video ?? (videoCodec === "avc" ? this.defaultAvcCodecString(
        this.currentConfig.width,
        this.currentConfig.height,
        this.currentConfig.frameRate
      ) : videoCodec === "vp9" ? "vp09.00.50.08" : videoCodec === "vp8" ? "vp8" : videoCodec === "hevc" ? "hvc1" : videoCodec === "av1" ? "av01.0.04M.08" : videoCodec);
      const videoEncoderConfig = {
        codec: resolvedVideoCodecString,
        width: this.currentConfig.width,
        height: this.currentConfig.height,
        bitrate: this.currentConfig.videoBitrate,
        framerate: this.currentConfig.frameRate,
        ...this.currentConfig.container === "mp4" && videoCodec === "avc" ? { avc: { format: "avc" } } : {},
        ...this.currentConfig.hardwareAcceleration ? { hardwareAcceleration: this.currentConfig.hardwareAcceleration } : {}
      };
      const VideoEncoderCtor = getVideoEncoder();
      if (!VideoEncoderCtor) {
        this.postMessageToMainThread({
          type: "error",
          errorDetail: {
            message: "Worker: VideoEncoder not available",
            type: "not-supported" /* NotSupported */
          }
        });
        this.cleanup();
        return;
      }
      const initialSupport = await VideoEncoderCtor.isConfigSupported(videoEncoderConfig);
      if (initialSupport?.supported && initialSupport.config) {
        finalVideoEncoderConfig = initialSupport.config;
      } else {
        if (videoCodec === "vp9" || videoCodec === "vp8" || videoCodec === "av1") {
          console.warn(
            "Worker: Video codec " + videoCodec + " not supported or config invalid. Falling back to AVC."
          );
          videoCodec = "avc";
          const avcCodecString = this.defaultAvcCodecString(
            this.currentConfig.width,
            this.currentConfig.height,
            this.currentConfig.frameRate
          );
          const avcConfig = {
            ...videoEncoderConfig,
            codec: avcCodecString,
            ...this.currentConfig.container === "mp4" ? { avc: { format: "avc" } } : {}
          };
          const support = await this.isConfigSupportedWithHwFallback(
            VideoEncoderCtor,
            avcConfig,
            "VideoEncoder"
          );
          if (support) {
            finalVideoEncoderConfig = support;
          } else {
            this.postMessageToMainThread({
              type: "error",
              errorDetail: {
                message: "Worker: AVC (H.264) video codec is not supported after fallback.",
                type: "not-supported" /* NotSupported */
              }
            });
            this.cleanup();
            return;
          }
        } else {
          const result = await this.isConfigSupportedWithHwFallback(
            VideoEncoderCtor,
            videoEncoderConfig,
            "VideoEncoder"
          );
          if (result) {
            finalVideoEncoderConfig = result;
          } else {
            this.postMessageToMainThread({
              type: "error",
              errorDetail: {
                message: `Worker: Video codec ${videoCodec} config not supported.`,
                type: "not-supported" /* NotSupported */
              }
            });
            this.cleanup();
            return;
          }
        }
      }
      try {
        this.videoEncoder = new VideoEncoderCtor({
          output: (chunk, meta) => {
            if (this.isCancelled || !this.muxer) return;
            this.muxer.addVideoChunk(chunk, meta);
          },
          error: (error) => {
            if (this.isCancelled) return;
            this.postMessageToMainThread({
              type: "error",
              errorDetail: {
                message: `VideoEncoder error: ${error.message}`,
                type: "video-encoding-error" /* VideoEncodingError */,
                stack: error.stack
              }
            });
            this.cleanup();
          }
        });
        if (finalVideoEncoderConfig) {
          if (this.videoEncoder) {
            this.videoEncoder.configure(finalVideoEncoderConfig);
          } else {
            this.postMessageToMainThread({
              type: "error",
              errorDetail: {
                message: "Worker: VideoEncoder instance is null after creation.",
                type: "initialization-failed" /* InitializationFailed */
              }
            });
            this.cleanup();
            return;
          }
        } else {
          this.postMessageToMainThread({
            type: "error",
            errorDetail: {
              message: `Worker: VideoEncoder: Failed to find a supported hardware acceleration configuration for codec ${resolvedVideoCodecString}`,
              type: "not-supported" /* NotSupported */
            }
          });
          this.cleanup();
          return;
        }
      } catch (e) {
        this.postMessageToMainThread({
          type: "error",
          errorDetail: {
            message: `Worker: Failed to initialize VideoEncoder: ${e.message}`,
            type: "initialization-failed" /* InitializationFailed */,
            stack: e.stack
          }
        });
        this.cleanup();
        return;
      }
      let finalAudioEncoderConfig = null;
      let audioCodec = this.currentConfig.codec?.audio ?? (this.currentConfig.container === "webm" ? "opus" : "aac");
      if (this.currentConfig.container === "webm" && audioCodec === "aac") {
        console.warn(
          "Worker: AAC audio codec is not compatible with WebM. Switching to Opus."
        );
        audioCodec = "opus";
      }
      if (!audioDisabled) {
        const resolvedAudioCodecString = this.currentConfig.codecString?.audio ?? (audioCodec === "opus" ? "opus" : "mp4a.40.2");
        const baseAudioConfig = {
          sampleRate: this.currentConfig.sampleRate,
          numberOfChannels: this.currentConfig.channels,
          bitrate: this.currentConfig.audioBitrate,
          codec: resolvedAudioCodecString,
          ...this.currentConfig.audioBitrateMode && {
            bitrateMode: this.currentConfig.audioBitrateMode
          },
          ...this.currentConfig.latencyMode && {
            latencyMode: this.currentConfig.latencyMode
          },
          ...this.currentConfig.hardwareAcceleration && {
            hardwareAcceleration: this.currentConfig.hardwareAcceleration
          },
          ...this.currentConfig.audioEncoderConfig ?? {}
        };
        const AudioEncoderCtor = getAudioEncoder();
        if (!AudioEncoderCtor) {
          this.postMessageToMainThread({
            type: "error",
            errorDetail: {
              message: "Worker: AudioEncoder not available",
              type: "not-supported" /* NotSupported */
            }
          });
          this.cleanup();
          return;
        }
        let audioSupportConfig = await this.isConfigSupportedWithHwFallback(
          AudioEncoderCtor,
          baseAudioConfig,
          "AudioEncoder"
        );
        if (audioSupportConfig) {
          if (audioSupportConfig.numberOfChannels !== this.currentConfig.channels) {
            this.postMessageToMainThread({
              type: "error",
              errorDetail: {
                message: `AudioEncoder reported numberOfChannels (${audioSupportConfig.numberOfChannels}) does not match configured channels (${this.currentConfig.channels}).`,
                type: "configuration-error" /* ConfigurationError */
              }
            });
            this.cleanup();
            return;
          }
          finalAudioEncoderConfig = audioSupportConfig;
        } else if (audioCodec === "opus") {
          console.warn(
            `Worker: Audio codec ${audioCodec} not supported or config invalid. Falling back to AAC.`
          );
          if (this.currentConfig.container === "webm") {
            this.postMessageToMainThread({
              type: "error",
              errorDetail: {
                message: "Worker: Opus audio codec not supported for WebM container.",
                type: "not-supported" /* NotSupported */
              }
            });
            this.cleanup();
            return;
          }
          audioCodec = "aac";
          const fallbackAudioConfig = {
            ...baseAudioConfig,
            codec: this.currentConfig.codecString?.audio ?? "mp4a.40.2"
          };
          audioSupportConfig = await this.isConfigSupportedWithHwFallback(
            AudioEncoderCtor,
            fallbackAudioConfig,
            "AudioEncoder"
          );
          if (audioSupportConfig) {
            if (audioSupportConfig.numberOfChannels !== this.currentConfig.channels) {
              this.postMessageToMainThread({
                type: "error",
                errorDetail: {
                  message: `AudioEncoder reported numberOfChannels (${audioSupportConfig.numberOfChannels}) does not match configured channels (${this.currentConfig.channels}).`,
                  type: "configuration-error" /* ConfigurationError */
                }
              });
              this.cleanup();
              return;
            }
            finalAudioEncoderConfig = audioSupportConfig;
          } else {
            console.warn(
              "Worker: AAC audio codec is not supported. Falling back to Opus."
            );
            audioCodec = "opus";
            const opusFallback = { ...baseAudioConfig, codec: "opus" };
            audioSupportConfig = await this.isConfigSupportedWithHwFallback(
              AudioEncoderCtor,
              opusFallback,
              "AudioEncoder"
            );
            if (audioSupportConfig) {
              if (audioSupportConfig.numberOfChannels !== this.currentConfig.channels) {
                this.postMessageToMainThread({
                  type: "error",
                  errorDetail: {
                    message: `AudioEncoder reported numberOfChannels (${audioSupportConfig.numberOfChannels}) does not match configured channels (${this.currentConfig.channels}).`,
                    type: "configuration-error" /* ConfigurationError */
                  }
                });
                this.cleanup();
                return;
              }
              finalAudioEncoderConfig = audioSupportConfig;
            } else {
              this.postMessageToMainThread({
                type: "error",
                errorDetail: {
                  message: "Worker: Opus audio codec is not supported after fallback.",
                  type: "not-supported" /* NotSupported */
                }
              });
              this.cleanup();
              return;
            }
          }
        } else {
          this.postMessageToMainThread({
            type: "error",
            errorDetail: {
              message: `Worker: Audio codec ${audioCodec} config not supported.`,
              type: "not-supported" /* NotSupported */
            }
          });
          this.cleanup();
          return;
        }
        try {
          this.audioEncoder = new AudioEncoderCtor({
            output: (chunk, meta) => {
              if (this.isCancelled || !this.muxer) return;
              this.muxer.addAudioChunk(chunk, meta);
            },
            error: (error) => {
              if (this.isCancelled) return;
              this.postMessageToMainThread({
                type: "error",
                errorDetail: {
                  message: `AudioEncoder error: ${error.message}`,
                  type: "audio-encoding-error" /* AudioEncodingError */,
                  stack: error.stack
                }
              });
              this.cleanup();
            }
          });
          if (this.audioEncoder) {
            this.audioEncoder.configure(finalAudioEncoderConfig);
          } else {
            this.postMessageToMainThread({
              type: "error",
              errorDetail: {
                message: "Worker: AudioEncoder instance is null after creation.",
                type: "initialization-failed" /* InitializationFailed */
              }
            });
            this.cleanup();
            return;
          }
        } catch (e) {
          this.postMessageToMainThread({
            type: "error",
            errorDetail: {
              message: `Worker: Failed to initialize AudioEncoder: ${e.message}`,
              type: "initialization-failed" /* InitializationFailed */,
              stack: e.stack
            }
          });
          this.cleanup();
          return;
        }
      }
      this.postMessageToMainThread({
        type: "initialized",
        actualVideoCodec: finalVideoEncoderConfig?.codec,
        actualAudioCodec: audioDisabled ? null : finalAudioEncoderConfig?.codec
      });
      logger_default.log("Worker: Initialized successfully");
    }
    async handleAddVideoFrame(data) {
      if (this.isCancelled || !this.videoEncoder || !this.currentConfig) return;
      try {
        const frame = data.frame;
        const interval = this.currentConfig.keyFrameInterval;
        const opts = interval && this.videoFrameCount % interval === 0 ? { keyFrame: true } : void 0;
        this.videoEncoder.encode(frame, opts);
        try {
          frame.close();
        } catch (closeErr) {
          logger_default.warn("Worker: Ignored error closing VideoFrame", closeErr);
        }
        this.videoFrameCount++;
        this.processedFrames++;
        const progressMessage = {
          type: "progress",
          processedFrames: this.processedFrames
        };
        if (typeof this.totalFramesToProcess !== "undefined") {
          progressMessage.totalFrames = this.totalFramesToProcess;
        }
        this.postMessageToMainThread(progressMessage);
        this.postQueueSize();
      } catch (error) {
        this.postMessageToMainThread({
          type: "error",
          errorDetail: {
            message: `Error encoding video frame: ${error.message}`,
            type: "video-encoding-error" /* VideoEncodingError */,
            stack: error.stack
          }
        });
        this.cleanup();
      }
    }
    async handleAddAudioData(data) {
      if (this.isCancelled || !this.audioEncoder || !this.currentConfig) return;
      if (data.audio) {
        try {
          this.audioEncoder.encode(data.audio);
          this.postQueueSize();
        } catch (error) {
          this.postMessageToMainThread({
            type: "error",
            errorDetail: {
              message: `Error encoding audio data: ${error.message}`,
              type: "audio-encoding-error" /* AudioEncodingError */,
              stack: error.stack
            }
          });
          this.cleanup();
        }
        return;
      }
      if (!data.audioData || data.audioData.length === 0) return;
      if (data.audioData.length !== this.currentConfig.channels) {
        this.postMessageToMainThread({
          type: "error",
          errorDetail: {
            message: `Audio data channel count (${data.audioData.length}) does not match configured channels (${this.currentConfig.channels}).`,
            type: "configuration-error" /* ConfigurationError */
          }
        });
        return;
      }
      const AudioDataCtor = getAudioData();
      if (!AudioDataCtor) {
        this.postMessageToMainThread({
          type: "error",
          errorDetail: {
            message: "Worker: AudioData not available",
            type: "not-supported" /* NotSupported */
          }
        });
        this.cleanup();
        return;
      }
      try {
        const interleaveFloat32Arrays = (planarArrays) => {
          if (!planarArrays || planarArrays.length === 0) {
            return new Float32Array(0);
          }
          const numChannels = planarArrays.length;
          const numFrames = planarArrays[0].length;
          const interleaved = new Float32Array(numFrames * numChannels);
          for (let i = 0; i < numFrames; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
              interleaved[i * numChannels + ch] = planarArrays[ch][i];
            }
          }
          return interleaved;
        };
        const interleavedData = interleaveFloat32Arrays(data.audioData);
        const audioData = new AudioDataCtor({
          format: "f32",
          sampleRate: data.sampleRate,
          numberOfFrames: data.numberOfFrames,
          numberOfChannels: data.numberOfChannels,
          timestamp: data.timestamp,
          data: interleavedData.buffer
        });
        try {
          this.audioEncoder.encode(audioData);
          this.postQueueSize();
        } finally {
          audioData.close();
        }
      } catch (error) {
        this.postMessageToMainThread({
          type: "error",
          errorDetail: {
            message: `Error encoding audio data: ${error.message}`,
            type: "audio-encoding-error" /* AudioEncodingError */,
            stack: error.stack
          }
        });
        this.cleanup();
      }
    }
    async handleFinalize(_message) {
      if (this.isCancelled) return;
      try {
        if (this.videoEncoder) await this.videoEncoder.flush();
        if (this.audioEncoder) await this.audioEncoder.flush();
        if (this.muxer) {
          const uint8ArrayOrNullOutput = this.muxer.finalize();
          if (uint8ArrayOrNullOutput) {
            this.postMessageToMainThread(
              { type: "finalized", output: uint8ArrayOrNullOutput },
              [uint8ArrayOrNullOutput.buffer]
            );
          } else if (this.currentConfig?.latencyMode === "realtime") {
            this.postMessageToMainThread({ type: "finalized", output: null });
          } else {
            this.postMessageToMainThread({
              type: "error",
              errorDetail: {
                message: "Muxer finalized without output in non-realtime mode.",
                type: "muxing-failed" /* MuxingFailed */
              }
            });
          }
        } else {
          this.postMessageToMainThread({
            type: "error",
            errorDetail: {
              message: "Muxer not initialized during finalize.",
              type: "muxing-failed" /* MuxingFailed */
            }
          });
        }
      } catch (error) {
        this.postMessageToMainThread({
          type: "error",
          errorDetail: {
            message: `Error during finalization: ${error.message}`,
            type: "muxing-failed" /* MuxingFailed */,
            stack: error.stack
          }
        });
      } finally {
        this.cleanup();
      }
    }
    handleCancel(_message) {
      if (this.isCancelled) return;
      this.isCancelled = true;
      logger_default.log("Worker: Received cancel signal.");
      this.postMessageToMainThread({ type: "cancelled" });
      this.videoEncoder?.close();
      this.audioEncoder?.close();
      this.cleanup(false);
    }
    cleanup(resetCancelled = true) {
      logger_default.log("Worker: Cleaning up resources.");
      if (this.videoEncoder && this.videoEncoder.state !== "closed")
        this.videoEncoder.close();
      if (this.audioEncoder && this.audioEncoder.state !== "closed")
        this.audioEncoder.close();
      this.videoEncoder = null;
      this.audioEncoder = null;
      this.muxer = null;
      this.currentConfig = null;
      this.totalFramesToProcess = void 0;
      this.processedFrames = 0;
      this.videoFrameCount = 0;
      if (this.audioWorkletPort) {
        this.audioWorkletPort.onmessage = null;
        this.audioWorkletPort.close();
        this.audioWorkletPort = null;
      }
      if (resetCancelled) {
        this.isCancelled = false;
      }
    }
    async handleMessage(eventData) {
      if (this.isCancelled && eventData.type !== "initialize" && eventData.type !== "cancel") {
        console.warn(
          `Worker: Ignoring message type '${eventData.type}' because worker is cancelled.`
        );
        return;
      }
      try {
        switch (eventData.type) {
          case "initialize":
            this.isCancelled = false;
            this.cleanup();
            await this.initializeEncoders(eventData);
            break;
          case "connectAudioPort":
            this.audioWorkletPort = eventData.port;
            this.audioWorkletPort.onmessage = async (e) => {
              if (this.isCancelled) return;
              await this.handleAddAudioData(e.data);
            };
            break;
          case "addVideoFrame":
            await this.handleAddVideoFrame(eventData);
            break;
          case "addAudioData":
            await this.handleAddAudioData(eventData);
            break;
          case "finalize":
            await this.handleFinalize(eventData);
            break;
          case "cancel":
            this.handleCancel(eventData);
            break;
          default:
            console.warn(
              "Worker received unknown message type:",
              eventData.type
            );
        }
      } catch (error) {
        this.postMessageToMainThread({
          type: "error",
          errorDetail: {
            message: `Unhandled error in worker onmessage: ${error.message}`,
            type: "internal-error" /* InternalError */,
            stack: error.stack
          }
        });
        this.cleanup();
      }
    }
  };
  var encoder = new EncoderWorker();
  self.onmessage = async (event) => {
    await encoder.handleMessage(event.data);
  };
})();
//# sourceMappingURL=worker.js.map