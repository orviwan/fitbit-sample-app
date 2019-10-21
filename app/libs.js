export var ably;
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var customInspectSymbol =
  (typeof Symbol === 'function' && typeof Symbol.for === 'function')
    ? Symbol.for('nodejs.util.inspect.custom')
    : null

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    var proto = { foo: function () { return 42 } }
    Object.setPrototypeOf(proto, Uint8Array.prototype)
    Object.setPrototypeOf(arr, proto)
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  Object.setPrototypeOf(buf, Buffer.prototype)
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw new TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
Object.setPrototypeOf(Buffer, Uint8Array)

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(buf, Buffer.prototype)

  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]]
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(newBuf, Buffer.prototype)

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  } else if (typeof val === 'boolean') {
    val = Number(val)
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
var hexSliceLookupTable = (function () {
  var alphabet = '0123456789abcdef'
  var table = new Array(256)
  for (var i = 0; i < 16; ++i) {
    var i16 = i * 16
    for (var j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j]
    }
  }
  return table
})()

}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
// var ably = require('../companion/ably');
ably = require('../companion/ably');
},{"../companion/ably":5}],5:[function(require,module,exports){
(function (Buffer){
'use strict';
/*
 Copyright 2019, Ably

 Ably JavaScript Library v1.1.20
 https://github.com/ably/ably-js

 Ably Realtime Messaging
 https://www.ably.io

 Released under the Apache Licence v2.0
*/
(function(){function la(b){if("string"!==typeof b)throw new q("host must be a string; was a "+typeof b,4E4,400);if(!b.length)throw new q("host must not be zero-length",4E4,400);}var u="object"===typeof window&&window||"object"===typeof self&&self,Z=u.Ably=this,C=C||function(b,d){var f={},a=f.lib={},c=a.Base=function(){function a(){}return{extend:function(g){a.prototype=this;var c=new a;g&&c.mixIn(g);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=
c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var g in a)a.hasOwnProperty(g)&&(this[g]=a[g]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}}}(),n=a.WordArray=c.extend({init:function(a,g){a=this.words=a||[];this.sigBytes=g!=d?g:4*a.length},toString:function(a){return(a||m).stringify(this)},concat:function(a){var g=this.words,c=a.words,e=
this.sigBytes;a=a.sigBytes;this.clamp();if(e%4)for(var k=0;k<a;k++)g[e+k>>>2]|=(c[k>>>2]>>>24-k%4*8&255)<<24-(e+k)%4*8;else if(65535<c.length)for(k=0;k<a;k+=4)g[e+k>>>2]=c[k>>>2];else g.push.apply(g,c);this.sigBytes+=a;return this},clamp:function(){var a=this.words,g=this.sigBytes;a[g>>>2]&=4294967295<<32-g%4*8;a.length=b.ceil(g/4)},clone:function(){var a=c.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){function g(a){var g=987654321;return function(){g=36969*(g&65535)+(g>>
16)&4294967295;a=18E3*(a&65535)+(a>>16)&4294967295;return(((g<<16)+a&4294967295)/4294967296+.5)*(.5<b.random()?1:-1)}}for(var c=[],e=0,k;e<a;e+=4){var p=g(4294967296*(k||b.random()));k=987654071*p();c.push(4294967296*p()|0)}return new n.init(c,a)}}),e=f.enc={},m=e.Hex={stringify:function(a){var g=a.words;a=a.sigBytes;for(var c=[],e=0;e<a;e++){var k=g[e>>>2]>>>24-e%4*8&255;c.push((k>>>4).toString(16));c.push((k&15).toString(16))}return c.join("")},parse:function(a){for(var g=a.length,c=[],e=0;e<g;e+=
2)c[e>>>3]|=parseInt(a.substr(e,2),16)<<24-e%8*4;return new n.init(c,g/2)}},r=e.Latin1={stringify:function(a){var g=a.words;a=a.sigBytes;for(var c=[],e=0;e<a;e++)c.push(String.fromCharCode(g[e>>>2]>>>24-e%4*8&255));return c.join("")},parse:function(a){for(var g=a.length,c=[],e=0;e<g;e++)c[e>>>2]|=(a.charCodeAt(e)&255)<<24-e%4*8;return new n.init(c,g)}},k=e.Utf8={stringify:function(a){try{return decodeURIComponent(escape(r.stringify(a)))}catch(v){throw Error("Malformed UTF-8 data");}},parse:function(a){return r.parse(unescape(encodeURIComponent(a)))}},
g=a.BufferedBlockAlgorithm=c.extend({reset:function(){this._data=new n.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=k.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var g=this._data,c=g.words,e=g.sigBytes,k=this.blockSize,p=e/(4*k);p=a?b.ceil(p):b.max((p|0)-this._minBufferSize,0);a=p*k;e=b.min(4*a,e);if(a){for(var f=0;f<a;f+=k)this._doProcessBlock(c,f);f=c.splice(0,a);g.sigBytes-=e}return new n.init(f,e)},clone:function(){var a=c.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});a.Hasher=g.extend({cfg:c.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){g.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(g,c){return(new a.init(c)).finalize(g)}},_createHmacHelper:function(a){return function(g,c){return(new p.HMAC.init(a,
c)).finalize(g)}}});var p=f.algo={};return f}(Math);(function(b){var d=C,f=d.lib,a=f.WordArray,c=f.Hasher;f=d.algo;var n=[],e=[];(function(){function a(a){for(var g=b.sqrt(a),c=2;c<=g;c++)if(!(a%c))return!1;return!0}function c(a){return 4294967296*(a-(a|0))|0}for(var g=2,p=0;64>p;)a(g)&&(8>p&&(n[p]=c(b.pow(g,.5))),e[p]=c(b.pow(g,1/3)),p++),g++})();var m=[];f=f.SHA256=c.extend({_doReset:function(){this._hash=new a.init(n.slice(0))},_doProcessBlock:function(a,c){for(var g=this._hash.words,k=g[0],f=
g[1],b=g[2],d=g[3],n=g[4],r=g[5],l=g[6],h=g[7],J=0;64>J;J++){if(16>J)m[J]=a[c+J]|0;else{var E=m[J-15],q=m[J-2];m[J]=((E<<25|E>>>7)^(E<<14|E>>>18)^E>>>3)+m[J-7]+((q<<15|q>>>17)^(q<<13|q>>>19)^q>>>10)+m[J-16]}E=h+((n<<26|n>>>6)^(n<<21|n>>>11)^(n<<7|n>>>25))+(n&r^~n&l)+e[J]+m[J];q=((k<<30|k>>>2)^(k<<19|k>>>13)^(k<<10|k>>>22))+(k&f^k&b^f&b);h=l;l=r;r=n;n=d+E|0;d=b;b=f;f=k;k=E+q|0}g[0]=g[0]+k|0;g[1]=g[1]+f|0;g[2]=g[2]+b|0;g[3]=g[3]+d|0;g[4]=g[4]+n|0;g[5]=g[5]+r|0;g[6]=g[6]+l|0;g[7]=g[7]+h|0},_doFinalize:function(){var a=
this._data,c=a.words,g=8*this._nDataBytes,e=8*a.sigBytes;c[e>>>5]|=128<<24-e%32;c[(e+64>>>9<<4)+14]=b.floor(g/4294967296);c[(e+64>>>9<<4)+15]=g;a.sigBytes=4*c.length;this._process();return this._hash},clone:function(){var a=c.clone.call(this);a._hash=this._hash.clone();return a}});d.SHA256=c._createHelper(f);d.HmacSHA256=c._createHmacHelper(f)})(Math);(function(){var b=C,d=b.enc.Utf8;b.algo.HMAC=b.lib.Base.extend({init:function(f,a){f=this._hasher=new f.init;"string"==typeof a&&(a=d.parse(a));var c=
f.blockSize,b=4*c;a.sigBytes>b&&(a=f.finalize(a));a.clamp();for(var e=this._oKey=a.clone(),m=this._iKey=a.clone(),r=e.words,k=m.words,g=0;g<c;g++)r[g]^=1549556828,k[g]^=909522486;e.sigBytes=m.sigBytes=b;this.reset()},reset:function(){var f=this._hasher;f.reset();f.update(this._iKey)},update:function(f){this._hasher.update(f);return this},finalize:function(f){var a=this._hasher;f=a.finalize(f);a.reset();return a.finalize(this._oKey.clone().concat(f))}})})();(function(){var b=C,d=b.lib.WordArray;b.enc.Base64=
{stringify:function(f){var a=f.words,c=f.sigBytes,b=this._map;f.clamp();f=[];for(var e=0;e<c;e+=3)for(var m=(a[e>>>2]>>>24-e%4*8&255)<<16|(a[e+1>>>2]>>>24-(e+1)%4*8&255)<<8|a[e+2>>>2]>>>24-(e+2)%4*8&255,d=0;4>d&&e+.75*d<c;d++)f.push(b.charAt(m>>>6*(3-d)&63));if(a=b.charAt(64))for(;f.length%4;)f.push(a);return f.join("")},parse:function(f){var a=f.length,c=this._map,b=c.charAt(64);b&&(b=f.indexOf(b),-1!=b&&(a=b));b=[];for(var e=0,m=0;m<a;m++)if(m%4){var r=c.indexOf(f.charAt(m-1))<<m%4*2,k=c.indexOf(f.charAt(m))>>>
6-m%4*2;b[e>>>2]|=(r|k)<<24-e%4*8;e++}return d.create(b,e)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}})();C.lib.Cipher||function(b){var d=C,f=d.lib,a=f.Base,c=f.WordArray,n=f.BufferedBlockAlgorithm,e=d.enc.Base64,m=d.algo.EvpKDF,r=f.Cipher=n.extend({cfg:a.extend(),createEncryptor:function(a,g){return this.create(this._ENC_XFORM_MODE,a,g)},createDecryptor:function(a,g){return this.create(this._DEC_XFORM_MODE,a,g)},init:function(a,g,c){this.cfg=this.cfg.extend(c);this._xformMode=
a;this._key=g;this.reset()},reset:function(){n.reset.call(this);this._doReset()},process:function(a){this._append(a);return this._process()},finalize:function(a){a&&this._append(a);return this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(){return function(a){return{encrypt:function(g,c,e){return("string"==typeof c?h:v).encrypt(a,g,c,e)},decrypt:function(g,c,e){return("string"==typeof c?h:v).decrypt(a,g,c,e)}}}}()});f.StreamCipher=r.extend({_doFinalize:function(){return this._process(!0)},
blockSize:1});var k=d.mode={},g=f.BlockCipherMode=a.extend({createEncryptor:function(a,g){return this.Encryptor.create(a,g)},createDecryptor:function(a,g){return this.Decryptor.create(a,g)},init:function(a,g){this._cipher=a;this._iv=g}});k=k.CBC=function(){function a(a,g,c){var e=this._iv;e?this._iv=b:e=this._prevBlock;for(var k=0;k<c;k++)a[g+k]^=e[k]}var c=g.extend();c.Encryptor=c.extend({processBlock:function(g,c){var e=this._cipher,k=e.blockSize;a.call(this,g,c,k);e.encryptBlock(g,c);this._prevBlock=
g.slice(c,c+k)}});c.Decryptor=c.extend({processBlock:function(g,c){var e=this._cipher,k=e.blockSize,p=g.slice(c,c+k);e.decryptBlock(g,c);a.call(this,g,c,k);this._prevBlock=p}});return c}();var p=(d.pad={}).Pkcs7={pad:function(a,g){var e=4*g;e-=a.sigBytes%e;for(var k=e<<24|e<<16|e<<8|e,p=[],f=0;f<e;f+=4)p.push(k);e=c.create(p,e);a.concat(e)},unpad:function(a){a.sigBytes-=a.words[a.sigBytes-1>>>2]&255}};f.BlockCipher=r.extend({cfg:r.cfg.extend({mode:k,padding:p}),reset:function(){r.reset.call(this);
var a=this.cfg,g=a.iv;a=a.mode;if(this._xformMode==this._ENC_XFORM_MODE)var c=a.createEncryptor;else c=a.createDecryptor,this._minBufferSize=1;this._mode=c.call(a,this,g&&g.words)},_doProcessBlock:function(a,g){this._mode.processBlock(a,g)},_doFinalize:function(){var a=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){a.pad(this._data,this.blockSize);var g=this._process(!0)}else g=this._process(!0),a.unpad(g);return g},blockSize:4});var x=f.CipherParams=a.extend({init:function(a){this.mixIn(a)},
toString:function(a){return(a||this.formatter).stringify(this)}});k=(d.format={}).OpenSSL={stringify:function(a){var g=a.ciphertext;a=a.salt;return(a?c.create([1398893684,1701076831]).concat(a).concat(g):g).toString(e)},parse:function(a){a=e.parse(a);var g=a.words;if(1398893684==g[0]&&1701076831==g[1]){var k=c.create(g.slice(2,4));g.splice(0,4);a.sigBytes-=16}return x.create({ciphertext:a,salt:k})}};var v=f.SerializableCipher=a.extend({cfg:a.extend({format:k}),encrypt:function(a,g,c,e){e=this.cfg.extend(e);
var k=a.createEncryptor(c,e);g=k.finalize(g);k=k.cfg;return x.create({ciphertext:g,key:c,iv:k.iv,algorithm:a,mode:k.mode,padding:k.padding,blockSize:a.blockSize,formatter:e.format})},decrypt:function(a,g,c,e){e=this.cfg.extend(e);g=this._parse(g,e.format);return a.createDecryptor(c,e).finalize(g.ciphertext)},_parse:function(a,g){return"string"==typeof a?g.parse(a,this):a}});d=(d.kdf={}).OpenSSL={execute:function(a,g,e,k){k||(k=c.random(8));a=m.create({keySize:g+e}).compute(a,k);e=c.create(a.words.slice(g),
4*e);a.sigBytes=4*g;return x.create({key:a,iv:e,salt:k})}};var h=f.PasswordBasedCipher=v.extend({cfg:v.cfg.extend({kdf:d}),encrypt:function(a,g,c,e){e=this.cfg.extend(e);c=e.kdf.execute(c,a.keySize,a.ivSize);e.iv=c.iv;a=v.encrypt.call(this,a,g,c.key,e);a.mixIn(c);return a},decrypt:function(a,g,c,e){e=this.cfg.extend(e);g=this._parse(g,e.format);c=e.kdf.execute(c,a.keySize,a.ivSize,g.salt);e.iv=c.iv;return v.decrypt.call(this,a,g,c.key,e)}})}();(function(){var b=C,d=b.lib.BlockCipher,f=b.algo,a=[],
c=[],n=[],e=[],m=[],r=[],k=[],g=[],p=[],x=[];(function(){for(var f=[],b=0;256>b;b++)f[b]=128>b?b<<1:b<<1^283;var d=0,v=0;for(b=0;256>b;b++){var l=v^v<<1^v<<2^v<<3^v<<4;l=l>>>8^l&255^99;a[d]=l;c[l]=d;var h=f[d],q=f[h],t=f[q],H=257*f[l]^16843008*l;n[d]=H<<24|H>>>8;e[d]=H<<16|H>>>16;m[d]=H<<8|H>>>24;r[d]=H;H=16843009*t^65537*q^257*h^16843008*d;k[l]=H<<24|H>>>8;g[l]=H<<16|H>>>16;p[l]=H<<8|H>>>24;x[l]=H;d?(d=h^f[f[f[t^h]]],v^=f[f[v]]):d=v=1}})();var v=[0,1,2,4,8,16,32,64,128,27,54];f=f.AES=d.extend({_doReset:function(){var c=
this._key,e=c.words,f=c.sigBytes/4;c=4*((this._nRounds=f+6)+1);for(var b=this._keySchedule=[],d=0;d<c;d++)if(d<f)b[d]=e[d];else{var m=b[d-1];d%f?6<f&&4==d%f&&(m=a[m>>>24]<<24|a[m>>>16&255]<<16|a[m>>>8&255]<<8|a[m&255]):(m=m<<8|m>>>24,m=a[m>>>24]<<24|a[m>>>16&255]<<16|a[m>>>8&255]<<8|a[m&255],m^=v[d/f|0]<<24);b[d]=b[d-f]^m}e=this._invKeySchedule=[];for(f=0;f<c;f++)d=c-f,m=f%4?b[d]:b[d-4],e[f]=4>f||4>=d?m:k[a[m>>>24]]^g[a[m>>>16&255]]^p[a[m>>>8&255]]^x[a[m&255]]},encryptBlock:function(g,c){this._doCryptBlock(g,
c,this._keySchedule,n,e,m,r,a)},decryptBlock:function(a,e){var f=a[e+1];a[e+1]=a[e+3];a[e+3]=f;this._doCryptBlock(a,e,this._invKeySchedule,k,g,p,x,c);f=a[e+1];a[e+1]=a[e+3];a[e+3]=f},_doCryptBlock:function(a,g,c,e,k,f,p,b){for(var d=this._nRounds,m=a[g]^c[0],n=a[g+1]^c[1],r=a[g+2]^c[2],v=a[g+3]^c[3],l=4,x=1;x<d;x++){var h=e[m>>>24]^k[n>>>16&255]^f[r>>>8&255]^p[v&255]^c[l++],aa=e[n>>>24]^k[r>>>16&255]^f[v>>>8&255]^p[m&255]^c[l++],S=e[r>>>24]^k[v>>>16&255]^f[m>>>8&255]^p[n&255]^c[l++];v=e[v>>>24]^k[m>>>
16&255]^f[n>>>8&255]^p[r&255]^c[l++];m=h;n=aa;r=S}h=(b[m>>>24]<<24|b[n>>>16&255]<<16|b[r>>>8&255]<<8|b[v&255])^c[l++];aa=(b[n>>>24]<<24|b[r>>>16&255]<<16|b[v>>>8&255]<<8|b[m&255])^c[l++];S=(b[r>>>24]<<24|b[v>>>16&255]<<16|b[m>>>8&255]<<8|b[n&255])^c[l++];v=(b[v>>>24]<<24|b[m>>>16&255]<<16|b[n>>>8&255]<<8|b[r&255])^c[l++];a[g]=h;a[g+1]=aa;a[g+2]=S;a[g+3]=v},keySize:8});b.AES=d._createHelper(f)})();(function(){if("undefined"!==typeof ArrayBuffer){var b=C.lib.WordArray,d=b.init;(b.init=function(f){if(f instanceof
ArrayBuffer)f=new Uint8Array(f);else if(f instanceof Int8Array||"undefined"!==typeof Uint8ClampedArray&&f instanceof Uint8ClampedArray||f instanceof Int16Array||f instanceof Uint16Array||f instanceof Int32Array||f instanceof Uint32Array||"undefined"!==typeof Float32Array&&f instanceof Float32Array||"undefined"!==typeof Float64Array&&f instanceof Float64Array)f=new Uint8Array(f.buffer,f.byteOffset,f.byteLength);if(f instanceof Uint8Array){for(var a=f.byteLength,c=[],b=0;b<a;b++)c[b>>>2]|=f[b]<<24-
b%4*8;d.call(this,c,a)}else d.apply(this,arguments)}).prototype=b}})();var fa=function(){function b(){}b.addListener=function(b,f,a){b.addEventListener?b.addEventListener(f,a,!1):b.attachEvent("on"+f,function(){a.apply(b,arguments)})};b.removeListener=function(b,f,a){b.removeEventListener?b.removeEventListener(f,a,!1):b.detachEvent("on"+f,function(){a.apply(b,arguments)})};b.addMessageListener=function(d,f){b.addListener(d,"message",f)};b.removeMessageListener=function(d,f){b.removeListener(d,"message",
f)};b.addUnloadListener=function(d){b.addListener(u,"unload",d)};return b}(),ha=function(){function b(a,g,c){for(var e=0,k=c.length;e<k;e++){var b=c.charCodeAt(e);if(128>b)a.setUint8(g++,b>>>0&127|0);else if(2048>b)a.setUint8(g++,b>>>6&31|192),a.setUint8(g++,b>>>0&63|128);else if(65536>b)a.setUint8(g++,b>>>12&15|224),a.setUint8(g++,b>>>6&63|128),a.setUint8(g++,b>>>0&63|128);else if(1114112>b)a.setUint8(g++,b>>>18&7|240),a.setUint8(g++,b>>>12&63|128),a.setUint8(g++,b>>>6&63|128),a.setUint8(g++,b>>>
0&63|128);else throw Error("bad codepoint "+b);}}function d(a,g,c){var e="",k=g;for(g+=c;k<g;k++)if(c=a.getUint8(k),0===(c&128))e+=String.fromCharCode(c);else if(192===(c&224))e+=String.fromCharCode((c&15)<<6|a.getUint8(++k)&63);else if(224===(c&240))e+=String.fromCharCode((c&15)<<12|(a.getUint8(++k)&63)<<6|(a.getUint8(++k)&63)<<0);else if(240===(c&248))e+=String.fromCharCode((c&7)<<18|(a.getUint8(++k)&63)<<12|(a.getUint8(++k)&63)<<6|(a.getUint8(++k)&63)<<0);else throw Error("Invalid byte "+c.toString(16));
return e}function f(a){for(var g=0,c=0,e=a.length;c<e;c++){var k=a.charCodeAt(c);if(128>k)g+=1;else if(2048>k)g+=2;else if(65536>k)g+=3;else if(1114112>k)g+=4;else throw Error("bad codepoint "+k);}return g}function a(a,g){this.offset=g||0;this.view=a}function c(a,g){return h.keysArray(a,!0).filter(function(c){c=a[c];return(!g||void 0!==c&&null!==c)&&("function"!==typeof c||!!c.toJSON)})}function n(a,g,e,d){var k=typeof a;if("string"===k){var m=f(a);if(32>m)return g.setUint8(e,m|160),b(g,e+1,a),1+
m;if(256>m)return g.setUint8(e,217),g.setUint8(e+1,m),b(g,e+2,a),2+m;if(65536>m)return g.setUint8(e,218),g.setUint16(e+1,m),b(g,e+3,a),3+m;if(4294967296>m)return g.setUint8(e,219),g.setUint32(e+1,m),b(g,e+5,a),5+m}if(a instanceof ArrayBuffer){m=a.byteLength;if(256>m)return g.setUint8(e,196),g.setUint8(e+1,m),(new Uint8Array(g.buffer)).set(new Uint8Array(a),e+2),2+m;if(65536>m)return g.setUint8(e,197),g.setUint16(e+1,m),(new Uint8Array(g.buffer)).set(new Uint8Array(a),e+3),3+m;if(4294967296>m)return g.setUint8(e,
198),g.setUint32(e+1,m),(new Uint8Array(g.buffer)).set(new Uint8Array(a),e+5),5+m}if("number"===k){if(Math.floor(a)!==a)return g.setUint8(e,203),g.setFloat64(e+1,a),9;if(0<=a){if(128>a)return g.setUint8(e,a),1;if(256>a)return g.setUint8(e,204),g.setUint8(e+1,a),2;if(65536>a)return g.setUint8(e,205),g.setUint16(e+1,a),3;if(4294967296>a)return g.setUint8(e,206),g.setUint32(e+1,a),5;if(1.8446744073709552E19>a)return g.setUint8(e,207),e+=1,1.8446744073709552E19>a?(g.setUint32(e,Math.floor(a*r)),g.setInt32(e+
4,a&-1)):(g.setUint32(e,4294967295),g.setUint32(e+4,4294967295)),9;throw Error("Number too big 0x"+a.toString(16));}if(-32<=a)return g.setInt8(e,a),1;if(-128<=a)return g.setUint8(e,208),g.setInt8(e+1,a),2;if(-32768<=a)return g.setUint8(e,209),g.setInt16(e+1,a),3;if(-2147483648<=a)return g.setUint8(e,210),g.setInt32(e+1,a),5;if(-9223372036854775808<=a)return g.setUint8(e,211),e+=1,0x7fffffffffffffff>a?(g.setInt32(e,Math.floor(a*r)),g.setInt32(e+4,a&-1)):(g.setUint32(e,2147483647),g.setUint32(e+4,2147483647)),
9;throw Error("Number too small -0x"+(-a).toString(16).substr(1));}if("undefined"===k){if(d)return 0;g.setUint8(e,212);g.setUint8(e+1,0);g.setUint8(e+2,0);return 3}if(null===a){if(d)return 0;g.setUint8(e,192);return 1}if("boolean"===k)return g.setUint8(e,a?195:194),1;if("function"===typeof a.toJSON)return n(a.toJSON(),g,e,d);if("object"===k){k=0;var p=Array.isArray(a);if(p)m=a.length;else{var l=c(a,d);m=l.length}16>m?(g.setUint8(e,m|(p?144:128)),k=1):65536>m?(g.setUint8(e,p?220:222),g.setUint16(e+
1,m),k=3):4294967296>m&&(g.setUint8(e,p?221:223),g.setUint32(e+1,m),k=5);if(p)for(p=0;p<m;p++)k+=n(a[p],g,e+k,d);else for(p=0;p<m;p++){var x=l[p];k+=n(x,g,e+k);k+=n(a[x],g,e+k,d)}return k}if("function"===k)return 0;throw Error("Unknown type "+k);}function e(a,g){var k=typeof a;if("string"===k){var b=f(a);if(32>b)return 1+b;if(256>b)return 2+b;if(65536>b)return 3+b;if(4294967296>b)return 5+b}if(a instanceof ArrayBuffer){b=a.byteLength;if(256>b)return 2+b;if(65536>b)return 3+b;if(4294967296>b)return 5+
b}if("number"===k){if(Math.floor(a)!==a)return 9;if(0<=a){if(128>a)return 1;if(256>a)return 2;if(65536>a)return 3;if(4294967296>a)return 5;if(1.8446744073709552E19>a)return 9;throw Error("Number too big 0x"+a.toString(16));}if(-32<=a)return 1;if(-128<=a)return 2;if(-32768<=a)return 3;if(-2147483648<=a)return 5;if(-9223372036854775808<=a)return 9;throw Error("Number too small -0x"+a.toString(16).substr(1));}if("boolean"===k)return 1;if(null===a)return g?0:1;if(void 0===a)return g?0:3;if("function"===
typeof a.toJSON)return e(a.toJSON(),g);if("object"===k){k=0;if(Array.isArray(a)){b=a.length;for(var m=0;m<b;m++)k+=e(a[m],g)}else{var d=c(a,g);b=d.length;for(m=0;m<b;m++){var n=d[m];k+=e(n)+e(a[n],g)}}if(16>b)return 1+k;if(65536>b)return 3+k;if(4294967296>b)return 5+k;throw Error("Array or object too long 0x"+b.toString(16));}if("function"===k)return 0;throw Error("Unknown type "+k);}var m={inspect:function(a){if(void 0===a)return"undefined";if(a instanceof ArrayBuffer){var g="ArrayBuffer";var e=
new DataView(a)}else a instanceof DataView&&(g="DataView",e=a);if(!e)return JSON.stringify(a);for(var c=[],k=0;k<a.byteLength;k++){if(20<k){c.push("...");break}var b=e.getUint8(k).toString(16);1===b.length&&(b="0"+b);c.push(b)}return"<"+g+" "+c.join(" ")+">"}};m.utf8Write=b;m.utf8Read=d;m.utf8ByteCount=f;m.encode=function(a,g){var c=e(a,g);if(0!=c){c=new ArrayBuffer(c);var k=new DataView(c);n(a,k,0,g);return c}};m.decode=function(e){var g=new DataView(e);g=new a(g);var c=g.parse();if(g.offset!==e.byteLength)throw Error(e.byteLength-
g.offset+" trailing bytes");return c};var r=1/4294967296;a.prototype.map=function(a){for(var g={},e=0;e<a;e++){var c=this.parse();g[c]=this.parse()}return g};a.prototype.bin=a.prototype.buf=function(a){var g=new ArrayBuffer(a);(new Uint8Array(g)).set(new Uint8Array(this.view.buffer,this.offset,a),0);this.offset+=a;return g};a.prototype.str=function(a){var g=d(this.view,this.offset,a);this.offset+=a;return g};a.prototype.array=function(a){for(var g=Array(a),e=0;e<a;e++)g[e]=this.parse();return g};
a.prototype.ext=function(a){var g={};g.type=this.view.getInt8(this.offset);this.offset++;g.data=this.buf(a);this.offset+=a;return g};a.prototype.parse=function(){var a=this.view.getUint8(this.offset);if(0===(a&128))return this.offset++,a;if(128===(a&240))return this.offset++,this.map(a&15);if(144===(a&240))return this.offset++,this.array(a&15);if(160===(a&224))return this.offset++,this.str(a&31);if(224===(a&224))return a=this.view.getInt8(this.offset),this.offset++,a;switch(a){case 192:return this.offset++,
null;case 193:this.offset++;return;case 194:return this.offset++,!1;case 195:return this.offset++,!0;case 196:return a=this.view.getUint8(this.offset+1),this.offset+=2,this.bin(a);case 197:return a=this.view.getUint16(this.offset+1),this.offset+=3,this.bin(a);case 198:return a=this.view.getUint32(this.offset+1),this.offset+=5,this.bin(a);case 199:return a=this.view.getUint8(this.offset+1),this.offset+=2,this.ext(a);case 200:return a=this.view.getUint16(this.offset+1),this.offset+=3,this.ext(a);case 201:return a=
this.view.getUint32(this.offset+1),this.offset+=5,this.ext(a);case 202:return a=this.view.getFloat32(this.offset+1),this.offset+=5,a;case 203:return a=this.view.getFloat64(this.offset+1),this.offset+=9,a;case 204:return a=this.view.getUint8(this.offset+1),this.offset+=2,a;case 205:return a=this.view.getUint16(this.offset+1),this.offset+=3,a;case 206:return a=this.view.getUint32(this.offset+1),this.offset+=5,a;case 207:a=this.view;var g=this.offset+1;g=g||0;a=4294967296*a.getUint32(g)+a.getUint32(g+
4);this.offset+=9;return a;case 208:return a=this.view.getInt8(this.offset+1),this.offset+=2,a;case 209:return a=this.view.getInt16(this.offset+1),this.offset+=3,a;case 210:return a=this.view.getInt32(this.offset+1),this.offset+=5,a;case 211:return a=this.view,g=(g=this.offset+1)||0,a=4294967296*a.getInt32(g)+a.getUint32(g+4),this.offset+=9,a;case 212:return this.offset++,this.ext(1);case 213:return this.offset++,this.ext(2);case 214:return this.offset++,this.ext(4);case 215:return this.offset++,
this.ext(8);case 216:return this.offset++,this.ext(16);case 217:return a=this.view.getUint8(this.offset+1),this.offset+=2,this.str(a);case 218:return a=this.view.getUint16(this.offset+1),this.offset+=3,this.str(a);case 219:return a=this.view.getUint32(this.offset+1),this.offset+=5,this.str(a);case 220:return a=this.view.getUint16(this.offset+1),this.offset+=3,this.array(a);case 221:return a=this.view.getUint32(this.offset+1),this.offset+=5,this.array(a);case 222:return a=this.view.getUint16(this.offset+
1),this.offset+=3,this.map(a);case 223:return a=this.view.getUint32(this.offset+1),this.offset+=5,this.map(a)}throw Error("Unknown type 0x"+a.toString(16));};return m}();"undefined"===typeof Window&&"undefined"===typeof WorkerGlobalScope&&console.log("Warning: this distribution of Ably is intended for browsers. On nodejs, please use the 'ably' package on npm");var w={libver:"js-web-",logTimestamps:!0,noUpgrade:navigator&&navigator.userAgent.toString().match(/MSIE\s8\.0/),binaryType:"arraybuffer",
WebSocket:u.WebSocket||u.MozWebSocket,xhrSupported:u.XMLHttpRequest&&"withCredentials"in new XMLHttpRequest,jsonpSupported:"undefined"!==typeof document,allowComet:function(){var b=u.location;return!u.WebSocket||!b||!b.origin||-1<b.origin.indexOf("http")}(),streamingSupported:!0,useProtocolHeartbeats:!0,createHmac:null,msgpack:ha,supportsBinary:!!u.TextDecoder,preferBinary:!1,ArrayBuffer:u.ArrayBuffer,atob:u.atob,nextTick:function(b){setTimeout(b,0)},addEventListener:u.addEventListener,inspect:JSON.stringify,
stringByteSize:function(b){return u.TextDecoder&&(new u.TextEncoder).encode(b).length||b.length},Promise:u.Promise,getRandomValues:function(b){if(void 0!==b)return function(d,f){b.getRandomValues(d);f&&f(null)}}(u.crypto||u.msCrypto)},T=function(){function b(){}function l(){this.key=this.mode=this.keyLength=this.algorithm=null}function f(a,e,c){this.algorithm=a.algorithm+"-"+String(a.keyLength)+"-"+a.mode;this.cjsAlgorithm=a.algorithm.toUpperCase().replace(/-\d+$/,"");this.key=z.toWordArray(a.key);
c&&(this.iv=z.toWordArray(c).clone());this.blockLengthWords=e}var a=C.lib.WordArray;if(w.getRandomWordArray)var c=w.getRandomWordArray;else if("undefined"!==typeof Uint32Array&&w.getRandomValues){var n=new Uint32Array(4);c=function(a,e){var c=a/4,g=4==c?n:new Uint32Array(c);w.getRandomValues(g,function(a){e(a,z.toWordArray(g))})}}else c=function(e,c){d.logAction(d.LOG_MAJOR,"Ably.Crypto.generateRandom()","Warning: the browser you are using does not support secure cryptographically secure randomness generation; falling back to insecure Math.random()");
for(var b=e/4,g=Array(b),f=0;f<b;f++)g[f]=Math.floor(4294967296*Math.random())-2147483648;c(null,a.create(g))};a.create([0,0,0,0]);var e=[a.create([269488144,269488144,269488144,269488144],16),a.create([16777216],1),a.create([33685504],2),a.create([50529024],3),a.create([67372036],4),a.create([84215045,83886080],5),a.create([101058054,101056512],6),a.create([117901063,117901056],7),a.create([134744072,134744072],8),a.create([151587081,151587081,150994944],9),a.create([168430090,168430090,168427520],
10),a.create([185273099,185273099,185273088],11),a.create([202116108,202116108,202116108],12),a.create([218959117,218959117,218959117,218103808],13),a.create([235802126,235802126,235802126,235798528],14),a.create([252645135,252645135,252645135,252645135],15),a.create([269488144,269488144,269488144,269488144],16)];b.CipherParams=l;b.getDefaultParams=function(a){if("function"===typeof a||"string"===typeof a)if(d.deprecated("Crypto.getDefaultParams(key, callback)","Crypto.getDefaultParams({key: key})"),
"function"===typeof a)b.generateRandomKey(function(g){a(null,b.getDefaultParams({key:g}))});else if("function"===typeof arguments[1])arguments[1](null,b.getDefaultParams({key:a}));else throw Error("Invalid arguments for Crypto.getDefaultParams");else{if(!a.key)throw Error("Crypto.getDefaultParams: a key is required");var e="string"===typeof a.key?C.enc.Base64.parse(a.key.replace("_","/").replace("-","+")):z.toWordArray(a.key);var c=new l;c.key=e;c.algorithm=a.algorithm||"aes";c.keyLength=32*e.words.length;
c.mode=a.mode||"cbc";if(a.keyLength&&a.keyLength!==c.keyLength)throw Error("Crypto.getDefaultParams: a keyLength of "+a.keyLength+" was specified, but the key actually has length "+c.keyLength);if("aes"===c.algorithm&&"cbc"===c.mode&&128!==c.keyLength&&256!==c.keyLength)throw Error("Unsupported key length "+c.keyLength+" for aes-cbc encryption. Encryption key must be 128 or 256 bits (16 or 32 ASCII characters)");return c}};b.generateRandomKey=function(a,e){1==arguments.length&&"function"==typeof a&&
(e=a,a=void 0);c((a||256)/8,e)};b.getCipher=function(a){var e=a instanceof l?a:b.getDefaultParams(a);return{cipherParams:e,cipher:new f(e,4,a.iv)}};f.prototype.encrypt=function(a,b){function f(){n.getIv(function(c,f){if(c)b(c);else{var d=n.encryptCipher.process(a.concat(e[m-g]));d=f.concat(d);b(null,d)}})}d.logAction(d.LOG_MICRO,"CBCCipher.encrypt()","");a=z.toWordArray(a);var g=a.sigBytes,m=g+16&-16,n=this;this.encryptCipher?f():this.iv?(this.encryptCipher=C.algo[this.cjsAlgorithm].createEncryptor(this.key,
{iv:this.iv}),f()):c(16,function(a,g){a?b(a):(n.encryptCipher=C.algo[n.cjsAlgorithm].createEncryptor(n.key,{iv:g}),n.iv=g,f())})};f.prototype.decrypt=function(e){d.logAction(d.LOG_MICRO,"CBCCipher.decrypt()","");e=z.toWordArray(e);var c=this.blockLengthWords,b=e.words;e=a.create(b.slice(0,c));b=a.create(b.slice(c));c=C.algo[this.cjsAlgorithm].createDecryptor(this.key,{iv:e});e=c.process(b);b=c.finalize();c.reset();b&&b.sigBytes&&e.concat(b);return e};f.prototype.getIv=function(a){if(this.iv){var e=
this.iv;this.iv=null;a(null,e)}else{var b=this;c(16,function(e,c){e?a(e):a(null,b.encryptCipher.process(c))})}};return b}(),L=function(){function b(){}function d(a){return a?u.sessionStorage:u.localStorage}function f(a,c,b,f){c={value:c};b&&(c.expires=h.now()+b);return d(f).setItem(a,JSON.stringify(c))}function a(a,c){var e=d(c).getItem(a);if(!e)return null;e=JSON.parse(e);return e.expires&&e.expires<h.now()?(d(c).removeItem(a),null):e.value}try{u.sessionStorage.setItem("ablyjs-storage-test","ablyjs-storage-test");
u.sessionStorage.removeItem("ablyjs-storage-test");var c=!0}catch(e){c=!1}try{u.localStorage.setItem("ablyjs-storage-test","ablyjs-storage-test");u.localStorage.removeItem("ablyjs-storage-test");var n=!0}catch(e){n=!1}n&&(b.set=function(a,c,b){return f(a,c,b,!1)},b.get=function(e){return a(e,!1)},b.remove=function(a){return d(!1).removeItem(a)});c&&(b.setSession=function(a,c,b){return f(a,c,b,!0)},b.getSession=function(e){return a(e,!0)},b.removeSession=function(a){return d(!0).removeItem(a)});return b}(),
t={internetUpUrl:"https://internet-up.ably-realtime.com/is-the-internet-up.txt",jsonpInternetUpUrl:"https://internet-up.ably-realtime.com/is-the-internet-up-0-9.js",defaultTransports:["xhr_polling","xhr_streaming","jsonp","web_socket"],baseTransportOrder:["xhr_polling","xhr_streaming","jsonp","web_socket"],transportPreferenceOrder:["jsonp","xhr_polling","xhr_streaming","web_socket"],upgradeTransports:["xhr_streaming","web_socket"]};w.noUpgrade&&(t.upgradeTransports=[]);var z=function(){function b(a){return null!==
a&&void 0!==a&&void 0!==a.sigBytes}function d(a){return null!==a&&void 0!==a&&a.constructor===c}function f(){}var a=C.lib.WordArray,c=w.ArrayBuffer,n=w.atob;f.base64CharSet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";f.isBuffer=function(a){return d(a)||b(a)};f.toArrayBuffer=function(a){if(!c)throw Error("Can't convert to ArrayBuffer: ArrayBuffer not supported");if(d(a))return a;if(b(a)){for(var e=new c(a.sigBytes),f=new Uint8Array(e),k=0;k<a.sigBytes;k++)f[k]=a.words[k>>>2]>>>
24-k%4*8&255;return e}throw Error("BufferUtils.toArrayBuffer expected a buffer");};f.toWordArray=function(c){return b(c)?c:a.create(c)};f.base64Encode=function(a){if(d(a)){var c="";a=new Uint8Array(a);var e=a.byteLength,f=e%3;e-=f;for(var g,n,l,v,h=0;h<e;h+=3)v=a[h]<<16|a[h+1]<<8|a[h+2],g=(v&16515072)>>18,n=(v&258048)>>12,l=(v&4032)>>6,v&=63,c+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[g]+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[n]+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[l]+
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[v];1==f?(v=a[e],c+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(v&252)>>2]+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(v&3)<<4]+"=="):2==f&&(v=a[e]<<8|a[e+1],c+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(v&64512)>>10]+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(v&1008)>>4]+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(v&
15)<<2]+"=");return c}if(b(a))return C.enc.Base64.stringify(a)};f.base64Decode=function(a){if(c&&n){a=n(a);for(var e=a.length,b=new Uint8Array(e),f=0;f<e;f++){var g=a.charCodeAt(f);b[f]=g}return b.buffer}return C.enc.Base64.parse(a)};f.hexEncode=function(c){d(c)&&(c=a.create(c));return C.enc.Hex.stringify(c)};f.utf8Encode=function(a){return C.enc.Utf8.parse(a)};f.utf8Decode=function(a){d(a)&&(a=f.toWordArray(a));if(b(a))return C.enc.Utf8.stringify(a);throw Error("Expected input of utf8Decode to be a buffer or CryptoJS WordArray");
};f.bufferCompare=function(a,c){if(!a)return-1;if(!c)return 1;a=f.toWordArray(a);c=f.toWordArray(c);a.clamp();c.clamp();var e=a.sigBytes-c.sigBytes;if(0!=e)return e;a=a.words;c=c.words;for(var b=0;b<a.length;b++)if(e=a[b]-c[b],0!=e)return e;return 0};f.byteLength=function(a){if(d(a))return a.byteLength;if(b(a))return a.sigBytes};return f}(),h=function(){function b(){}var d=w.msgpack;b.mixin=function(a){for(var c=1;c<arguments.length;c++){var b=arguments[c];if(!b)break;var e=b.hasOwnProperty,f;for(f in b)if(!e||
e.call(b,f))a[f]=b[f]}return a};b.copy=function(a){return b.mixin({},a)};b.isArray=Array.isArray||function(a){return"[object Array]"==Object.prototype.toString.call(a)};b.ensureArray=function(a){return b.isEmptyArg(a)?[]:b.isArray(a)?a:[a]};b.isObject=function(a){return"[object Object]"==Object.prototype.toString.call(a)};b.isEmpty=function(a){for(var c in a)return!1;return!0};b.isOnlyPropIn=function(a,c){for(var b in a)if(b!==c)return!1;return!0};b.isEmptyArg=function(a){return null===a||void 0===
a};b.shallowClone=function(a){var c={},b;for(b in a)c[b]=a[b];return c};b.prototypicalClone=function(a,c){function f(){}f.prototype=a;var e=new f;c&&b.mixin(e,c);return e};b.inherits=w.inherits||function(a,c){a.super_=c;a.prototype=b.prototypicalClone(c.prototype,{constructor:a})};b.containsValue=function(a,c){for(var b in a)if(a[b]==c)return!0;return!1};b.intersect=function(a,c){return b.isArray(c)?b.arrIntersect(a,c):b.arrIntersectOb(a,c)};b.arrIntersect=function(a,c){for(var f=[],e=0;e<a.length;e++){var d=
a[e];-1!=b.arrIndexOf(c,d)&&f.push(d)}return f};b.arrIntersectOb=function(a,c){for(var b=[],e=0;e<a.length;e++){var f=a[e];f in c&&b.push(f)}return b};b.arrSubtract=function(a,c){for(var f=[],e=0;e<a.length;e++){var d=a[e];-1==b.arrIndexOf(c,d)&&f.push(d)}return f};b.arrIndexOf=Array.prototype.indexOf?function(a,c,b){return a.indexOf(c,b)}:function(a,c,b){b=b||0;for(var e=a.length;b<e;b++)if(a[b]===c)return b;return-1};b.arrIn=function(a,c){return-1!==b.arrIndexOf(a,c)};b.arrDeleteValue=function(a,
c){var f=b.arrIndexOf(a,c),e=-1!=f;e&&a.splice(f,1);return e};b.arrWithoutValue=function(a,c){var f=a.slice();b.arrDeleteValue(f,c);return f};b.keysArray=function(a,c){var b=[],e;for(e in a)c&&!a.hasOwnProperty(e)||b.push(e);return b};b.valuesArray=function(a,c){var b=[],e;for(e in a)c&&!a.hasOwnProperty(e)||b.push(a[e]);return b};b.arrForEach=Array.prototype.forEach?function(a,c){a.forEach(c)}:function(a,c){for(var b=a.length,e=0;e<b;e++)c(a[e],e,a)};b.safeArrForEach=function(a,c){return b.arrForEach(a.slice(),
c)};b.arrMap=Array.prototype.map?function(a,c){return a.map(c)}:function(a,c){for(var b=[],e=a.length,f=0;f<e;f++)b.push(c(a[f],f,a));return b};b.arrFilter=Array.prototype.filter?function(a,c){return a.filter(c)}:function(a,c){for(var b=[],e=a.length,f=0;f<e;f++)c(a[f])&&b.push(a[f]);return b};b.arrEvery=Array.prototype.every?function(a,c){return a.every(c)}:function(a,c){for(var b=a.length,e=0;e<b;e++)if(!c(a[e],e,a))return!1;return!0};b.allSame=function(a,c){if(0===a.length)return!0;var f=a[0][c];
return b.arrEvery(a,function(a){return a[c]===f})};b.nextTick=w.nextTick;var f={json:"application/json",jsonp:"application/javascript",xml:"application/xml",html:"text/html",msgpack:"application/x-msgpack"};b.defaultGetHeaders=function(a){return{accept:f[a||"json"],"X-Ably-Version":t.apiVersion,"X-Ably-Lib":t.libstring}};b.defaultPostHeaders=function(a){var c;return{accept:c=f[a||"json"],"content-type":c,"X-Ably-Version":t.apiVersion,"X-Ably-Lib":t.libstring}};b.arrPopRandomElement=function(a){return a.splice(Math.floor(Math.random()*
a.length),1)[0]};b.toQueryString=function(a){var c=[];if(a)for(var b in a)c.push(encodeURIComponent(b)+"="+encodeURIComponent(a[b]));return c.length?"?"+c.join("&"):""};b.parseQueryString=function(a){for(var c,b=/([^?&=]+)=?([^&]*)/g,e={};c=b.exec(a);)e[decodeURIComponent(c[1])]=decodeURIComponent(c[2]);return e};b.now=Date.now||function(){return(new Date).getTime()};b.inspect=w.inspect;b.isErrorInfo=function(a){return"ErrorInfo"==a.constructor.name};b.inspectError=function(a){return a&&(b.isErrorInfo(a)||
"Error"==a.constructor.name||a instanceof Error)?a.toString():b.inspect(a)};b.inspectBody=function(a){return z.isBuffer(a)?a.toString():"string"===typeof a?a:w.inspect(a)};b.dataSizeBytes=function(a){if(z.isBuffer(a))return z.byteLength(a);if("string"===typeof a)return w.stringByteSize(a);throw Error("Expected input of Utils.dataSizeBytes to be a buffer or string, but was: "+typeof a);};b.cheapRandStr=function(){return String(Math.random()).substr(2)};b.randomString=w.getRandomValues&&"undefined"!==
typeof Uint8Array?function(a){a=new Uint8Array(a);w.getRandomValues(a);return z.base64Encode(a.buffer)}:function(a){var c=z.base64CharSet;a=Math.round(4*a/3);for(var b="",e=0;e<a;e++)b+=c[Math.floor(Math.random()*c.length)];return b};b.arrChooseN=function(a,c){for(var f=Math.min(c,a.length),e=a.slice(),d=[],r=0;r<f;r++)d.push(b.arrPopRandomElement(e));return d};b.trim=String.prototype.trim?function(a){return a.trim()}:function(a){return a.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,"")};b.promisify=
function(a,c,b){return new Promise(function(e,f){a[c].apply(a,Array.prototype.slice.call(b).concat(function(a,c){a?f(a):e(c)}))})};b.decodeBody=function(a,c){return"msgpack"==c?d.decode(a):JSON.parse(String(a))};b.encodeBody=function(a,c){return"msgpack"==c?d.encode(a,!0):JSON.stringify(a)};return b}(),y=function(){function b(){}function d(){}function f(a){var c=a.statusCode;return 408===c&&!a.code||400===c&&!a.code||500<=c&&504>=c}function a(a){var c=a.connection;return(c=c&&c.connectionManager.host)?
[c].concat(t.getFallbackHosts(a.options)):t.getHosts(a.options)}var c=Date.now||function(){return(new Date).getTime()};d._getHosts=a;d.methods=["get","delete","post","put","patch"];d.methodsWithoutBody=["get","delete"];d.methodsWithBody=h.arrSubtract(d.methods,d.methodsWithoutBody);h.arrForEach(d.methodsWithoutBody,function(a){d[a]=function(c,b,f,k,g){d["do"](a,c,b,f,null,k,g)};d[a+"Uri"]=function(c,b,f,k,g){d.doUri(a,c,b,f,null,k,g)}});h.arrForEach(d.methodsWithBody,function(a){d[a]=function(c,b,
f,k,g,p){d["do"](a,c,b,f,k,g,p)};d[a+"Uri"]=function(c,b,f,k,g,p){d.doUri(a,c,b,f,k,g,p)}});d["do"]=function(n,e,m,r,k,g,p){p=p||b;var l="function"==typeof m?m:function(a){return e.baseUri(a)+m},v=arguments,h=e._currentFallback;if(h){if(h.validUntil>c()){d.Request(n,e,l(h.host),r,g,k,function(a){a&&f(a)?(e._currentFallback=null,d["do"].apply(d,v)):p.apply(null,arguments)});return}e._currentFallback=null}h=a(e);if(1==h.length)d.doUri(n,e,l(h[0]),r,k,g,p);else{var S=function(a,b){var m=a.shift();d.doUri(n,
e,l(m),r,k,g,function(g){g&&f(g)&&a.length?S(a,!0):(b&&(e._currentFallback={host:m,validUntil:c()+e.options.timeouts.fallbackRetryTimeout}),p.apply(null,arguments))})};S(h)}};d.doUri=function(a,c,b,f,k,g,p){d.Request(a,c,b,f,g,k,p)};d.supportsAuthHeaders=!1;d.supportsLinkHeaders=!1;return d}(),oa=function(){function b(){this.buffer=[]}function d(a){this._input=a;this._index=-1;this._buffer=[]}function f(a){this._input=a;this._index=-1;this._buffer=[]}b.prototype.append=function(a){this.buffer.push(a);
return this};b.prototype.toString=function(){return this.buffer.join("")};var a={codex:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(c){var f=new b,e=a.codex;for(c=new d(c);c.moveNext();){var m=c.current;c.moveNext();var r=c.current;c.moveNext();var k=c.current,g=m>>2;m=(m&3)<<4|r>>4;var p=(r&15)<<2|k>>6,l=k&63;isNaN(r)?p=l=64:isNaN(k)&&(l=64);f.append(e.charAt(g)+e.charAt(m)+e.charAt(p)+e.charAt(l))}return f.toString()},decode:function(a){var c=new b;for(a=new f(a);a.moveNext();){var e=
a.current;if(128>e)c.append(String.fromCharCode(e));else if(191<e&&224>e){a.moveNext();var d=a.current;c.append(String.fromCharCode((e&31)<<6|d&63))}else a.moveNext(),d=a.current,a.moveNext(),c.append(String.fromCharCode((e&15)<<12|(d&63)<<6|a.current&63))}return c.toString()}};d.prototype={current:Number.NaN,moveNext:function(){if(0<this._buffer.length)return this.current=this._buffer.shift(),!0;if(this._index>=this._input.length-1)return this.current=Number.NaN,!1;var a=this._input.charCodeAt(++this._index);
13==a&&10==this._input.charCodeAt(this._index+1)&&(a=10,this._index+=2);128>a?this.current=a:(127<a&&2048>a?this.current=a>>6|192:(this.current=a>>12|224,this._buffer.push(a>>6&63|128)),this._buffer.push(a&63|128));return!0}};f.prototype={current:64,moveNext:function(){if(0<this._buffer.length)return this.current=this._buffer.shift(),!0;if(this._index>=this._input.length-1)return this.current=64,!1;var c=a.codex.indexOf(this._input.charAt(++this._index)),b=a.codex.indexOf(this._input.charAt(++this._index)),
e=a.codex.indexOf(this._input.charAt(++this._index)),f=a.codex.indexOf(this._input.charAt(++this._index)),d=(e&3)<<6|f;this.current=c<<2|b>>4;64!=e&&this._buffer.push((b&15)<<4|e>>2);64!=f&&this._buffer.push(d);return!0}};return a}();t.ENVIRONMENT="";t.REST_HOST="rest.ably.io";t.REALTIME_HOST="realtime.ably.io";t.FALLBACK_HOSTS=["A.ably-realtime.com","B.ably-realtime.com","C.ably-realtime.com","D.ably-realtime.com","E.ably-realtime.com"];t.PORT=80;t.TLS_PORT=443;t.TIMEOUTS={disconnectedRetryTimeout:15E3,
suspendedRetryTimeout:3E4,httpRequestTimeout:15E3,channelRetryTimeout:15E3,fallbackRetryTimeout:6E5,connectionStateTtl:12E4,realtimeRequestTimeout:1E4,recvTimeout:9E4,preferenceConnectTimeout:6E3,parallelUpgradeDelay:6E3};t.httpMaxRetryCount=3;t.maxMessageSize=65536;t.version="1.1.20";t.libstring=w.libver+t.version;t.apiVersion="1.1";t.getHost=function(b,d,f){return d=f?d==b.restHost&&b.realtimeHost||d||b.realtimeHost:d||b.restHost};t.getPort=function(b,d){return d||b.tls?b.tlsPort:b.port};t.getHttpScheme=
function(b){return b.tls?"https://":"http://"};t.getFallbackHosts=function(b){var d=b.fallbackHosts;b="undefined"!==typeof b.httpMaxRetryCount?b.httpMaxRetryCount:t.httpMaxRetryCount;return d?h.arrChooseN(d,b):[]};t.getHosts=function(b){return[b.restHost].concat(t.getFallbackHosts(b))};t.objectifyOptions=function(b){return"string"==typeof b?-1==b.indexOf(":")?{token:b}:{key:b}:b};t.normaliseOptions=function(b){b.host&&(d.deprecated("host","restHost"),b.restHost=b.host);b.wsHost&&(d.deprecated("wsHost",
"realtimeHost"),b.realtimeHost=b.wsHost);b.queueEvents&&(d.deprecated("queueEvents","queueMessages"),b.queueMessages=b.queueEvents);!0===b.recover&&(d.deprecated("{recover: true}","{recover: function(lastConnectionDetails, cb) { cb(true); }}"),b.recover=function(a,b){b(!0)});"function"===typeof b.recover&&!0===b.closeOnUnload&&(d.logAction(d.LOG_ERROR,"Defaults.normaliseOptions","closeOnUnload was true and a session recovery function was set - these are mutually exclusive, so unsetting the latter"),
b.recover=null);"closeOnUnload"in b||(b.closeOnUnload=!b.recover);b.transports&&h.arrIn(b.transports,"xhr")&&(d.deprecated('transports: ["xhr"]','transports: ["xhr_streaming"]'),h.arrDeleteValue(b.transports,"xhr"),b.transports.push("xhr_streaming"));"queueMessages"in b||(b.queueMessages=!0);var l=!1;if(b.restHost)b.realtimeHost=b.realtimeHost||b.restHost;else{var f=b.environment&&String(b.environment).toLowerCase()||t.ENVIRONMENT;l=!f||"production"===f;b.restHost=l?t.REST_HOST:f+"-"+t.REST_HOST;
b.realtimeHost=l?t.REALTIME_HOST:f+"-"+t.REALTIME_HOST}b.fallbackHosts=l||b.fallbackHostsUseDefault?t.FALLBACK_HOSTS:b.fallbackHosts;h.arrForEach((b.fallbackHosts||[]).concat(b.restHost,b.realtimeHost),la);b.port=b.port||t.PORT;b.tlsPort=b.tlsPort||t.TLS_PORT;b.maxMessageSize=b.maxMessageSize||t.maxMessageSize;"tls"in b||(b.tls=!0);b.timeouts={};for(var a in t.TIMEOUTS)b.timeouts[a]=b[a]||t.TIMEOUTS[a];b.useBinaryProtocol="useBinaryProtocol"in b?w.supportsBinary&&b.useBinaryProtocol:w.preferBinary;
b.clientId&&((b.headers=b.headers||{})["X-Ably-ClientId"]=z.base64Encode(z.utf8Encode(b.clientId)));"idempotentRestPublishing"in b||(b.idempotentRestPublishing=!1);b.promises&&!w.Promise&&(d.logAction(d.LOG_ERROR,"Defaults.normaliseOptions","{promises: true} was specified, but no Promise constructor found; disabling promises"),b.promises=!1);return b};var B=function(){function b(){this.any=[];this.events={};this.anyOnce=[];this.eventsOnce={}}function l(a,c,b){try{c.apply(a,b)}catch(e){d.logAction(d.LOG_ERROR,
"EventEmitter.emit()","Unexpected listener exception: "+e+"; stack = "+(e&&e.stack))}}function f(a,c,b){var e,d,n;for(n=0;n<a.length;n++){var k=a[n];b&&(k=k[b]);if(h.isArray(k)){for(;-1!==(e=h.arrIndexOf(k,c));)k.splice(e,1);b&&0===k.length&&delete a[n][b]}else if(h.isObject(k))for(d in k)k.hasOwnProperty(d)&&h.isArray(k[d])&&f([k],c,d)}}b.prototype.on=function(a,c){if(1==arguments.length&&"function"==typeof a)this.any.push(a);else if(h.isEmptyArg(a))this.any.push(c);else if(h.isArray(a)){var b=this;
h.arrForEach(a,function(a){b.on(a,c)})}else(this.events[a]||(this.events[a]=[])).push(c)};b.prototype.off=function(a,c){if(0==arguments.length||h.isEmptyArg(a)&&h.isEmptyArg(c))this.any=[],this.events={},this.anyOnce=[],this.eventsOnce={};else if(1==arguments.length&&"function"==typeof a&&(c=a,a=null),c&&h.isEmptyArg(a))f([this.any,this.events,this.anyOnce,this.eventsOnce],c);else{if(h.isArray(a)){var b=this;h.arrForEach(a,function(a){b.off(a,c)})}c?f([this.events,this.eventsOnce],c,a):(delete this.events[a],
delete this.eventsOnce[a])}};b.prototype.listeners=function(a){if(a){var c=this.events[a]||[];this.eventsOnce[a]&&Array.prototype.push.apply(c,this.eventsOnce[a]);return c.length?c:null}return this.any.length?this.any:null};b.prototype.emit=function(a){var c=Array.prototype.slice.call(arguments,1),b={event:a},e=[];this.anyOnce.length&&(Array.prototype.push.apply(e,this.anyOnce),this.anyOnce=[]);this.any.length&&Array.prototype.push.apply(e,this.any);var f=this.eventsOnce[a];f&&(Array.prototype.push.apply(e,
f),delete this.eventsOnce[a]);(f=this.events[a])&&Array.prototype.push.apply(e,f);h.arrForEach(e,function(a){l(b,a,c)})};b.prototype.once=function(a,c){var b=arguments.length,e=this;if((0===b||1===b&&"function"!==typeof a)&&w.Promise)return new w.Promise(function(c){e.once(a,c)});if(1==arguments.length&&"function"==typeof a)this.anyOnce.push(a);else if(h.isEmptyArg(a))this.anyOnce.push(c);else{if(h.isArray(a))throw"Arrays of events can only be used with on(), not once()";(this.eventsOnce[a]||(this.eventsOnce[a]=
[])).push(c)}};b.prototype.whenState=function(a,c,b){var e={event:a},f=this,d=Array.prototype.slice.call(arguments,3);if("string"!==typeof a||"string"!==typeof c)throw"whenState requires a valid event String argument";if("function"!==typeof b&&w.Promise)return new w.Promise(function(e){f.whenState.bind(f,a,c,e).apply(f,d)});if(a===c)l(e,b,d);else this.once(a,b)};return b}(),d=function(){function b(a,c){return("000"+a).slice(-2-(c||0))}function d(a){return w.logTimestamps?function(c){var g=new Date;
a(b(g.getHours())+":"+b(g.getMinutes())+":"+b(g.getSeconds())+"."+b(g.getMilliseconds(),!0)+" "+c)}:a}function f(){}if("undefined"===typeof Window&&"undefined"===typeof WorkerGlobalScope||u.console&&u.console.log&&"function"===typeof u.console.log.apply){var a=function(){console.log.apply(console,arguments)};var c=console.warn?function(){console.warn.apply(console,arguments)}:a}else a=u.console&&u.console.log?c=function(){Function.prototype.apply.call(console.log,console,arguments)}:c=function(){};
var n=1,e=d(a),m=d(c);f.LOG_NONE=0;f.LOG_ERROR=1;f.LOG_MAJOR=2;f.LOG_MINOR=3;f.LOG_MICRO=4;f.LOG_DEFAULT=1;f.LOG_DEBUG=4;f.logAction=function(a,c,g){f.shouldLog(a)&&(1===a?m:e)("Ably: "+c+": "+g)};f.deprecated=function(a,c){f.shouldLog(1)&&m("Ably: Deprecation warning - '"+a+"' is deprecated and will be removed from a future version. Please use '"+c+"' instead.")};f.shouldLog=function(a){return a<=n};f.setLog=function(a,c){void 0!==a&&(n=a);void 0!==c&&(e=m=c)};return f}(),ba=function(){return function(b){function l(){for(var f=
0;f<b.length;f++){var a=b[f];if(a)try{a.apply(null,arguments)}catch(c){d.logAction(d.LOG_ERROR,"Multicaster multiple callback handler","Unexpected exception: "+c+"; stack = "+c.stack)}}}b=b||[];l.push=function(){Array.prototype.push.apply(b,arguments)};return l}}(),q=function(){function b(b,f,a,c){this.message=b;this.code=f;this.statusCode=a;this.cause=c;this.href=void 0}b.prototype.toString=function(){var b="["+this.constructor.name;this.message&&(b+=": "+this.message);this.statusCode&&(b+="; statusCode="+
this.statusCode);this.code&&(b+="; code="+this.code);this.cause&&(b+="; cause="+h.inspectError(this.cause));!this.href||this.message&&-1<this.message.indexOf("help.ably.io")||(b+="; see "+this.href+" ");return b+"]"};b.fromValues=function(d){var f=h.mixin(new b,d);d instanceof Error&&(f.message=d.message);f.code&&!f.href&&(f.href="https://help.ably.io/error/"+f.code);return f};return b}(),D=function(){function b(){this.size=this.extras=this.encoding=this.data=this.connectionKey=this.connectionId=
this.clientId=this.timestamp=this.id=this.name=void 0}function l(b){if(b&&b.cipher&&!b.cipher.channelCipher){if(!T)throw Error("Encryption not enabled; use ably.encryption.js instead");var a=T.getCipher(b.cipher);b.cipher=a.cipherParams;b.channelCipher=a.cipher}}b.prototype.toJSON=function(){var b={name:this.name,id:this.id,clientId:this.clientId,connectionId:this.connectionId,connectionKey:this.connectionKey,encoding:this.encoding,extras:this.extras},a=this.data;if(a&&z.isBuffer(a))if(0<arguments.length){var c=
this.encoding;b.encoding=c?c+"/base64":"base64";a=z.base64Encode(a)}else a=z.toArrayBuffer(a);b.data=a;return b};b.prototype.toString=function(){var b="[Message";this.name&&(b+="; name="+this.name);this.id&&(b+="; id="+this.id);this.timestamp&&(b+="; timestamp="+this.timestamp);this.clientId&&(b+="; clientId="+this.clientId);this.connectionId&&(b+="; connectionId="+this.connectionId);this.encoding&&(b+="; encoding="+this.encoding);this.extras&&(b+="; extras ="+JSON.stringify(this.extras));this.data&&
(b="string"==typeof this.data?b+("; data="+this.data):z.isBuffer(this.data)?b+("; data (buffer)="+z.base64Encode(this.data)):b+("; data (json)="+JSON.stringify(this.data)));this.extras&&(b+="; extras="+JSON.stringify(this.extras));return b+"]"};b.encrypt=function(b,a,c){var d=b.data,e=b.encoding,f=a.channelCipher;e=e?e+"/":"";z.isBuffer(d)||(d=z.utf8Encode(String(d)),e+="utf-8/");f.encrypt(d,function(a,d){a?c(a):(b.data=d,b.encoding=e+"cipher+"+f.algorithm,c(null,b))})};b.encode=function(d,a,c){var f=
d.data,e;if("string"!=typeof f&&!z.isBuffer(f)&&null!==f&&void 0!==f)if(h.isObject(f)||h.isArray(f))d.data=JSON.stringify(f),d.encoding=(e=d.encoding)?e+"/json":"json";else throw new q("Data type is unsupported",40013,400);null!=a&&a.cipher?b.encrypt(d,a,c):c(null,d)};b.encodeArray=function(d,a,c){for(var f=0,e=0;e<d.length;e++)b.encode(d[e],a,function(a){a?c(a):(f++,f==d.length&&c(null,d))})};b.serialize=h.encodeBody;b.decode=function(b,a){var c=b.encoding;if(c){c=c.split("/");var d,e=c.length,f=
b.data;try{for(;0<(d=e);){var r=c[--e].match(/([\-\w]+)(\+([\w\-]+))?/);if(!r)break;var k=r[1];switch(k){case "base64":f=z.base64Decode(String(f));continue;case "utf-8":f=z.utf8Decode(f);continue;case "json":f=JSON.parse(f);continue;case "cipher":if(null!=a&&a.cipher){var g=a.channelCipher;if(r[3]!=g.algorithm)throw Error("Unable to decrypt message with given cipher; incompatible cipher params");f=g.decrypt(f);continue}else throw Error("Unable to decrypt message; not an encrypted channel");default:throw Error("Unknown encoding");
}}}catch(p){throw new q("Error processing the "+k+" encoding, decoder returned \u2018"+p.message+"\u2019",40013,400);}finally{b.encoding=0>=d?null:c.slice(0,d).join("/"),b.data=f}}};b.fromResponseBody=function(f,a,c){c&&(f=h.decodeBody(f,c));for(c=0;c<f.length;c++){var n=f[c]=b.fromValues(f[c]);try{b.decode(n,a)}catch(e){d.logAction(d.LOG_ERROR,"Message.fromResponseBody()",e.toString())}}return f};b.fromValues=function(d){return h.mixin(new b,d)};b.fromValuesArray=function(d){for(var a=d.length,c=
Array(a),f=0;f<a;f++)c[f]=b.fromValues(d[f]);return c};b.fromEncoded=function(f,a){var c=b.fromValues(f);l(a);try{b.decode(c,a)}catch(n){d.logAction(d.LOG_ERROR,"Message.fromEncoded()",n.toString())}return c};b.fromEncodedArray=function(d,a){l(a);return h.arrMap(d,function(c){return b.fromEncoded(c,a)})};b.getMessagesSize=function(b){for(var a,c=0,d=0;d<b.length;d++){a=b[d];var e;if(!(e=a.size)){e=a;var f=0;a.name&&(f+=a.name.length);a.clientId&&(f+=a.clientId.length);a.extras&&(f+=JSON.stringify(a.extras).length);
a.data&&(f+=h.dataSizeBytes(a.data));e=e.size=f}c+=e}return c};return b}(),I=function(){function b(){this.size=this.encoding=this.data=this.connectionId=this.clientId=this.timestamp=this.id=this.action=void 0}b.Actions=["absent","present","enter","leave","update"];b.prototype.isSynthesized=function(){return this.id.substring(this.connectionId.length,0)!==this.connectionId};b.prototype.parseId=function(){var b=this.id.split(":");return{connectionId:b[0],msgSerial:parseInt(b[1],10),index:parseInt(b[2],
10)}};b.prototype.toJSON=function(){var d={clientId:this.clientId,action:h.arrIndexOf(b.Actions,this.action),encoding:this.encoding},f=this.data;if(f&&z.isBuffer(f))if(0<arguments.length){var a=this.encoding;d.encoding=a?a+"/base64":"base64";f=z.base64Encode(f)}else f=z.toArrayBuffer(f);d.data=f;return d};b.prototype.toString=function(){var b="[PresenceMessage; action="+this.action;this.id&&(b+="; id="+this.id);this.timestamp&&(b+="; timestamp="+this.timestamp);this.clientId&&(b+="; clientId="+this.clientId);
this.connectionId&&(b+="; connectionId="+this.connectionId);this.encoding&&(b+="; encoding="+this.encoding);this.data&&(b="string"==typeof this.data?b+("; data="+this.data):z.isBuffer(this.data)?b+("; data (buffer)="+z.base64Encode(this.data)):b+("; data (json)="+JSON.stringify(this.data)));return b+"]"};b.encode=D.encode;b.decode=D.decode;b.fromResponseBody=function(l,f,a){a&&(l=h.decodeBody(l,a));for(a=0;a<l.length;a++){var c=l[a]=b.fromValues(l[a],!0);try{b.decode(c,f)}catch(n){d.logAction(d.LOG_ERROR,
"PresenceMessage.fromResponseBody()",n.toString())}}return l};b.fromValues=function(d,f){f&&(d.action=b.Actions[d.action]);return h.mixin(new b,d)};b.fromValuesArray=function(d){for(var f=d.length,a=Array(f),c=0;c<f;c++)a[c]=b.fromValues(d[c]);return a};b.fromEncoded=function(h,f){var a=b.fromValues(h,!0);try{b.decode(a,f)}catch(c){d.logAction(d.LOG_ERROR,"PresenceMessage.fromEncoded()",c.toString())}return a};b.fromEncodedArray=function(d,f){return h.arrMap(d,function(a){return b.fromEncoded(a,f)})};
b.getMessagesSize=D.getMessagesSize;return b}(),A=function(){function b(){this.auth=this.presence=this.messages=this.msgSerial=this.channelSerial=this.channel=this.connectionSerial=this.connectionKey=this.connectionId=this.error=this.count=this.timestamp=this.id=this.flags=this.action=void 0}function d(a){var c=[];if(a)for(var b=0;b<a.length;b++)c.push(a[b].toString());return"[ "+c.join(", ")+" ]"}var f=b.Action={HEARTBEAT:0,ACK:1,NACK:2,CONNECT:3,CONNECTED:4,DISCONNECT:5,DISCONNECTED:6,CLOSE:7,CLOSED:8,
ERROR:9,ATTACH:10,ATTACHED:11,DETACH:12,DETACHED:13,PRESENCE:14,MESSAGE:15,SYNC:16,AUTH:17};b.ActionName=[];h.arrForEach(h.keysArray(b.Action,!0),function(a){b.ActionName[f[a]]=a});var a={HAS_PRESENCE:1,HAS_BACKLOG:2,RESUMED:4,TRANSIENT:16,PRESENCE:65536,PUBLISH:131072,SUBSCRIBE:262144,PRESENCE_SUBSCRIBE:524288},c=h.keysArray(a);a.MODE_ALL=a.PRESENCE|a.PUBLISH|a.SUBSCRIBE|a.PRESENCE_SUBSCRIBE;b.prototype.hasFlag=function(c){return 0<(this.flags&a[c])};b.prototype.setFlag=function(c){return this.flags|=
a[c]};b.prototype.getMode=function(){return this.flags&&this.flags&a.MODE_ALL};b.serialize=h.encodeBody;b.deserialize=function(a,c){var e=h.decodeBody(a,c);return b.fromDeserialized(e)};b.fromDeserialized=function(a){var c=a.error;c&&(a.error=q.fromValues(c));var e=a.messages;if(e)for(c=0;c<e.length;c++)e[c]=D.fromValues(e[c]);if(e=a.presence)for(c=0;c<e.length;c++)e[c]=I.fromValues(e[c],!0);return h.mixin(new b,a)};b.fromValues=function(a){return h.mixin(new b,a)};var n="id channel channelSerial connectionId connectionKey connectionSerial count msgSerial timestamp".split(" ");
b.stringify=function(a){var e="[ProtocolMessage";void 0!==a.action&&(e+="; action="+b.ActionName[a.action]||a.action);for(var f,k=0;k<n.length;k++)f=n[k],void 0!==a[f]&&(e+="; "+f+"="+a[f]);a.messages&&(e+="; messages="+d(D.fromValuesArray(a.messages)));a.presence&&(e+="; presence="+d(I.fromValuesArray(a.presence)));a.error&&(e+="; error="+q.fromValues(a.error).toString());a.auth&&a.auth.accessToken&&(e+="; token="+a.auth.accessToken);a.flags&&(e+="; flags="+h.arrFilter(c,function(c){return a.hasFlag(c)}).join(","));
return e+"]"};b.isDuplicate=function(a,c){return a&&c&&(a.action===f.MESSAGE||a.action===f.PRESENCE)&&a.action===c.action&&a.channel===c.channel&&a.id===c.id};return b}(),pa=function(){function b(a){this.count=a&&a.count||0;this.data=a&&a.data||0;this.uncompressedData=a&&a.uncompressedData||0;this.failed=a&&a.failed||0;this.refused=a&&a.refused||0}function d(a){b.call(this,a);this.category=void 0;if(a&&a.category){this.category={};for(var c in a.category){var g=a.category[c];Object.prototype.hasOwnProperty.call(a.category,
c)&&g&&(this.category[c]=new b(g))}}}function f(a){this.peak=a&&a.peak||0;this.min=a&&a.min||0;this.mean=a&&a.mean||0;this.opened=a&&a.opened||0;this.refused=a&&a.refused||0}function a(a){this.succeeded=a&&a.succeeded||0;this.failed=a&&a.failed||0;this.refused=a&&a.refused||0}function c(a){this.plain=new f(a&&a.plain);this.tls=new f(a&&a.tls);this.all=new f(a&&a.all)}function n(a){this.messages=new d(a&&a.messages);this.presence=new d(a&&a.presence);this.all=new d(a&&a.all)}function e(a){this.realtime=
new n(a&&a.realtime);this.rest=new n(a&&a.rest);this.webhook=new n(a&&a.webhook);this.sharedQueue=new n(a&&a.sharedQueue);this.externalQueue=new n(a&&a.externalQueue);this.httpEvent=new n(a&&a.httpEvent);this.push=new n(a&&a.push);this.all=new n(a&&a.all)}function m(a){this.all=new n(a&&a.all);this.inbound=new e(a&&a.inbound);this.outbound=new e(a&&a.outbound)}function h(a){this.all=new n(a&&a.all);this.producerPaid=new m(a&&a.producerPaid);this.consumerPaid=new m(a&&a.consumerPaid)}function k(a){this.messages=
a&&a.messages||0;var c=a&&a.notifications;this.notifications={invalid:c&&c.invalid||0,attempted:c&&c.attempted||0,successful:c&&c.successful||0,failed:c&&c.failed||0};this.directPublishes=a&&a.directPublishes||0}function g(a){this.succeeded=a&&a.succeeded||0;this.skipped=a&&a.skipped||0;this.failed=a&&a.failed||0}function p(a){this.delta=void 0;if(a&&a.delta){this.delta={};for(var c in a.delta){var b=a.delta[c];Object.prototype.hasOwnProperty.call(a.delta,c)&&b&&(this.delta[c]=new g(b))}}}function x(g){m.call(this,
g);this.persisted=new n(g&&g.persisted);this.connections=new c(g&&g.connections);this.channels=new f(g&&g.channels);this.apiRequests=new a(g&&g.apiRequests);this.tokenRequests=new a(g&&g.tokenRequests);this.xchgProducer=new h(g&&g.xchgProducer);this.xchgConsumer=new h(g&&g.xchgConsumer);this.push=new k(g&&g.pushStats);this.processed=new p(g&&g.processed);this.inProgress=g&&g.inProgress||void 0;this.unit=g&&g.unit||void 0;this.intervalId=g&&g.intervalId||void 0}x.fromValues=function(a){return new x(a)};
return x}(),W=function(){function b(){this.deviceIdentityToken=this.metadata=this.clientId=this.formFactor=this.platform=this.deviceSecret=this.id=void 0;this.push={recipient:void 0,state:void 0,errorReason:void 0}}b.prototype.toJSON=function(){return{id:this.id,deviceSecret:this.deviceSecret,platform:this.platform,formFactor:this.formFactor,clientId:this.clientId,metadata:this.metadata,deviceIdentityToken:this.deviceIdentityToken,push:{recipient:this.push.recipient,state:this.push.state,errorReason:this.push.errorReason}}};
b.prototype.toString=function(){var b="[DeviceDetails";this.id&&(b+="; id="+this.id);this.platform&&(b+="; platform="+this.platform);this.formFactor&&(b+="; formFactor="+this.formFactor);this.clientId&&(b+="; clientId="+this.clientId);this.metadata&&(b+="; metadata="+this.metadata);this.deviceIdentityToken&&(b+="; deviceIdentityToken="+JSON.stringify(this.deviceIdentityToken));this.push.recipient&&(b+="; push.recipient="+JSON.stringify(this.push.recipient));this.push.state&&(b+="; push.state="+this.push.state);
this.push.errorReason&&(b+="; push.errorReason="+this.push.errorReason);this.push.metadata&&(b+="; push.metadata="+this.push.metadata);return b+"]"};b.toRequestBody=h.encodeBody;b.fromResponseBody=function(d,f){f&&(d=h.decodeBody(d,f));return h.isArray(d)?b.fromValuesArray(d):b.fromValues(d)};b.fromValues=function(d){return h.mixin(new b,d)};b.fromValuesArray=function(d){for(var f=d.length,a=Array(f),c=0;c<f;c++)a[c]=b.fromValues(d[c]);return a};return b}(),ca=function(){function b(){this.clientId=
this.deviceId=this.channel=void 0}b.prototype.toJSON=function(){return{channel:this.channel,deviceId:this.deviceId,clientId:this.clientId}};b.prototype.toString=function(){var b="[PushChannelSubscription";this.channel&&(b+="; channel="+this.channel);this.deviceId&&(b+="; deviceId="+this.deviceId);this.clientId&&(b+="; clientId="+this.clientId);return b+"]"};b.toRequestBody=h.encodeBody;b.fromResponseBody=function(d,f){f&&(d=h.decodeBody(d,f));return h.isArray(d)?b.fromValuesArray(d):b.fromValues(d)};
b.fromValues=function(d){return h.mixin(new b,d)};b.fromValuesArray=function(d){for(var f=d.length,a=Array(f),c=0;c<f;c++)a[c]=b.fromValues(d[c]);return a};return b}(),M={disconnected:q.fromValues({statusCode:400,code:80003,message:"Connection to server temporarily unavailable"}),suspended:q.fromValues({statusCode:400,code:80002,message:"Connection to server unavailable"}),failed:q.fromValues({statusCode:400,code:8E4,message:"Connection failed or disconnected by server"}),closing:q.fromValues({statusCode:400,
code:80017,message:"Connection closing"}),closed:q.fromValues({statusCode:400,code:80017,message:"Connection closed"}),unknownConnectionErr:q.fromValues({statusCode:500,code:50002,message:"Internal connection error"}),unknownChannelErr:q.fromValues({statusCode:500,code:50001,message:"Internal channel error"})},ia=function(){function b(){B.call(this);this.messages=[]}h.inherits(b,B);b.prototype.count=function(){return this.messages.length};b.prototype.push=function(b){this.messages.push(b)};b.prototype.shift=
function(){return this.messages.shift()};b.prototype.last=function(){return this.messages[this.messages.length-1]};b.prototype.copyAll=function(){return this.messages.slice()};b.prototype.append=function(b){this.messages.push.apply(this.messages,b)};b.prototype.prepend=function(b){this.messages.unshift.apply(this.messages,b)};b.prototype.completeMessages=function(b,f,a){d.logAction(d.LOG_MICRO,"MessageQueue.completeMessages()","serial = "+b+"; count = "+f);a=a||null;var c=this.messages,n=c[0];if(n){n=
n.message.msgSerial;b+=f;if(b>n)for(b=c.splice(0,b-n),f=0;f<b.length;f++)b[f].callback(a);0==c.length&&this.emit("idle")}};b.prototype.completeAllMessages=function(b){this.completeMessages(0,Number.MAX_SAFE_INTEGER||Number.MAX_VALUE,b)};b.prototype.clear=function(){d.logAction(d.LOG_MICRO,"MessageQueue.clear()","clearing "+this.messages.length+" messages");this.messages=[];this.emit("idle")};return b}(),ja=function(){function b(b){B.call(this);this.transport=b;this.messageQueue=new ia;var a=this;
b.on("ack",function(c,b){a.onAck(c,b)});b.on("nack",function(c,b,e){a.onNack(c,b,e)})}var l=A.Action;h.inherits(b,B);b.prototype.onAck=function(b,a){d.logAction(d.LOG_MICRO,"Protocol.onAck()","serial = "+b+"; count = "+a);this.messageQueue.completeMessages(b,a)};b.prototype.onNack=function(b,a,c){d.logAction(d.LOG_ERROR,"Protocol.onNack()","serial = "+b+"; count = "+a+"; err = "+h.inspectError(c));c||(c=new q("Unable to send message; channel not responding",50001,500));this.messageQueue.completeMessages(b,
a,c)};b.prototype.onceIdle=function(b){var a=this.messageQueue;if(0===a.count())b();else a.once("idle",b)};b.prototype.send=function(b){b.ackRequired&&this.messageQueue.push(b);d.shouldLog(d.LOG_MICRO)&&d.logAction(d.LOG_MICRO,"Protocol.send()","sending msg; "+A.stringify(b.message));b.sendAttempted=!0;this.transport.send(b.message)};b.prototype.getTransport=function(){return this.transport};b.prototype.getPendingMessages=function(){return this.messageQueue.copyAll()};b.prototype.clearPendingMessages=
function(){return this.messageQueue.clear()};b.prototype.finish=function(){var b=this.transport;this.onceIdle(function(){b.disconnect()})};b.PendingMessage=function(b,a){this.message=b;this.callback=a;this.merged=!1;var c=b.action;this.sendAttempted=!1;this.ackRequired=c==l.MESSAGE||c==l.PRESENCE};return b}(),P=function(){function b(){}function l(a,c){return h.arrIndexOf(r,a.shortName)>h.arrIndexOf(r,c.shortName)}function f(a,c,b,e){this.options=a;this.host=c;this.mode=b;this.connectionKey=e;this.format=
a.useBinaryProtocol?"msgpack":"json";this.timeSerial=this.connectionSerial=void 0}function a(c,b){B.call(this);this.realtime=c;this.options=b;var g=b.timeouts,e=this;this.states={initialized:{state:"initialized",terminal:!1,queueEvents:!0,sendEvents:!1,failState:"disconnected"},connecting:{state:"connecting",terminal:!1,queueEvents:!0,sendEvents:!1,retryDelay:g.preferenceConnectTimeout+g.realtimeRequestTimeout,failState:"disconnected"},connected:{state:"connected",terminal:!1,queueEvents:!1,sendEvents:!0,
failState:"disconnected"},synchronizing:{state:"connected",terminal:!1,queueEvents:!0,sendEvents:!1,forceQueueEvents:!0,failState:"disconnected"},disconnected:{state:"disconnected",terminal:!1,queueEvents:!0,sendEvents:!1,retryDelay:g.disconnectedRetryTimeout,failState:"disconnected"},suspended:{state:"suspended",terminal:!1,queueEvents:!1,sendEvents:!1,retryDelay:g.suspendedRetryTimeout,failState:"suspended"},closing:{state:"closing",terminal:!1,queueEvents:!1,sendEvents:!1,retryDelay:g.realtimeRequestTimeout,
failState:"closed"},closed:{state:"closed",terminal:!0,queueEvents:!1,sendEvents:!1,failState:"closed"},failed:{state:"failed",terminal:!0,queueEvents:!1,sendEvents:!1,failState:"failed"}};this.state=this.states.initialized;this.errorReason=null;this.queuedMessages=new ia;this.msgSerial=0;this.connectionSerial=this.timeSerial=this.connectionKey=this.connectionId=this.connectionDetails=void 0;this.connectionStateTtl=g.connectionStateTtl;this.maxIdleInterval=null;this.transports=h.intersect(b.transports||
t.defaultTransports,a.supportedTransports);this.baseTransport=h.intersect(t.baseTransportOrder,this.transports)[0];this.upgradeTransports=h.intersect(this.transports,t.upgradeTransports);this.transportPreference=null;this.httpHosts=t.getHosts(b);this.activeProtocol=null;this.proposedTransports=[];this.pendingTransports=[];this.mostRecentMsg=this.lastActivity=this.lastAutoReconnectAttempt=this.host=null;this.forceFallbackHost=!1;this.connectCounter=0;d.logAction(d.LOG_MINOR,"Realtime.ConnectionManager()",
"started");d.logAction(d.LOG_MICRO,"Realtime.ConnectionManager()","requested transports = ["+(b.transports||t.defaultTransports)+"]");d.logAction(d.LOG_MICRO,"Realtime.ConnectionManager()","available transports = ["+this.transports+"]");d.logAction(d.LOG_MICRO,"Realtime.ConnectionManager()","http hosts = ["+this.httpHosts+"]");if(!this.transports.length)throw d.logAction(d.LOG_ERROR,"realtime.ConnectionManager()","no requested transports available"),Error("no requested transports available");if(g=
w.addEventListener)n&&"function"===typeof b.recover&&g("beforeunload",this.persistConnection.bind(this)),!0===b.closeOnUnload&&g("beforeunload",function(){d.logAction(d.LOG_MAJOR,"Realtime.ConnectionManager()","beforeunload event has triggered the connection to close as closeOnUnload is true");e.requestState({state:"closing"})}),g("online",function(){if(e.state==e.states.disconnected||e.state==e.states.suspended)d.logAction(d.LOG_MINOR,"ConnectionManager caught browser \u2018online\u2019 event","reattempting connection"),
e.requestState({state:"connecting"})}),g("offline",function(){e.state==e.states.connected&&(d.logAction(d.LOG_MINOR,"ConnectionManager caught browser \u2018offline\u2019 event","disconnecting active transport"),e.disconnectAllTransports())})}var c=!("undefined"===typeof L||!L.get),n=!("undefined"===typeof L||!L.getSession),e=A.Action,m=ja.PendingMessage,r=t.transportPreferenceOrder,k=r[r.length-1];f.prototype.getConnectParams=function(a){a=a?h.copy(a):{};var c=this.options;switch(this.mode){case "upgrade":a.upgrade=
this.connectionKey;break;case "resume":a.resume=this.connectionKey;void 0!==this.timeSerial?a.timeSerial=this.timeSerial:void 0!==this.connectionSerial&&(a.connectionSerial=this.connectionSerial);break;case "recover":var g=c.recover.split(":");g&&(a.recover=g[0],g=g[1],isNaN(g)?a.timeSerial=g:a.connectionSerial=g)}void 0!==c.clientId&&(a.clientId=c.clientId);!1===c.echoMessages&&(a.echo="false");void 0!==this.format&&(a.format=this.format);void 0!==this.stream&&(a.stream=this.stream);void 0!==this.heartbeats&&
(a.heartbeats=this.heartbeats);a.v=t.apiVersion;a.lib=t.libstring;void 0!==c.transportParams&&h.mixin(a,c.transportParams);return a};f.prototype.toString=function(){var a="[mode="+this.mode;this.host&&(a+=",host="+this.host);this.connectionKey&&(a+=",connectionKey="+this.connectionKey);void 0!==this.connectionSerial&&(a+=",connectionSerial="+this.connectionSerial);this.timeSerial&&(a+=",timeSerial="+this.timeSerial);this.format&&(a+=",format="+this.format);return a+"]"};h.inherits(a,B);a.supportedTransports=
{};a.prototype.createTransportParams=function(a,c){var g=new f(this.options,a,c,this.connectionKey);this.timeSerial?g.timeSerial=this.timeSerial:void 0!==this.connectionSerial&&(g.connectionSerial=this.connectionSerial);return g};a.prototype.getTransportParams=function(a){var c=this;(function(a){if(c.connectionKey)a("resume");else if("string"===typeof c.options.recover)a("recover");else{var g=c.options.recover,b=n&&L.getSession("ably-connection-recovery");b&&"function"===typeof g?(d.logAction(d.LOG_MINOR,
"ConnectionManager.getTransportParams()","Calling clientOptions-provided recover function with last session data"),g(b,function(g){g?(c.options.recover=b.recoveryKey,a("recover")):a("clean")})):a("clean")}})(function(g){var b=c.createTransportParams(null,g);"recover"===g?(d.logAction(d.LOG_MINOR,"ConnectionManager.getTransportParams()","Transport recovery mode = recover; recoveryKey = "+c.options.recover),(g=c.options.recover.split(":"))&&g[2]&&(c.msgSerial=g[2])):d.logAction(d.LOG_MINOR,"ConnectionManager.getTransportParams()",
"Transport params = "+b.toString());a(b)})};a.prototype.tryATransport=function(c,b,e){var g=this;d.logAction(d.LOG_MICRO,"ConnectionManager.tryATransport()","trying "+b);a.supportedTransports[b].tryConnect(this,this.realtime.auth,c,function(a,f){var k=g.state;k==g.states.closing||k==g.states.closed||k==g.states.failed?(f&&(d.logAction(d.LOG_MINOR,"ConnectionManager.tryATransport()","connection "+k.state+" while we were attempting the transport; closing "+f),f.close()),e(!0)):a?(d.logAction(d.LOG_MINOR,
"ConnectionManager.tryATransport()","transport "+b+" "+a.event+", err: "+a.error.toString()),O.isTokenErr(a.error)?g.realtime.auth._forceNewToken(null,null,function(a){a?g.actOnErrorFromAuthorize(a):g.tryATransport(c,b,e)}):"failed"===a.event?(g.notifyState({state:"failed",error:a.error}),e(!0)):"disconnected"===a.event&&e(!1)):(d.logAction(d.LOG_MICRO,"ConnectionManager.tryATransport()","viable transport "+b+"; setting pending"),g.setTransportPending(f,c),e(null,f))})};a.prototype.setTransportPending=
function(a,c){var b=c.mode;d.logAction(d.LOG_MINOR,"ConnectionManager.setTransportPending()","transport = "+a+"; mode = "+b);h.arrDeleteValue(this.proposedTransports,a);this.pendingTransports.push(a);var g=this;a.once("connected",function(e,d,f,p){"upgrade"==b&&g.activeProtocol?a.shortName!==k&&h.arrIn(g.getUpgradePossibilities(),k)?setTimeout(function(){g.scheduleTransportActivation(e,a,d,f,p)},g.options.timeouts.parallelUpgradeDelay):g.scheduleTransportActivation(e,a,d,f,p):(g.activateTransport(e,
a,d,f,p),h.nextTick(function(){g.connectImpl(c)}));"recover"===b&&g.options.recover&&(g.options.recover=null,g.unpersistConnection())});a.on(["disconnected","closed","failed"],function(c){g.deactivateTransport(a,this.event,c)});this.emit("transport.pending",a)};a.prototype.scheduleTransportActivation=function(a,c,b,e,f){function g(){c.disconnect();h.arrDeleteValue(k.pendingTransports,c)}var k=this,p=this.activeProtocol&&this.activeProtocol.getTransport();this.state!==this.states.connected&&this.state!==
this.states.connecting?(d.logAction(d.LOG_MINOR,"ConnectionManager.scheduleTransportActivation()","Current connection state ("+this.state.state+(this.state===this.states.synchronizing?", but with an upgrade already in progress":"")+") is not valid to upgrade in; abandoning upgrade to "+c.shortName),g()):p&&!l(c,p)?(d.logAction(d.LOG_MINOR,"ConnectionManager.scheduleTransportActivation()","Proposed transport "+c.shortName+" is no better than current active transport "+p.shortName+" - abandoning upgrade"),
g()):(d.logAction(d.LOG_MINOR,"ConnectionManager.scheduleTransportActivation()","Scheduling transport upgrade; transport = "+c),this.realtime.channels.onceNopending(function(p){if(p)d.logAction(d.LOG_ERROR,"ConnectionManager.scheduleTransportActivation()","Unable to activate transport; transport = "+c+"; err = "+p);else if(c.isConnected){if(k.state===k.states.connected){d.logAction(d.LOG_MICRO,"ConnectionManager.scheduleTransportActivation()","Currently connected, so temporarily pausing events until the upgrade is complete");
k.state=k.states.synchronizing;var m=k.activeProtocol}else if(k.state!==k.states.connecting){d.logAction(d.LOG_MINOR,"ConnectionManager.scheduleTransportActivation()","Current connection state ("+k.state.state+(k.state===k.states.synchronizing?", but with an upgrade already in progress":"")+") is not valid to upgrade in; abandoning upgrade to "+c.shortName);g();return}var n=(p=b!==k.connectionId)?f:k;p&&d.logAction(d.LOG_ERROR,"ConnectionManager.scheduleTransportActivation()","Upgrade resulted in new connectionId; resetting library connection position from "+
(k.timeSerial||k.connectionSerial)+" to "+(n.timeSerial||n.connectionSerial)+"; upgrade error was "+a);d.logAction(d.LOG_MINOR,"ConnectionManager.scheduleTransportActivation()","Syncing transport; transport = "+c);k.sync(c,n,function(g,b,f){if(g)k.state===k.states.synchronizing&&(d.logAction(d.LOG_ERROR,"ConnectionManager.scheduleTransportActivation()","Unexpected error attempting to sync transport; transport = "+c+"; err = "+g),k.disconnectAllTransports());else if(g=function(){d.logAction(d.LOG_MINOR,
"ConnectionManager.scheduleTransportActivation()","Activating transport; transport = "+c);k.activateTransport(a,c,b,e,f);k.state===k.states.synchronizing?(d.logAction(d.LOG_MICRO,"ConnectionManager.scheduleTransportActivation()","Pre-upgrade protocol idle, sending queued messages on upgraded transport; transport = "+c),k.state=k.states.connected):d.logAction(d.LOG_MINOR,"ConnectionManager.scheduleTransportActivation()","Pre-upgrade protocol idle, but state is now "+k.state.state+", so leaving unchanged");
k.state.sendEvents&&k.sendQueuedMessages()},m)m.onceIdle(g);else g()})}else d.logAction(d.LOG_MINOR,"ConnectionManager.scheduleTransportActivation()","Proposed transport "+c.shortName+"is no longer connected; abandoning upgrade"),g()}))};a.prototype.activateTransport=function(a,c,b,e,f){d.logAction(d.LOG_MINOR,"ConnectionManager.activateTransport()","transport = "+c);a&&d.logAction(d.LOG_ERROR,"ConnectionManager.activateTransport()","error = "+a);b&&d.logAction(d.LOG_MICRO,"ConnectionManager.activateTransport()",
"connectionId =  "+b);e&&d.logAction(d.LOG_MICRO,"ConnectionManager.activateTransport()","connectionDetails =  "+JSON.stringify(e));f&&d.logAction(d.LOG_MICRO,"ConnectionManager.activateTransport()","serial =  "+(f.timeSerial||f.connectionSerial));this.persistTransportPreference(c);var g=this.state,k=this.states.connected.state;d.logAction(d.LOG_MINOR,"ConnectionManager.activateTransport()","current state = "+g.state);if(g.state==this.states.closing.state||g.state==this.states.closed.state||g.state==
this.states.failed.state)return d.logAction(d.LOG_MINOR,"ConnectionManager.activateTransport()","Disconnecting transport and abandoning"),c.disconnect(),!1;h.arrDeleteValue(this.pendingTransports,c);if(!c.isConnected)return d.logAction(d.LOG_MINOR,"ConnectionManager.activateTransport()","Declining to activate transport "+c+" since it appears to no longer be connected"),!1;var m=this.activeProtocol;this.activeProtocol=new ja(c);this.host=c.params.host;var p=e.connectionKey;p&&this.connectionKey!=p&&
this.setConnection(b,e,f,!!a);this.onConnectionDetailsUpdate(e,c);var n=this;h.nextTick(function(){c.on("connected",function(a,g,b){n.onConnectionDetailsUpdate(b,c);n.emit("update",new V(k,k,null,a))})});g.state===this.states.connected.state?a&&(this.errorReason=this.realtime.connection.errorReason=a,this.emit("update",new V(k,k,null,a))):(this.notifyState({state:"connected",error:a}),this.errorReason=this.realtime.connection.errorReason=a||null);this.emit("transport.active",c);m&&(0<m.messageQueue.count()&&
d.logAction(d.LOG_ERROR,"ConnectionManager.activateTransport()","Previous active protocol (for transport "+m.transport.shortName+", new one is "+c.shortName+") finishing with "+m.messageQueue.count()+" messages still pending"),m.transport===c?d.logAction(d.LOG_ERROR,"ConnectionManager.activateTransport()","Assumption violated: activating a transport that was also the transport for the previous active protocol, stack = "+Error().stack):m.finish());h.safeArrForEach(this.pendingTransports,function(a){a===
c?(d.logAction(d.LOG_ERROR,"ConnectionManager.activateTransport()","Assumption violated: activating a transport that is still marked as a pending transport, stack = "+Error().stack),h.arrDeleteValue(n.pendingTransports,c)):a.disconnect()});h.safeArrForEach(this.proposedTransports,function(a){a===c?(d.logAction(d.LOG_ERROR,"ConnectionManager.activateTransport()","Assumption violated: activating a transport that is still marked as a proposed transport, stack = "+Error().stack),h.arrDeleteValue(n.proposedTransports,
c)):a.dispose()});return!0};a.prototype.deactivateTransport=function(a,c,b){var g=this.activeProtocol,e=g&&g.getTransport()===a,f=h.arrDeleteValue(this.pendingTransports,a),k=h.arrDeleteValue(this.proposedTransports,a),m=this.noTransportsScheduledForActivation();d.logAction(d.LOG_MINOR,"ConnectionManager.deactivateTransport()","transport = "+a);d.logAction(d.LOG_MINOR,"ConnectionManager.deactivateTransport()","state = "+c+(e?"; was active":f?"; was pending":k?"; was proposed":"")+(m?"":"; another transport is scheduled for activation"));
b&&b.message&&d.logAction(d.LOG_MICRO,"ConnectionManager.deactivateTransport()","reason =  "+b.message);e&&(d.logAction(d.LOG_MICRO,"ConnectionManager.deactivateTransport()","Getting, clearing, and requeuing "+this.activeProtocol.messageQueue.count()+" pending messages"),this.queuePendingMessages(g.getPendingMessages()),h.nextTick(function(){g.clearPendingMessages()}),this.activeProtocol=this.host=null);this.emit("transport.inactive",a);e&&m||e&&"failed"===c||"closed"===c||null===g&&f&&0===this.pendingTransports.length?
"disconnected"===c&&b&&500<b.statusCode&&1<this.httpHosts.length?(this.unpersistTransportPreference(),this.forceFallbackHost=!0,this.notifyState({state:c,error:b,retryImmediately:!0})):(a="failed"===c&&O.isTokenErr(b)?"disconnected":c,this.notifyState({state:a,error:b})):e&&"disconnected"===c&&this.state!==this.states.synchronizing&&(d.logAction(d.LOG_MICRO,"ConnectionManager.deactivateTransport()","wasActive but another transport is connected and scheduled for activation, so going into the connecting state until it activates"),
this.startSuspendTimer(),this.startTransitionTimer(this.states.connecting),this.notifyState({state:"connecting",error:b}))};a.prototype.noTransportsScheduledForActivation=function(){return h.isEmpty(this.pendingTransports)||this.pendingTransports.every(function(a){return!a.isConnected})};a.prototype.sync=function(a,c,b){var g=setTimeout(function(){a.off("sync");b(new q("Timeout waiting for sync response",5E4,500))},this.options.timeouts.realtimeRequestTimeout),d=A.fromValues({action:e.SYNC,connectionKey:this.connectionKey});
c.timeSerial?d.timeSerial=c.timeSerial:void 0!==c.connectionSerial&&(d.connectionSerial=c.connectionSerial);a.send(d);a.once("sync",function(a,c){clearTimeout(g);b(null,a,c)})};a.prototype.setConnection=function(a,c,b,e){var g=this,f=this.connectionid,k=f&&f!==a;if(k||!f&&e)d.logAction(d.LOG_MINOR,"ConnectionManager.setConnection()","Resetting msgSerial"),this.msgSerial=0;this.connectionId!==a&&(d.logAction(d.LOG_MINOR,"ConnectionManager.setConnection()","New connectionId; reattaching any attached channels"),
h.nextTick(function(){g.realtime.channels.reattach()}));this.realtime.connection.id=this.connectionId=a;this.realtime.connection.key=this.connectionKey=c.connectionKey;this.setConnectionSerial(b,k||!f)};a.prototype.clearConnection=function(){this.realtime.connection.id=this.connectionId=void 0;this.realtime.connection.key=this.connectionKey=void 0;this.clearConnectionSerial();this.msgSerial=0;this.unpersistConnection()};a.prototype.setConnectionSerial=function(a,c){var b=a.timeSerial,g=a.connectionSerial;
d.logAction(d.LOG_MICRO,"ConnectionManager.setConnectionSerial()","Updating connection serial; serial = "+g+"; timeSerial = "+b+"; force = "+c+"; previous = "+this.connectionSerial);if(void 0!==b){if(b<=this.timeSerial&&!c)return d.logAction(d.LOG_ERROR,"ConnectionManager.setConnectionSerial()","received message with timeSerial "+b+", but current timeSerial is "+this.timeSerial+"; assuming message is a duplicate and discarding it"),!0;this.realtime.connection.timeSerial=this.timeSerial=b;this.setRecoveryKey()}else if(void 0!==
g){if(g<=this.connectionSerial&&!c)return d.logAction(d.LOG_ERROR,"ConnectionManager.setConnectionSerial()","received message with connectionSerial "+g+", but current connectionSerial is "+this.connectionSerial+"; assuming message is a duplicate and discarding it"),!0;this.realtime.connection.serial=this.connectionSerial=g;this.setRecoveryKey()}};a.prototype.clearConnectionSerial=function(){this.realtime.connection.serial=this.connectionSerial=void 0;this.realtime.connection.timeSerial=this.timeSerial=
void 0;this.clearRecoveryKey()};a.prototype.setRecoveryKey=function(){this.realtime.connection.recoveryKey=this.connectionKey+":"+(this.timeSerial||this.connectionSerial)+":"+this.msgSerial};a.prototype.clearRecoveryKey=function(){this.realtime.connection.recoveryKey=null};a.prototype.checkConnectionStateFreshness=function(){if(this.lastActivity&&this.connectionId){var a=h.now()-this.lastActivity;a>this.connectionStateTtl+this.maxIdleInterval&&(d.logAction(d.LOG_MINOR,"ConnectionManager.checkConnectionStateFreshness()",
"Last known activity from realtime was "+a+"ms ago; discarding connection state"),this.clearConnection(),this.states.connecting.failState="suspended",this.states.connecting.queueEvents=!1)}};a.prototype.persistConnection=function(){if(n){var a=this.realtime.connection.recoveryKey;a&&(a={recoveryKey:a,disconnectedAt:h.now(),location:u.location,clientId:this.realtime.auth.clientId},n&&L.setSession("ably-connection-recovery",a))}};a.prototype.unpersistConnection=function(){n&&L.removeSession("ably-connection-recovery")};
a.prototype.getError=function(){return this.errorReason||this.getStateError()};a.prototype.getStateError=function(){return M[this.state.state]};a.prototype.activeState=function(){return this.state.queueEvents||this.state.sendEvents};a.prototype.enactStateChange=function(a){d.logAction("failed"===a.current?d.LOG_ERROR:d.LOG_MAJOR,"Connection state",a.current+(a.reason?"; reason: "+a.reason:""));d.logAction(d.LOG_MINOR,"ConnectionManager.enactStateChange","setting new state: "+a.current+"; reason = "+
(a.reason&&a.reason.message));var c=this.state=this.states[a.current];a.reason&&(this.errorReason=a.reason,this.realtime.connection.errorReason=a.reason);(c.terminal||"suspended"===c.state)&&this.clearConnection();this.emit("connectionstate",a)};a.prototype.startTransitionTimer=function(a){d.logAction(d.LOG_MINOR,"ConnectionManager.startTransitionTimer()","transitionState: "+a.state);this.transitionTimer&&(d.logAction(d.LOG_MINOR,"ConnectionManager.startTransitionTimer()","clearing already-running timer"),
clearTimeout(this.transitionTimer));var c=this;this.transitionTimer=setTimeout(function(){c.transitionTimer&&(c.transitionTimer=null,d.logAction(d.LOG_MINOR,"ConnectionManager "+a.state+" timer expired","requesting new state: "+a.failState),c.notifyState({state:a.failState}))},a.retryDelay)};a.prototype.cancelTransitionTimer=function(){d.logAction(d.LOG_MINOR,"ConnectionManager.cancelTransitionTimer()","");this.transitionTimer&&(clearTimeout(this.transitionTimer),this.transitionTimer=null)};a.prototype.startSuspendTimer=
function(){var a=this;this.suspendTimer||(this.suspendTimer=setTimeout(function(){a.suspendTimer&&(a.suspendTimer=null,d.logAction(d.LOG_MINOR,"ConnectionManager suspend timer expired","requesting new state: suspended"),a.states.connecting.failState="suspended",a.states.connecting.queueEvents=!1,a.notifyState({state:"suspended"}))},this.connectionStateTtl))};a.prototype.checkSuspendTimer=function(a){"disconnected"!==a&&"suspended"!==a&&"connecting"!==a&&this.cancelSuspendTimer()};a.prototype.cancelSuspendTimer=
function(){this.states.connecting.failState="disconnected";this.states.connecting.queueEvents=!0;this.suspendTimer&&(clearTimeout(this.suspendTimer),this.suspendTimer=null)};a.prototype.startRetryTimer=function(a){var c=this;this.retryTimer=setTimeout(function(){d.logAction(d.LOG_MINOR,"ConnectionManager retry timer expired","retrying");c.retryTimer=null;c.requestState({state:"connecting"})},a)};a.prototype.cancelRetryTimer=function(){this.retryTimer&&(clearTimeout(this.retryTimer),this.retryTimer=
null)};a.prototype.notifyState=function(a){var c=a.state,b=this,g="disconnected"===c&&(this.state===this.states.connected||this.state===this.states.synchronizing||a.retryImmediately||this.state===this.states.connecting&&a.error&&O.isTokenErr(a.error)&&!(this.errorReason&&O.isTokenErr(this.errorReason)));d.logAction(d.LOG_MINOR,"ConnectionManager.notifyState()","new state: "+c+(g?"; will retry connection immediately":""));if(c!=this.state.state&&(this.cancelTransitionTimer(),this.cancelRetryTimer(),
this.checkSuspendTimer(a.state),!this.state.terminal)){var e=this.states[a.state];a=new V(this.state.state,e.state,e.retryDelay,a.error||M[e.state]);if(g){var f=function(){b.state===b.states.disconnected&&(b.lastAutoReconnectAttempt=h.now(),b.requestState({state:"connecting"}))},k=this.lastAutoReconnectAttempt&&h.now()-this.lastAutoReconnectAttempt+1;k&&1E3>k?(d.logAction(d.LOG_MICRO,"ConnectionManager.notifyState()","Last reconnect attempt was only "+k+"ms ago, waiting another "+(1E3-k)+"ms before trying again"),
setTimeout(f,1E3-k)):h.nextTick(f)}else"disconnected"!==c&&"suspended"!==c||this.startRetryTimer(e.retryDelay);("disconnected"===c&&!g||"suspended"===c||e.terminal)&&h.nextTick(function(){b.disconnectAllTransports()});"connected"!=c||this.activeProtocol||d.logAction(d.LOG_ERROR,"ConnectionManager.notifyState()","Broken invariant: attempted to go into connected state, but there is no active protocol");this.enactStateChange(a);this.state.sendEvents?this.sendQueuedMessages():this.state.queueEvents||
(this.realtime.channels.propogateConnectionInterruption(c,a.reason),this.failQueuedMessages(a.reason))}};a.prototype.requestState=function(a){var c=a.state,b=this;d.logAction(d.LOG_MINOR,"ConnectionManager.requestState()","requested state: "+c+"; current state: "+this.state.state);if(c!=this.state.state&&(this.cancelTransitionTimer(),this.cancelRetryTimer(),this.checkSuspendTimer(c),"connecting"!=c||"connected"!=this.state.state)&&("closing"!=c||"closed"!=this.state.state)){var g=this.states[c];a=
new V(this.state.state,g.state,null,a.error||M[g.state]);this.enactStateChange(a);"connecting"==c&&h.nextTick(function(){b.startConnect()});"closing"==c&&this.closeImpl()}};a.prototype.startConnect=function(){if(this.state!==this.states.connecting)d.logAction(d.LOG_MINOR,"ConnectionManager.startConnect()","Must be in connecting state to connect, but was "+this.state.state);else{var a=this.realtime.auth,c=this,b=++this.connectCounter,e=function(){c.checkConnectionStateFreshness();c.getTransportParams(function(a){b===
c.connectCounter&&c.connectImpl(a,b)})};d.logAction(d.LOG_MINOR,"ConnectionManager.startConnect()","starting connection");this.startSuspendTimer();this.startTransitionTimer(this.states.connecting);if("basic"===a.method)e();else{var f=function(a){b===c.connectCounter&&(a?c.actOnErrorFromAuthorize(a):e())};this.errorReason&&O.isTokenErr(this.errorReason)?a._forceNewToken(null,null,f):a._ensureValidAuthCredentials(!1,f)}}};a.prototype.connectImpl=function(a,c){var b=this.state.state;b!==this.states.connecting.state&&
b!==this.states.connected.state?d.logAction(d.LOG_MINOR,"ConnectionManager.connectImpl()","Must be in connecting state to connect (or connected to upgrade), but was "+b):this.pendingTransports.length?d.logAction(d.LOG_MINOR,"ConnectionManager.connectImpl()","Transports "+this.pendingTransports[0].toString()+" currently pending; taking no action"):b==this.states.connected.state?this.upgradeIfNeeded(a):1<this.transports.length&&this.getTransportPreference()?this.connectPreference(a):this.connectBase(a,
c)};a.prototype.connectPreference=function(a){var c=this.getTransportPreference(),b=this,g=!1;h.arrIn(this.transports,c)||(this.unpersistTransportPreference(),this.connectImpl(a));d.logAction(d.LOG_MINOR,"ConnectionManager.connectPreference()","Trying to connect with stored transport preference "+c);var e=setTimeout(function(){g=!0;b.state.state!==b.states.connected.state&&(d.logAction(d.LOG_MINOR,"ConnectionManager.connectPreference()","Shortcircuit connection attempt with "+c+" failed; clearing preference and trying from scratch"),
b.disconnectAllTransports(),b.unpersistTransportPreference());b.connectImpl(a)},this.options.timeouts.preferenceConnectTimeout);a.host=b.httpHosts[0];b.tryATransport(a,c,function(c,d){clearTimeout(e);g&&d?(d.off(),d.disconnect(),h.arrDeleteValue(this.pendingTransports,d)):d||c||(b.unpersistTransportPreference(),b.connectImpl(a))})};a.prototype.connectBase=function(a,c){function b(a,b){c===f.connectCounter&&(b||a||e())}function g(a){f.notifyState({state:f.states.connecting.failState,error:a})}function e(){k.length?
y.checkConnectivity(function(e,d){c===f.connectCounter&&(e?g(e):d?(a.host=h.arrPopRandomElement(k),f.tryATransport(a,f.baseTransport,b)):g(new q("Unable to connect (network unreachable)",80003,404)))}):g(new q("Unable to connect (and no more fallback hosts to try)",80003,404))}var f=this,k=this.httpHosts.slice();d.logAction(d.LOG_MINOR,"ConnectionManager.connectBase()","Trying to connect with base transport "+this.baseTransport);var m=k.shift();m?(a.host=m,this.forceFallbackHost&&k.length?(this.forceFallbackHost=
!1,e()):this.tryATransport(a,this.baseTransport,b)):g(new q("Unable to connect (no available host)",80003,404))};a.prototype.getUpgradePossibilities=function(){var a=this.activeProtocol.getTransport().shortName;a=h.arrIndexOf(this.upgradeTransports,a);return this.upgradeTransports.slice(a+1)};a.prototype.upgradeIfNeeded=function(a){var c=this.getUpgradePossibilities(),g=this;d.logAction(d.LOG_MINOR,"ConnectionManager.upgradeIfNeeded()","upgrade possibilities: "+h.inspect(c));c.length&&h.arrForEach(c,
function(c){var e=g.createTransportParams(a.host,"upgrade");g.tryATransport(e,c,b)})};a.prototype.closeImpl=function(){d.logAction(d.LOG_MINOR,"ConnectionManager.closeImpl()","closing connection");this.cancelSuspendTimer();this.startTransitionTimer(this.states.closing);h.safeArrForEach(this.pendingTransports,function(a){d.logAction(d.LOG_MICRO,"ConnectionManager.closeImpl()","Closing pending transport: "+a);a&&a.close()});h.safeArrForEach(this.proposedTransports,function(a){d.logAction(d.LOG_MICRO,
"ConnectionManager.closeImpl()","Disposing of proposed transport: "+a);a&&a.dispose()});this.activeProtocol&&(d.logAction(d.LOG_MICRO,"ConnectionManager.closeImpl()","Closing active transport: "+this.activeProtocol.getTransport()),this.activeProtocol.getTransport().close());this.notifyState({state:"closed"})};a.prototype.onAuthUpdated=function(a,c){var b=this;switch(this.state.state){case "connected":d.logAction(d.LOG_MICRO,"ConnectionManager.onAuthUpdated()","Sending AUTH message on active transport");
if((this.pendingTransports.length||this.proposedTransports.length)&&b.state!==b.states.synchronizing){this.disconnectAllTransports(!0);var g=this.activeProtocol.getTransport().params;h.nextTick(function(){"connected"===b.state.state&&b.upgradeIfNeeded(g)})}this.activeProtocol.getTransport().onAuthUpdated(a);var f=A.fromValues({action:e.AUTH,auth:{accessToken:a.token}});this.send(f);var k=function(){b.off(m);c(null,a)},m=function(a){"failed"===a.current&&(b.off(k),b.off(m),c(a.reason||b.getStateError()))};
this.once("connectiondetails",k);this.on("connectionstate",m);break;case "connecting":d.logAction(d.LOG_MICRO,"ConnectionManager.onAuthUpdated()","Aborting current connection attempts in order to start again with the new auth details"),this.disconnectAllTransports();default:d.logAction(d.LOG_MICRO,"ConnectionManager.onAuthUpdated()","Connection state is "+this.state.state+"; waiting until either connected or failed");var n=function(e){switch(e.current){case "connected":b.off(n);c(null,a);break;case "failed":case "closed":case "suspended":b.off(n),
c(e.reason||b.getStateError())}};b.on("connectionstate",n);"connecting"===this.state.state?b.startConnect():b.requestState({state:"connecting"})}};a.prototype.disconnectAllTransports=function(a){d.logAction(d.LOG_MINOR,"ConnectionManager.disconnectAllTransports()","Disconnecting all transports"+(a?" except the active transport":""));this.connectCounter++;h.safeArrForEach(this.pendingTransports,function(a){d.logAction(d.LOG_MICRO,"ConnectionManager.disconnectAllTransports()","Disconnecting pending transport: "+
a);a&&a.disconnect()});this.pendingTransports=[];h.safeArrForEach(this.proposedTransports,function(a){d.logAction(d.LOG_MICRO,"ConnectionManager.disconnectAllTransports()","Disposing of proposed transport: "+a);a&&a.dispose()});this.proposedTransports=[];this.activeProtocol&&!a&&(d.logAction(d.LOG_MICRO,"ConnectionManager.disconnectAllTransports()","Disconnecting active transport: "+this.activeProtocol.getTransport()),this.activeProtocol.getTransport().disconnect())};a.prototype.send=function(a,c,
e){e=e||b;var g=this.state;g.sendEvents?(d.logAction(d.LOG_MICRO,"ConnectionManager.send()","sending event"),this.sendImpl(new m(a,e))):c&&g.queueEvents||g.forceQueueEvents?(d.shouldLog(d.LOG_MICRO)&&d.logAction(d.LOG_MICRO,"ConnectionManager.send()","queueing msg; "+A.stringify(a)),this.queue(a,e)):(a="rejecting event, queueEvent was "+c+", state was "+g.state,d.logAction(d.LOG_MICRO,"ConnectionManager.send()",a),e(this.errorReason||new q(a,9E4,400)))};a.prototype.sendImpl=function(a){var c=a.message;
a.ackRequired&&!a.sendAttempted&&(c.msgSerial=this.msgSerial++,this.setRecoveryKey());try{this.activeProtocol.send(a)}catch(x){d.logAction(d.LOG_ERROR,"ConnectionManager.sendImpl()","Unexpected exception in transport.send(): "+x.stack)}};a.prototype.queue=function(a,c){d.logAction(d.LOG_MICRO,"ConnectionManager.queue()","queueing event");var b=this.queuedMessages.last(),g=this.options.maxMessageSize,f;if(f=b&&!b.sendAttempted){f=b.message;var k;if(f.channel!==a.channel||(k=f.action)!==e.PRESENCE&&
k!==e.MESSAGE||k!==a.action)f=!1;else{k=k===e.PRESENCE?"presence":"messages";var n=f[k].concat(a[k]);D.getMessagesSize(n)>g||!h.allSame(n,"clientId")?f=!1:(f[k]=n,f=!0)}}f?(b.merged||(b.callback=ba([b.callback]),b.merged=!0),b.callback.push(c)):this.queuedMessages.push(new m(a,c))};a.prototype.sendQueuedMessages=function(){d.logAction(d.LOG_MICRO,"ConnectionManager.sendQueuedMessages()","sending "+this.queuedMessages.count()+" queued messages");for(var a;a=this.queuedMessages.shift();)this.sendImpl(a)};
a.prototype.queuePendingMessages=function(a){a&&a.length&&(d.logAction(d.LOG_MICRO,"ConnectionManager.queuePendingMessages()","queueing "+a.length+" pending messages"),this.queuedMessages.prepend(a))};a.prototype.failQueuedMessages=function(a){var c=this.queuedMessages.count();0<c&&(d.logAction(d.LOG_ERROR,"ConnectionManager.failQueuedMessages()","failing "+c+" queued messages, err = "+h.inspectError(a)),this.queuedMessages.completeAllMessages(a))};a.prototype.onChannelMessage=function(a,c){var b=
this.activeProtocol&&c===this.activeProtocol.getTransport(),g=h.arrIn(this.pendingTransports,c)&&this.state==this.states.synchronizing,f=a.action===e.MESSAGE||a.action===e.PRESENCE;if(b||g){if(f){if(this.setConnectionSerial(a))return;if(A.isDuplicate(a,this.mostRecentMsg)){d.logAction(d.LOG_ERROR,"ConnectionManager.onChannelMessage()","received message with different connectionSerial, but same message id as a previous; discarding; id = "+a.id);return}this.mostRecentMsg=a}this.realtime.channels.onChannelMessage(a)}else if(-1<
h.arrIndexOf([e.ACK,e.NACK,e.ERROR],a.action))this.realtime.channels.onChannelMessage(a);else d.logAction(d.LOG_MICRO,"ConnectionManager.onChannelMessage()","received message "+JSON.stringify(a)+"on defunct transport; discarding")};a.prototype.ping=function(a,c){if(a){d.logAction(d.LOG_MINOR,"ConnectionManager.ping()","transport = "+a);var b=h.now(),e=h.cheapRandStr(),g=function(d){d===e&&(a.off("heartbeat",g),clearTimeout(f),d=h.now()-b,c(null,d))},f=setTimeout(function(){a.off("heartbeat",g);c(new q("Timeout waiting for heartbeat response",
5E4,500))},this.options.timeouts.realtimeRequestTimeout);a.on("heartbeat",g);a.ping(e)}else if("connected"!==this.state.state)c(new q("Unable to ping service; not connected",4E4,400));else{var k=!1,m=this,n=function(){k||(k=!0,h.nextTick(function(){m.ping(null,c)}))};this.on("transport.active",n);this.ping(this.activeProtocol.getTransport(),function(a,b){m.off("transport.active",n);k||(k=!0,c(a,b))})}};a.prototype.abort=function(a){this.activeProtocol.getTransport().fail(a)};a.prototype.registerProposedTransport=
function(a){this.proposedTransports.push(a)};a.prototype.getTransportPreference=function(){return this.transportPreference||c&&L.get("ably-transport-preference")};a.prototype.persistTransportPreference=function(a){h.arrIn(t.upgradeTransports,a.shortName)&&(this.transportPreference=a.shortName,c&&L.set("ably-transport-preference",a.shortName))};a.prototype.unpersistTransportPreference=function(){this.transportPreference=null;c&&L.remove("ably-transport-preference")};a.prototype.actOnErrorFromAuthorize=
function(a){if(40171===a.code)this.notifyState({state:"failed",error:a});else if(403===a.statusCode){var c="Client configured authentication provider returned 403; failing the connection";d.logAction(d.LOG_ERROR,"ConnectionManager.actOnErrorFromAuthorize()",c);this.notifyState({state:"failed",error:new q(c,80019,403,a)})}else c="Client configured authentication provider request failed",d.logAction(d.LOG_MINOR,"ConnectionManager.actOnErrorFromAuthorize",c),this.notifyState({state:this.state.failState,
error:new q(c,80019,401,a)})};a.prototype.onConnectionDetailsUpdate=function(a,c){if(a){this.connectionDetails=a;this.options.maxMessageSize=a.maxMessageSize;var b=a.clientId;if(b&&(b=this.realtime.auth._uncheckedSetClientId(b))){d.logAction(d.LOG_ERROR,"ConnectionManager.onConnectionDetailsUpdate()",b.message);c.fail(b);return}if(b=a.connectionStateTtl)this.connectionStateTtl=b;this.maxIdleInterval=a.maxIdleInterval;this.emit("connectiondetails",a)}};return a}(),R=function(){function b(a,b,e){B.call(this);
this.connectionManager=a;a.registerProposedTransport(this);this.auth=b;this.params=e;this.timeouts=e.options.timeouts;this.format=e.format;this.isDisposed=this.isFinished=this.isConnected=!1;this.lastActivity=this.idleTimer=this.maxIdleInterval=null}var l=A.Action,f=A.fromValues({action:l.CLOSE}),a=A.fromValues({action:l.DISCONNECT});h.inherits(b,B);b.prototype.connect=function(){};b.prototype.close=function(){this.isConnected&&this.requestClose();this.finish("closed",M.closed)};b.prototype.disconnect=
function(a){this.isConnected&&this.requestDisconnect();this.finish("disconnected",a||M.disconnected)};b.prototype.fail=function(a){this.isConnected&&this.requestDisconnect();this.finish("failed",a||M.failed)};b.prototype.finish=function(a,b){this.isFinished||(this.isFinished=!0,this.isConnected=!1,this.maxIdleInterval=null,clearTimeout(this.idleTimer),this.idleTimer=null,this.emit(a,b),this.dispose())};b.prototype.onProtocolMessage=function(a){d.shouldLog(d.LOG_MICRO)&&d.logAction(d.LOG_MICRO,"Transport.onProtocolMessage()",
"received on "+this.shortName+": "+A.stringify(a)+"; connectionId = "+this.connectionManager.connectionId);this.onActivity();switch(a.action){case l.HEARTBEAT:d.logAction(d.LOG_MICRO,"Transport.onProtocolMessage()",this.shortName+" heartbeat; connectionId = "+this.connectionManager.connectionId);this.emit("heartbeat",a.id);break;case l.CONNECTED:this.onConnect(a);this.emit("connected",a.error,a.connectionId,a.connectionDetails,a);break;case l.CLOSED:this.onClose(a);break;case l.DISCONNECTED:this.onDisconnect(a);
break;case l.ACK:this.emit("ack",a.msgSerial,a.count);break;case l.NACK:this.emit("nack",a.msgSerial,a.count,a.error);break;case l.SYNC:if(void 0!==a.connectionId){this.emit("sync",a.connectionId,a);break}this.connectionManager.onChannelMessage(a,this);break;case l.AUTH:this.auth.authorize(function(a){a&&d.logAction(d.LOG_ERROR,"Transport.onProtocolMessage()","Ably requested re-authentication, but unable to obtain a new token: "+h.inspectError(a))});break;case l.ERROR:d.logAction(d.LOG_MINOR,"Transport.onProtocolMessage()",
"received error action; connectionId = "+this.connectionManager.connectionId+"; err = "+h.inspect(a.error)+(a.channel?", channel: "+a.channel:""));if(void 0===a.channel){this.onFatalError(a);break}this.connectionManager.onChannelMessage(a,this);break;default:this.connectionManager.onChannelMessage(a,this)}};b.prototype.onConnect=function(a){this.isConnected=!0;if(a=a.connectionDetails.maxIdleInterval)this.maxIdleInterval=a+this.timeouts.realtimeRequestTimeout,this.onActivity()};b.prototype.onDisconnect=
function(a){a=a&&a.error;d.logAction(d.LOG_MINOR,"Transport.onDisconnect()","err = "+h.inspectError(a));this.finish("disconnected",a)};b.prototype.onFatalError=function(a){a=a&&a.error;d.logAction(d.LOG_MINOR,"Transport.onFatalError()","err = "+h.inspectError(a));this.finish("failed",a)};b.prototype.onClose=function(a){a=a&&a.error;d.logAction(d.LOG_MINOR,"Transport.onClose()","err = "+h.inspectError(a));this.finish("closed",a)};b.prototype.requestClose=function(){d.logAction(d.LOG_MINOR,"Transport.requestClose()",
"");this.send(f)};b.prototype.requestDisconnect=function(){d.logAction(d.LOG_MINOR,"Transport.requestDisconnect()","");this.send(a)};b.prototype.ping=function(a){var c={action:A.Action.HEARTBEAT};a&&(c.id=a);this.send(A.fromValues(c))};b.prototype.dispose=function(){d.logAction(d.LOG_MINOR,"Transport.dispose()","");this.isDisposed=!0;this.off()};b.prototype.onActivity=function(){this.maxIdleInterval&&(this.lastActivity=this.connectionManager.lastActivity=h.now(),this.setIdleTimer(this.maxIdleInterval+
100))};b.prototype.setIdleTimer=function(a){var c=this;this.idleTimer||(this.idleTimer=setTimeout(function(){c.onIdleTimerExpire()},a))};b.prototype.onIdleTimerExpire=function(){this.idleTimer=null;var a=h.now()-this.lastActivity,b=this.maxIdleInterval-a;0>=b?(a="No activity seen from realtime in "+a+"ms; assuming connection has dropped",d.logAction(d.LOG_ERROR,"Transport.onIdleTimerExpire()",a),this.disconnect(new q(a,80003,408))):this.setIdleTimer(b+100)};b.prototype.onAuthUpdated=function(){};
return b}();(function(){function b(b,a,c){this.shortName="web_socket";c.heartbeats=w.useProtocolHeartbeats;R.call(this,b,a,c);this.wsHost=t.getHost(c.options,c.host,!0)}var l=w.WebSocket;h.inherits(b,R);b.isAvailable=function(){return!!l};b.isAvailable()&&(P.supportedTransports.web_socket=b);b.tryConnect=function(f,a,c,n){function e(a){n({event:this.event,error:a})}var m=new b(f,a,c);m.on(["failed","disconnected"],e);m.on("wsopen",function(){d.logAction(d.LOG_MINOR,"WebSocketTransport.tryConnect()",
"viable transport "+m);m.off(["failed","disconnected"],e);n(null,m)});m.connect()};b.prototype.createWebSocket=function(b,a){var c=0;if(a)for(var d in a)b+=(c++?"&":"?")+d+"="+a[d];this.uri=b;return new l(b)};b.prototype.toString=function(){return"WebSocketTransport; uri="+this.uri};b.prototype.connect=function(){d.logAction(d.LOG_MINOR,"WebSocketTransport.connect()","starting");R.prototype.connect.call(this);var b=this,a=this.params,c=a.options,n=(c.tls?"wss://":"ws://")+this.wsHost+":"+t.getPort(c)+
"/";d.logAction(d.LOG_MINOR,"WebSocketTransport.connect()","uri: "+n);this.auth.getAuthParams(function(c,f){if(!b.isDisposed){var e="",k;for(k in f)e+=" "+k+": "+f[k]+";";d.logAction(d.LOG_MINOR,"WebSocketTransport.connect()","authParams:"+e+" err: "+c);if(c)b.disconnect(c);else{e=a.getConnectParams(f);try{var g=b.wsConnection=b.createWebSocket(n,e);g.binaryType=w.binaryType;g.onopen=function(){b.onWsOpen()};g.onclose=function(a){b.onWsClose(a)};g.onmessage=function(a){b.onWsData(a.data)};g.onerror=
function(a){b.onWsError(a)};if(g.on)g.on("ping",function(){b.onActivity()})}catch(p){d.logAction(d.LOG_ERROR,"WebSocketTransport.connect()","Unexpected exception creating websocket: err = "+(p.stack||p.message)),b.disconnect(p)}}}})};b.prototype.send=function(b){var a=this.wsConnection;if(a)try{a.send(A.serialize(b,this.params.format))}catch(c){b="Exception from ws connection when trying to send: "+h.inspectError(c),d.logAction(d.LOG_ERROR,"WebSocketTransport.send()",b),this.finish("disconnected",
new q(b,5E4,500))}else d.logAction(d.LOG_ERROR,"WebSocketTransport.send()","No socket connection")};b.prototype.onWsData=function(b){d.logAction(d.LOG_MICRO,"WebSocketTransport.onWsData()","data received; length = "+b.length+"; type = "+typeof b);try{this.onProtocolMessage(A.deserialize(b,this.format))}catch(a){d.logAction(d.LOG_ERROR,"WebSocketTransport.onWsData()","Unexpected exception handing channel message: "+a.stack)}};b.prototype.onWsOpen=function(){d.logAction(d.LOG_MINOR,"WebSocketTransport.onWsOpen()",
"opened WebSocket");this.emit("wsopen")};b.prototype.onWsClose=function(b){if("object"==typeof b){var a=b.wasClean;b=b.code}else a=1E3==b;delete this.wsConnection;a?(d.logAction(d.LOG_MINOR,"WebSocketTransport.onWsClose()","Cleanly closed WebSocket"),a=new q("Websocket closed",80003,400)):(b="Unclean disconnection of WebSocket ; code = "+b,a=new q(b,80003,400),d.logAction(d.LOG_MINOR,"WebSocketTransport.onWsClose()",b));this.finish("disconnected",a);this.emit("disposed")};b.prototype.onWsError=function(b){d.logAction(d.LOG_MINOR,
"WebSocketTransport.onError()","Error from WebSocket: "+b.message);var a=this;h.nextTick(function(){a.disconnect(b)})};b.prototype.dispose=function(){d.logAction(d.LOG_MINOR,"WebSocketTransport.dispose()","");this.isDisposed=!0;var b=this.wsConnection;b&&(b.onmessage=function(){},delete this.wsConnection,h.nextTick(function(){d.logAction(d.LOG_MICRO,"WebSocketTransport.dispose()","closing websocket");b.close()}))};return b})();var N=function(){function b(b){var a=[80015,80017,80030];return b.code&&
(O.isTokenErr(b)?0:h.arrIn(a,b.code)||4E4<=b.code&&5E4>b.code)?[A.fromValues({action:A.Action.ERROR,error:b})]:[A.fromValues({action:A.Action.DISCONNECTED,error:b})]}function l(b,a,c){c.format=void 0;c.heartbeats=!0;R.call(this,b,a,c);this.stream="stream"in c?c.stream:!0;this.pendingItems=this.pendingCallback=this.recvRequest=this.sendRequest=null}h.inherits(l,R);l.REQ_SEND=0;l.REQ_RECV=1;l.REQ_RECV_POLL=2;l.REQ_RECV_STREAM=3;l.prototype.connect=function(){d.logAction(d.LOG_MINOR,"CometTransport.connect()",
"starting");R.prototype.connect.call(this);var f=this,a=this.params,c=a.options;a=t.getHost(c,a.host);var n=t.getPort(c);this.baseUri=(c.tls?"https://":"http://")+a+":"+n+"/comet/";var e=this.baseUri+"connect";d.logAction(d.LOG_MINOR,"CometTransport.connect()","uri: "+e);this.auth.getAuthParams(function(a,c){if(a)f.disconnect(a);else if(!f.isDisposed){f.authParams=c;var k=f.params.getConnectParams(c);"stream"in k&&(f.stream=k.stream);d.logAction(d.LOG_MINOR,"CometTransport.connect()","connectParams:"+
h.toQueryString(k));var g=!1;k=f.recvRequest=f.createRequest(e,null,k,null,f.stream?3:1);k.on("data",function(a){f.recvRequest&&(g||(g=!0,f.emit("preconnect")),f.onData(a))});k.on("complete",function(a){f.recvRequest||(a=a||new q("Request cancelled",80003,400));f.recvRequest=null;f.onActivity();if(a)if(a.code)f.onData(b(a));else f.disconnect(a);else h.nextTick(function(){f.recv()})});k.exec()}})};l.prototype.requestClose=function(){d.logAction(d.LOG_MINOR,"CometTransport.requestClose()");this._requestCloseOrDisconnect(!0)};
l.prototype.requestDisconnect=function(){d.logAction(d.LOG_MINOR,"CometTransport.requestDisconnect()");this._requestCloseOrDisconnect(!1)};l.prototype._requestCloseOrDisconnect=function(b){var a=b?this.closeUri:this.disconnectUri;if(a){var c=this;a=this.createRequest(a,null,this.authParams,null,0);a.on("complete",function(a){a&&(d.logAction(d.LOG_ERROR,"CometTransport.request"+(b?"Close()":"Disconnect()"),"request returned err = "+h.inspectError(a)),c.finish("disconnected",a))});a.exec()}};l.prototype.dispose=
function(){d.logAction(d.LOG_MINOR,"CometTransport.dispose()","");if(!this.isDisposed){this.isDisposed=!0;this.recvRequest&&(d.logAction(d.LOG_MINOR,"CometTransport.dispose()","aborting recv request"),this.recvRequest.abort(),this.recvRequest=null);this.finish("disconnected",M.disconnected);var b=this;h.nextTick(function(){b.emit("disposed")})}};l.prototype.onConnect=function(b){if(!this.isDisposed){var a=b.connectionKey;R.prototype.onConnect.call(this,b);a=this.baseUri+a;d.logAction(d.LOG_MICRO,
"CometTransport.onConnect()","baseUri = "+a+"; connectionKey = "+b.connectionKey);this.sendUri=a+"/send";this.recvUri=a+"/recv";this.closeUri=a+"/close";this.disconnectUri=a+"/disconnect"}};l.prototype.send=function(b){if(this.sendRequest)this.pendingItems=this.pendingItems||[],this.pendingItems.push(b);else{var a=this.pendingItems||[];a.push(b);this.pendingItems=null;this.sendItems(a)}};l.prototype.sendAnyPending=function(){var b=this.pendingItems;b&&(this.pendingItems=null,this.sendItems(b))};l.prototype.sendItems=
function(f){var a=this;f=this.sendRequest=a.createRequest(a.sendUri,null,a.authParams,this.encodeRequest(f),0);f.on("complete",function(c,f){c&&d.logAction(d.LOG_ERROR,"CometTransport.sendItems()","on complete: err = "+h.inspectError(c));a.sendRequest=null;if(f)a.onData(f);else if(c&&c.code)a.onData(b(c));else a.disconnect(c);a.pendingItems&&h.nextTick(function(){a.sendRequest||a.sendAnyPending()})});f.exec()};l.prototype.recv=function(){if(!this.recvRequest&&this.isConnected){var d=this,a=this.recvRequest=
this.createRequest(this.recvUri,null,this.authParams,null,d.stream?3:2);a.on("data",function(a){d.onData(a)});a.on("complete",function(a){d.recvRequest=null;d.onActivity();if(a)if(a.code)d.onData(b(a));else d.disconnect(a);else h.nextTick(function(){d.recv()})});a.exec()}};l.prototype.onData=function(b){try{var a=this.decodeResponse(b);if(a&&a.length)for(b=0;b<a.length;b++)this.onProtocolMessage(A.fromDeserialized(a[b]))}catch(c){d.logAction(d.LOG_ERROR,"CometTransport.onData()","Unexpected exception handing channel event: "+
c.stack)}};l.prototype.encodeRequest=function(b){return JSON.stringify(b)};l.prototype.decodeResponse=function(b){"string"==typeof b&&(b=JSON.parse(b));return b};l.prototype.onAuthUpdated=function(b){this.authParams={access_token:b.token}};return l}(),X=function(){function b(){}function l(b){this.channel=b;this.basePath=b.basePath+"/presence"}h.inherits(l,B);l.prototype.get=function(f,a){d.logAction(d.LOG_MICRO,"Presence.get()","channel = "+this.channel.name);if(void 0===a)if("function"==typeof f)a=
f,f=null;else{if(this.channel.rest.options.promises)return h.promisify(this,"get",arguments);a=b}var c=this.channel.rest,n=c.options.useBinaryProtocol?"msgpack":"json",e=y.supportsLinkHeaders?void 0:n,m=h.defaultGetHeaders(n);c.options.headers&&h.mixin(m,c.options.headers);var r=this.channel.channelOptions;(new Q(c,this.basePath,m,e,function(a,b,c){return I.fromResponseBody(a,r,!c&&n)})).get(f,a)};l.prototype.history=function(b,a){d.logAction(d.LOG_MICRO,"Presence.history()","channel = "+this.channel.name);
this._history(b,a)};l.prototype._history=function(d,a){if(void 0===a)if("function"==typeof d)a=d,d=null;else{if(this.channel.rest.options.promises)return h.promisify(this,"_history",arguments);a=b}var c=this.channel.rest,f=c.options.useBinaryProtocol?"msgpack":"json",e=y.supportsLinkHeaders?void 0:f,m=h.defaultGetHeaders(f);c.options.headers&&h.mixin(m,c.options.headers);var r=this.channel.channelOptions;(new Q(c,this.basePath+"/history",m,e,function(a,b,c){return I.fromResponseBody(a,r,!c&&f)})).get(d,
a)};return l}(),K=function(){function b(){}function l(a,b,c,d,g){y.supportsAuthHeaders?a.auth.getAuthHeaders(function(a,e){a?d(a):g(h.mixin(e,b),c)}):a.auth.getAuthParams(function(a,e){a?d(a):g(b,h.mixin(e,c))})}function f(a,b){return function(c,e,g,d,f){if(c&&!e)a(c);else{if(!d)try{e=h.decodeBody(e,b)}catch(v){a(v);return}void 0===e.statusCode?a(c,e,g,!0,f):(g=e.statusCode,d=e.response,f=e.headers,200>g||300<=g?(c=d&&d.error||c,c||(c=Error("Error in unenveloping "+e),c.statusCode=g),a(c,d,f,!0,g)):
a(c,d,f,!0,g))}}}function a(a){var b=[];if(a)for(var c in a)b.push(c+"="+a[c]);return b.join("&")}function c(b,c,f,k){return function(e,m,n,r,l){e?d.logAction(d.LOG_MICRO,"Resource."+c+"()","Received Error; "+(f+(k?"?":"")+a(k))+"; Error: "+h.inspectError(e)):d.logAction(d.LOG_MICRO,"Resource."+c+"()","Received; "+(f+(k?"?":"")+a(k))+"; Headers: "+a(n)+"; StatusCode: "+l+"; Body: "+(z.isBuffer(m)?m.toString():m));b&&b(e,m,n,r,l)}}var n=w.msgpack;h.arrForEach(y.methodsWithoutBody,function(a){b[a]=
function(c,e,d,g,f,n){b["do"](a,c,e,null,d,g,f,n)}});h.arrForEach(y.methodsWithBody,function(a){b[a]=function(c,e,d,g,f,n,h){b["do"](a,c,e,d,g,f,n,h)}});b["do"]=function(b,m,r,k,g,p,x,v){function e(c,f){d.shouldLog(d.LOG_MICRO)&&d.logAction(d.LOG_MICRO,"Resource."+b+"()","Sending; "+(r+(f?"?":"")+a(f)));var x=[m,r,c,k,f,function(a,b,c,d,f){a&&O.isTokenErr(a)?m.auth.authorize(null,null,function(a){a?v(a):l(m,g,p,v,e)}):v(a,b,c,d,f)}];k||x.splice(3,1);if(d.shouldLog(d.LOG_MICRO)){var q=k;if(0<(c["content-type"]||
"").indexOf("msgpack"))try{q=n.decode(k)}catch(J){d.logAction(d.LOG_MICRO,"Resource."+b+"()","Sending MsgPack Decoding Error: "+h.inspectError(J))}d.logAction(d.LOG_MICRO,"Resource."+b+"()","Sending; "+(r+(f?"?":"")+a(f))+"; Body: "+q)}y[b].apply(this,x)}d.shouldLog(d.LOG_MICRO)&&(v=c(v,b,r,p));x&&(v=v&&f(v,x),(p=p||{}).envelope=x);l(m,g,p,v,e)};return b}(),Q=function(){function b(a,b,d,e,f,h){this.rest=a;this.path=b;this.headers=d;this.envelope=e;this.bodyHandler=f;this.useHttpPaginatedResponse=
h||!1}function l(a,b,d){this.resource=a;this.items=b;if(d){var c=this;"first"in d&&(this.first=function(a){c.get(d.first,a)});"current"in d&&(this.current=function(a){c.get(d.current,a)});this.next=function(a){"next"in d?c.get(d.next,a):a(null,null)};this.hasNext=function(){return"next"in d};this.isLast=function(){return!this.hasNext()}}}function f(a,b,d,e,f,h){l.call(this,a,b,f);this.statusCode=e;this.success=300>e&&200<=e;this.headers=d;this.errorCode=h&&h.code;this.errorMessage=h&&h.message}h.arrForEach(y.methodsWithoutBody,
function(a){b.prototype[a]=function(b,d){var c=this;K[a](c.rest,c.path,c.headers,b,c.envelope,function(a,b,e,g,f){c.handlePage(a,b,e,g,f,d)})}});h.arrForEach(y.methodsWithBody,function(a){b.prototype[a]=function(b,d,e){var c=this;K[a](c.rest,c.path,d,c.headers,b,c.envelope,function(a,b,d,f,m){e&&c.handlePage(a,b,d,f,m,e)})}});b.prototype.handlePage=function(a,b,n,e,m,r){if(!a||this.useHttpPaginatedResponse&&(b||"number"===typeof a.code)){var c,g;try{var p=this.bodyHandler(b,n,e)}catch(v){r(a||v);
return}if(n&&(c=n.Link||n.link)){b=c;"string"==typeof b&&(b=b.split(","));e={};for(c=0;c<b.length;c++)if(g=b[c].match(/^\s*<(.+)>;\s*rel="(\w+)"$/)){var x;(x=(x=g[1].match(/^\.\/(\w+)\?(.*)$/))&&h.parseQueryString(x[2]))&&(e[g[2]]=x)}g=e}this.useHttpPaginatedResponse?r(null,new f(this,p,n,m,g,a)):r(null,new l(this,p,g))}else d.logAction(d.LOG_ERROR,"PaginatedResource.handlePage()","Unexpected error getting resource: err = "+h.inspectError(a)),r(a)};l.prototype.get=function(a,b){var c=this.resource;
K.get(c.rest,c.path,c.headers,a,c.envelope,function(a,d,f,k,g){c.handlePage(a,d,f,k,g,b)})};h.inherits(f,l);return b}(),O=function(){function b(){}function l(a){if(!h.isErrorInfo(a))return new q(h.inspectError(a),a.code||40170,a.statusCode||401);a.code||(403===a.statusCode?a.code=40300:(a.code=40170,a.statusCode=401));return a}function f(a){if(!a)return"";"string"==typeof a&&(a=JSON.parse(a));var b={},c=h.keysArray(a,!0);if(!c)return"";c.sort();for(var e=0;e<c.length;e++)b[c[e]]=a[c[e]].sort();return JSON.stringify(b)}
function a(a){if(a.authCallback)d.logAction(d.LOG_MINOR,"Auth()","using token auth with authCallback");else if(a.authUrl)d.logAction(d.LOG_MINOR,"Auth()","using token auth with authUrl");else if(a.key)d.logAction(d.LOG_MINOR,"Auth()","using token auth with client-side signing");else if(a.tokenDetails)d.logAction(d.LOG_MINOR,"Auth()","using token auth with supplied token only");else throw d.logAction(d.LOG_ERROR,"Auth()","authOptions must include valid authentication parameters"),Error("authOptions must include valid authentication parameters");
}function c(b,c){this.client=b;this.tokenParams=c.defaultTokenParams||{};this.waitingForTokenRequest=this.currentTokenRequestId=null;if(c.useTokenAuth||(!("useTokenAuth"in c)||c.useTokenAuth)&&(c.authCallback||c.authUrl||c.token||c.tokenDetails)){if(c.key&&!m){var e="client-side token request signing not supported";d.logAction(d.LOG_ERROR,"Auth()",e);throw Error(e);}c.key||c.authCallback||c.authUrl||d.logAction(d.LOG_ERROR,"Auth()","Warning: library initialized with a token literal without any way to renew the token when it expires (no authUrl, authCallback, or key). See https://help.ably.io/error/40171 for help");
this._saveTokenOptions(c.defaultTokenParams,c);a(this.authOptions)}else{if(!c.key)throw e="No authentication options provided; need one of: key, authUrl, or authCallback (or for testing only, token or tokenDetails)",d.logAction(d.LOG_ERROR,"Auth()",e),new q(e,40160,401);d.logAction(d.LOG_MINOR,"Auth()","anonymous, using basic auth");this._saveBasicOptions(c)}}var n=Math.pow(2,17);if(w.createHmac){var e=function(a){return(new Buffer(a,"ascii")).toString("base64")};var m=function(a,b){var c=w.createHmac("SHA256",
b);c.update(a);return c.digest("base64")}}else e=oa.encode,m=function(a,b){return C.HmacSHA256(a,b).toString(C.enc.Base64)};var r=0;c.prototype.authorize=function(a,c,e){"function"!=typeof a||e?"function"!=typeof c||e||(e=c,c=null):(e=a,c=a=null);if(!e){if(this.client.options.promises)return h.promisify(this,"authorize",arguments);e=b}var g=this;if(c&&c.key&&this.authOptions.key!==c.key)throw new q("Unable to update auth options with incompatible key",40102,401);c&&"force"in c&&(d.logAction(d.LOG_ERROR,
"Auth.authorize","Deprecation warning: specifying {force: true} in authOptions is no longer necessary, authorize() now always gets a new token. Please remove this, as in version 1.0 and later, having a non-null authOptions will overwrite stored library authOptions, which may not be what you want"),h.isOnlyPropIn(c,"force")&&(c=null));this._forceNewToken(a,c,function(a,b){if(a)e(a);else if(g.client.connection)g.client.connection.connectionManager.onAuthUpdated(b,e);else e(null,b)})};c.prototype.authorise=
function(){d.deprecated("Auth.authorise","Auth.authorize");this.authorize.apply(this,arguments)};c.prototype._forceNewToken=function(b,c,e){var d=this;this.tokenDetails=null;this._saveTokenOptions(b,c);a(this.authOptions);this._ensureValidAuthCredentials(!0,function(a,b){delete d.tokenParams.timestamp;delete d.authOptions.queryTime;e(a,b)})};c.prototype.requestToken=function(a,c,e){function g(a,b){var e="/keys/"+a.keyName+"/requestToken",g=h.defaultPostHeaders();c.requestHeaders&&h.mixin(g,c.requestHeaders);
d.logAction(d.LOG_MICRO,"Auth.requestToken().requestToken","Sending POST to "+e+"; Token params: "+JSON.stringify(a));a=JSON.stringify(a);y.post(k,function(a){return k.baseUri(a)+e},g,a,null,b)}"function"!=typeof a||e?"function"!=typeof c||e||(e=c,c=null):(e=a,c=a=null);if(!e&&this.client.options.promises)return h.promisify(this,"requestToken",arguments);c=c||this.authOptions;a=a||h.copy(this.tokenParams);e=e||b;var k=this.client;if(c.authCallback){d.logAction(d.LOG_MINOR,"Auth.requestToken()","using token auth with authCallback");
var m=c.authCallback}else if(c.authUrl)d.logAction(d.LOG_MINOR,"Auth.requestToken()","using token auth with authUrl"),m=function(a,b){function e(a,c,e,g){if(a)d.logAction(d.LOG_MICRO,"Auth.requestToken().tokenRequestCallback","Received Error: "+h.inspectError(a));else{var f=e["content-type"];d.logAction(d.LOG_MICRO,"Auth.requestToken().tokenRequestCallback","Received; content-type: "+f+"; body: "+h.inspectBody(c))}if(a||g)return b(a,c);z.isBuffer(c)&&(c=c.toString());if(f)if(a=-1<f.indexOf("application/json"),
e=-1<f.indexOf("text/plain")||-1<f.indexOf("application/jwt"),a||e){if(a){if(c.length>n){b(new q("authUrl response exceeded max permitted length",40170,401));return}try{c=JSON.parse(c)}catch(na){b(new q("Unexpected error processing authURL response; err = "+na.message,40170,401));return}}b(null,c,f)}else b(new q("authUrl responded with unacceptable content-type "+f+", should be either text/plain, application/jwt or application/json",40170,401));else b(new q("authUrl response is missing a content-type header",
40170,401))}var g=h.mixin({accept:"application/json, text/plain"},c.authHeaders),f=c.authMethod&&"post"===c.authMethod.toLowerCase();if(!f){var m=c.authUrl.indexOf("?");if(-1<m){var r=h.parseQueryString(c.authUrl.slice(m));c.authUrl=c.authUrl.slice(0,m);c.authParams=h.mixin(r,c.authParams)}}m=h.mixin({},c.authParams||{},a);d.logAction(d.LOG_MICRO,"Auth.requestToken().tokenRequestCallback","Requesting token from "+c.authUrl+"; Params: "+JSON.stringify(m)+"; method: "+(f?"POST":"GET"));f?(g=g||{},g["content-type"]=
"application/x-www-form-urlencoded",f=h.toQueryString(m).slice(1),y.postUri(k,c.authUrl,g,f,{},e)):y.getUri(k,c.authUrl,g||{},m,e)};else if(c.key){var r=this;d.logAction(d.LOG_MINOR,"Auth.requestToken()","using token auth with client-side signing");m=function(a,b){r.createTokenRequest(a,c,b)}}else{d.logAction(d.LOG_ERROR,"Auth()","library initialized with a token literal without any way to renew the token when it expires (no authUrl, authCallback, or key). See https://help.ably.io/error/40171 for help");
e(new q("Need a new token, but authOptions does not include any way to request one (no authUrl, authCallback, or key)",40171,403));return}"capability"in a&&(a.capability=f(a.capability));var p=!1,t=this.client.options.timeouts.realtimeRequestTimeout,u=setTimeout(function(){p=!0;var a="Token request callback timed out after "+t/1E3+" seconds";d.logAction(d.LOG_ERROR,"Auth.requestToken()",a);e(new q(a,40170,401))},t);m(a,function(a,b,f){p||(clearTimeout(u),a?(d.logAction(d.LOG_ERROR,"Auth.requestToken()",
"token request signing call returned error; err = "+h.inspectError(a)),e(l(a))):"string"===typeof b?0===b.length?e(new q("Token string is empty",40170,401)):b.length>n?e(new q("Token string exceeded max permitted length (was "+b.length+" bytes)",40170,401)):"undefined"===b||"null"===b?e(new q("Token string was literal null/undefined",40170,401)):"{"!==b[0]||f&&-1<f.indexOf("application/jwt")?e(null,{token:b}):e(new q("Token was double-encoded; make sure you're not JSON-encoding an already encoded token request or details",
40170,401)):"object"!==typeof b?(b="Expected token request callback to call back with a token string or token request/details object, but got a "+typeof b,d.logAction(d.LOG_ERROR,"Auth.requestToken()",b),e(new q(b,40170,401))):(a=JSON.stringify(b).length,a>n&&!c.suppressMaxLengthCheck?e(new q("Token request/details object exceeded max permitted stringified size (was "+a+" bytes)",40170,401)):"issued"in b?e(null,b):"keyName"in b?g(b,function(a,b,c,g){a?(d.logAction(d.LOG_ERROR,"Auth.requestToken()",
"token request API call returned error; err = "+h.inspectError(a)),e(l(a))):(g||(b=JSON.parse(b)),d.logAction(d.LOG_MINOR,"Auth.getToken()","token received"),e(null,b))}):(b="Expected token request callback to call back with a token string, token request object, or token details object",d.logAction(d.LOG_ERROR,"Auth.requestToken()",b),e(new q(b,40170,401)))))})};c.prototype.createTokenRequest=function(a,b,c){"function"!=typeof a||c?"function"!=typeof b||c||(c=b,b=null):(c=a,b=a=null);if(!c&&this.client.options.promises)return h.promisify(this,
"createTokenRequest",arguments);b=b||this.authOptions;a=a||h.copy(this.tokenParams);var e=b.key;if(e){e=e.split(":");var g=e[0],k=e[1];if(k)if(""===a.clientId)c(new q("clientId can\u2019t be an empty string",40012,400));else{"capability"in a&&(a.capability=f(a.capability));var n=h.mixin({keyName:g},a),r=a.clientId||"",l=a.ttl||"",p=a.capability||"",t=this;(function(a){n.timestamp?a():t.getTimestamp(b&&b.queryTime,function(b,e){b?c(b):(n.timestamp=e,a())})})(function(){var a=n.nonce||(n.nonce=("000000"+
Math.floor(1E16*Math.random())).slice(-16));a=n.keyName+"\n"+l+"\n"+p+"\n"+r+"\n"+n.timestamp+"\n"+a+"\n";n.mac=n.mac||m(a,k);d.logAction(d.LOG_MINOR,"Auth.getTokenRequest()","generated signed request");c(null,n)})}else c(new q("Invalid key specified",40101,403))}else c(new q("No key specified",40101,403))};c.prototype.getAuthParams=function(a){"basic"==this.method?a(null,{key:this.key}):this._ensureValidAuthCredentials(!1,function(b,c){b?a(b):a(null,{access_token:c.token})})};c.prototype.getAuthHeaders=
function(a){"basic"==this.method?a(null,{authorization:"Basic "+this.basicKey}):this._ensureValidAuthCredentials(!1,function(b,c){b?a(b):a(null,{authorization:"Bearer "+e(c.token)})})};c.prototype.getTimestamp=function(a,b){this.isTimeOffsetSet()||!a&&!this.authOptions.queryTime?b(null,this.getTimestampUsingOffset()):this.client.time(b)};c.prototype.getTimestampUsingOffset=function(){return h.now()+(this.client.serverTimeOffset||0)};c.prototype.isTimeOffsetSet=function(){return null!==this.client.serverTimeOffset};
c.prototype._saveBasicOptions=function(a){this.method="basic";this.key=a.key;this.basicKey=e(a.key);this.authOptions=a||{};"clientId"in a&&this._userSetClientId(a.clientId)};c.prototype._saveTokenOptions=function(a,b){this.method="token";a&&(this.tokenParams=a);b&&(b.token&&(b.tokenDetails="string"===typeof b.token?{token:b.token}:b.token),b.tokenDetails&&(this.tokenDetails=b.tokenDetails),"clientId"in b&&this._userSetClientId(b.clientId),this.authOptions=b)};c.prototype._ensureValidAuthCredentials=
function(a,c){var e=this,g=this.tokenDetails;if(g){if(this._tokenClientIdMismatch(g.clientId)){c(new q("Mismatch between clientId in token ("+g.clientId+") and current clientId ("+this.clientId+")",40102,403));return}if(!this.isTimeOffsetSet()||!g.expires||g.expires>=this.getTimestampUsingOffset()){d.logAction(d.LOG_MINOR,"Auth.getToken()","using cached token; expires = "+g.expires);c(null,g);return}d.logAction(d.LOG_MINOR,"Auth.getToken()","deleting expired token");this.tokenDetails=null}(this.waitingForTokenRequest||
(this.waitingForTokenRequest=ba())).push(c);if(null===this.currentTokenRequestId||a){var f=this.currentTokenRequestId=r++;this.requestToken(this.tokenParams,this.authOptions,function(a,c){if(e.currentTokenRequestId>f)d.logAction(d.LOG_MINOR,"Auth._ensureValidAuthCredentials()","Discarding token request response; overtaken by newer one");else{e.currentTokenRequestId=null;var g=e.waitingForTokenRequest||b;e.waitingForTokenRequest=null;a?g(a):g(null,e.tokenDetails=c)}})}};c.prototype._userSetClientId=
function(a){if("string"!==typeof a&&null!==a)throw new q("clientId must be either a string or null",40012,400);if("*"===a)throw new q('Can\u2019t use "*" as a clientId as that string is reserved. (To change the default token request behaviour to use a wildcard clientId, instantiate the library with {defaultTokenParams: {clientId: "*"}}), or if calling authorize(), pass it in as a tokenParam: authorize({clientId: "*"}, authOptions)',40012,400);if(a=this._uncheckedSetClientId(a))throw a;};c.prototype._uncheckedSetClientId=
function(a){if(this._tokenClientIdMismatch(a)){a="Unexpected clientId mismatch: client has "+this.clientId+", requested "+a;var b=new q(a,40102,401);d.logAction(d.LOG_ERROR,"Auth._uncheckedSetClientId()",a);return b}this.clientId=this.tokenParams.clientId=a;return null};c.prototype._tokenClientIdMismatch=function(a){return this.clientId&&"*"!==this.clientId&&a&&"*"!==a&&this.clientId!==a};c.isTokenErr=function(a){return a.code&&40140<=a.code&&40150>a.code};return c}(),F=function(){function b(){}function l(a){if(!(this instanceof
l))return new l(a);if(!a){var b="no options provided";d.logAction(d.LOG_ERROR,"Rest()",b);throw Error(b);}a=t.objectifyOptions(a);a.log&&d.setLog(a.log.level,a.log.handler);d.logAction(d.LOG_MICRO,"Rest()","initialized with clientOptions "+h.inspect(a));this.options=t.normaliseOptions(a);if(a.key){b=a.key.match(/^([^:\s]+):([^:.\s]+)$/);if(!b)throw b="invalid key parameter",d.logAction(d.LOG_ERROR,"Rest()",b),Error(b);a.keyName=b[1];a.keySecret=b[2]}if("clientId"in a){if("string"!==typeof a.clientId&&
null!==a.clientId)throw new q("clientId must be either a string or null",40012,400);if("*"===a.clientId)throw new q('Can\u2019t use "*" as a clientId as that string is reserved. (To change the default token request behaviour to use a wildcard clientId, use {defaultTokenParams: {clientId: "*"}})',40012,400);}d.logAction(d.LOG_MINOR,"Rest()","started; version = "+t.libstring);this.baseUri=this.authority=function(b){return t.getHttpScheme(a)+b+":"+t.getPort(a,!1)};this.serverTimeOffset=this._currentFallback=
null;this.auth=new O(this,a);this.channels=new f(this);this.push=new qa(this)}function f(a){this.rest=a;this.attached={}}var a=w.msgpack;l.prototype.stats=function(a,d){if(void 0===d)if("function"==typeof a)d=a,a=null;else{if(this.options.promises)return h.promisify(this,"stats",arguments);d=b}var c=h.defaultGetHeaders(),f=this.options.useBinaryProtocol?"msgpack":"json";f=y.supportsLinkHeaders?void 0:f;this.options.headers&&h.mixin(c,this.options.headers);(new Q(this,"/stats",c,f,function(a,b,c){a=
c?a:JSON.parse(a);for(b=0;b<a.length;b++)a[b]=pa.fromValues(a[b]);return a})).get(a,d)};l.prototype.time=function(a,d){if(void 0===d)if("function"==typeof a)d=a,a=null;else{if(this.options.promises)return h.promisify(this,"time",arguments);d=b}var c=h.defaultGetHeaders();this.options.headers&&h.mixin(c,this.options.headers);var f=this;y.get(this,function(a){return f.authority(a)+"/time"},c,a,function(a,b,c,e){a?d(a):(e||(b=JSON.parse(b)),(a=b[0])?(f.serverTimeOffset=a-h.now(),d(null,a)):(a=Error("Internal error (unexpected result type from GET /time)"),
a.statusCode=500,d(a)))})};l.prototype.request=function(c,d,e,f,r,k){var g=this.options.useBinaryProtocol,m=g?a.encode:JSON.stringify,n=g?a.decode:JSON.parse,l=g?"msgpack":"json";g=y.supportsLinkHeaders?void 0:l;e=e||{};c=c.toLowerCase();l="get"==c?h.defaultGetHeaders(l):h.defaultPostHeaders(l);if(void 0===k){if(this.options.promises)return h.promisify(this,"request",[c,d,e,f,r]);k=b}"string"!==typeof f&&(f=m(f));this.options.headers&&h.mixin(l,this.options.headers);r&&h.mixin(l,r);d=new Q(this,d,
l,g,function(a,b,c){return h.ensureArray(c?a:n(a))},!0);if(!h.arrIn(y.methods,c))throw new q("Unsupported method "+c,40500,405);if(h.arrIn(y.methodsWithBody,c))d[c](e,f,k);else d[c](e,k)};l.prototype.setLog=function(a){d.setLog(a.level,a.handler)};f.prototype.get=function(a,b){a=String(a);var c=this.attached[a];c?b&&c.setOptions(b):this.attached[a]=c=new Y(this.rest,a,b);return c};f.prototype.release=function(a){delete this.attached[String(a)]};return l}();F.Promise=function(b){b=t.objectifyOptions(b);
b.promises=!0;return new F(b)};F.Callbacks=F;var G=function(){function b(f){if(!(this instanceof b))return new b(f);d.logAction(d.LOG_MINOR,"Realtime()","");F.call(this,f);this.connection=new ra(this,this.options);this.channels=new l(this);!1!==f.autoConnect&&this.connect()}function l(b){B.call(this);this.realtime=b;this.all={};this.inProgress={};var a=this;b.connection.connectionManager.on("transport.active",function(){a.onTransportActive()})}h.inherits(b,F);b.prototype.connect=function(){d.logAction(d.LOG_MINOR,
"Realtime.connect()","");this.connection.connect()};b.prototype.close=function(){d.logAction(d.LOG_MINOR,"Realtime.close()","");this.connection.close()};h.inherits(l,B);l.prototype.onChannelMessage=function(b){var a=b.channel;if(void 0===a)d.logAction(d.LOG_ERROR,"Channels.onChannelMessage()","received event unspecified channel, action = "+b.action);else{var c=this.all[a];if(c)c.onMessage(b);else d.logAction(d.LOG_ERROR,"Channels.onChannelMessage()","received event for non-existent channel: "+a)}};
l.prototype.onTransportActive=function(){for(var b in this.all){var a=this.all[b];"attaching"===a.state||"detaching"===a.state?a.checkPendingState():"suspended"===a.state&&a.attach()}};l.prototype.reattach=function(b){for(var a in this.all){var c=this.all[a];"attached"===c.state&&c.requestState("attaching",b)}};l.prototype.propogateConnectionInterruption=function(b,a){var c=["attaching","attached","detaching","suspended"],d={closing:"detached",closed:"detached",failed:"failed",suspended:"suspended"}[b],
e;for(e in this.all){var f=this.all[e];h.arrIn(c,f.state)&&f.notifyState(d,a)}};l.prototype.get=function(b,a){b=String(b);var c=this.all[b];c?a&&c.setOptions(a):c=this.all[b]=new U(this.realtime,b,a);return c};l.prototype.release=function(b){this.all[b]&&delete this.all[b]};l.prototype.setInProgress=function(b,a,c){this.inProgress[b.name]=this.inProgress[b.name]||{};this.inProgress[b.name][a]=c;!c&&this.hasNopending()&&this.emit("nopending")};l.prototype.onceNopending=function(b){if(this.hasNopending())b();
else this.once("nopending",b)};l.prototype.hasNopending=function(){return h.arrEvery(h.valuesArray(this.inProgress,!0),function(b){return!h.containsValue(b,!0)})};return b}();G.Promise=function(b){b=t.objectifyOptions(b);b.promises=!0;return new G(b)};G.Callbacks=G;var V=function(){return function(b,d,f,a){this.previous=b;this.current=d;f&&(this.retryIn=f);a&&(this.reason=a)}}(),da=function(){return function(b,d,f,a){this.previous=b;this.current=d;"attached"===d&&(this.resumed=f);a&&(this.reason=
a)}}(),ra=function(){function b(){}function l(b,a){B.call(this);this.ably=b;this.connectionManager=new P(b,a);this.state=this.connectionManager.state.state;this.recoveryKey=this.timeSerial=this.serial=this.id=this.key=void 0;this.errorReason=null;var c=this;this.connectionManager.on("connectionstate",function(a){var b=c.state=a.current;h.nextTick(function(){c.emit(b,a)})});this.connectionManager.on("update",function(a){h.nextTick(function(){c.emit("update",a)})})}h.inherits(l,B);l.prototype.whenState=
function(b,a){B.prototype.whenState.call(this,b,this.state,a,new V(void 0,b))};l.prototype.connect=function(){d.logAction(d.LOG_MINOR,"Connection.connect()","");this.connectionManager.requestState({state:"connecting"})};l.prototype.ping=function(f){d.logAction(d.LOG_MINOR,"Connection.ping()","");if(!f){if(this.ably.options.promises)return h.promisify(this,"ping",arguments);f=b}this.connectionManager.ping(null,f)};l.prototype.close=function(){d.logAction(d.LOG_MINOR,"Connection.close()","connectionKey = "+
this.key);this.connectionManager.requestState({state:"closing"})};return l}(),qa=function(){function b(){}function d(b){this.rest=b;this.deviceRegistrations=new f(b);this.channelSubscriptions=new a(b)}function f(a){this.rest=a}function a(a){this.rest=a}d.prototype.publish=function(a,d,e){var c=this.rest,f=c.options.useBinaryProtocol?"msgpack":"json",k=h.mixin({recipient:a},d),g=h.defaultPostHeaders(f),n={};if("function"!==typeof e){if(this.rest.options.promises)return h.promisify(this,"publish",arguments);
e=b}c.options.headers&&h.mixin(g,c.options.headers);c.options.pushFullWait&&h.mixin(n,{fullWait:"true"});k=h.encodeBody(k,f);K.post(c,"/push/publish",k,g,n,!1,function(a){e(a)})};f.prototype.save=function(a,d){var c=this.rest,f=c.options.useBinaryProtocol?"msgpack":"json",n=W.fromValues(a),k=h.defaultPostHeaders(f),g={};if("function"!==typeof d){if(this.rest.options.promises)return h.promisify(this,"save",arguments);d=b}c.options.headers&&h.mixin(k,c.options.headers);c.options.pushFullWait&&h.mixin(g,
{fullWait:"true"});n=h.encodeBody(n,f);K.put(c,"/push/deviceRegistrations/"+encodeURIComponent(a.id),n,k,g,!1,function(a,b,c,e){d(a,!a&&W.fromResponseBody(b,!e&&f))})};f.prototype.get=function(a,d){var c=this.rest,f=c.options.useBinaryProtocol?"msgpack":"json",n=h.defaultGetHeaders(f),k=a.id||a;if("function"!==typeof d){if(this.rest.options.promises)return h.promisify(this,"get",arguments);d=b}"string"===typeof k&&k.length?(c.options.headers&&h.mixin(n,c.options.headers),K.get(c,"/push/deviceRegistrations/"+
encodeURIComponent(k),n,{},!1,function(a,b,c,e){d(a,!a&&W.fromResponseBody(b,!e&&f))})):d(new q("First argument to DeviceRegistrations#get must be a deviceId string or DeviceDetails",4E4,400))};f.prototype.list=function(a,d){var c=this.rest,f=c.options.useBinaryProtocol?"msgpack":"json",n=y.supportsLinkHeaders?void 0:f,k=h.defaultGetHeaders(f);if("function"!==typeof d){if(this.rest.options.promises)return h.promisify(this,"list",arguments);d=b}c.options.headers&&h.mixin(k,c.options.headers);(new Q(c,
"/push/deviceRegistrations",k,n,function(a,b,c){return W.fromResponseBody(a,!c&&f)})).get(a,d)};f.prototype.remove=function(a,d){var c=this.rest,f=h.defaultGetHeaders(c.options.useBinaryProtocol?"msgpack":"json"),n={},k=a.id||a;if("function"!==typeof d){if(this.rest.options.promises)return h.promisify(this,"remove",arguments);d=b}"string"===typeof k&&k.length?(c.options.headers&&h.mixin(f,c.options.headers),c.options.pushFullWait&&h.mixin(n,{fullWait:"true"}),K["delete"](c,"/push/deviceRegistrations/"+
encodeURIComponent(k),f,n,!1,function(a){d(a)})):d(new q("First argument to DeviceRegistrations#remove must be a deviceId string or DeviceDetails",4E4,400))};f.prototype.removeWhere=function(a,d){var c=this.rest,f=h.defaultGetHeaders(c.options.useBinaryProtocol?"msgpack":"json");if("function"!==typeof d){if(this.rest.options.promises)return h.promisify(this,"removeWhere",arguments);d=b}c.options.headers&&h.mixin(f,c.options.headers);c.options.pushFullWait&&h.mixin(a,{fullWait:"true"});K["delete"](c,
"/push/deviceRegistrations",f,a,!1,function(a){d(a)})};a.prototype.save=function(a,d){var c=this.rest,f=c.options.useBinaryProtocol?"msgpack":"json",n=ca.fromValues(a),k=h.defaultPostHeaders(f),g={};if("function"!==typeof d){if(this.rest.options.promises)return h.promisify(this,"save",arguments);d=b}c.options.headers&&h.mixin(k,c.options.headers);c.options.pushFullWait&&h.mixin(g,{fullWait:"true"});n=h.encodeBody(n,f);K.post(c,"/push/channelSubscriptions",n,k,g,!1,function(a,b,c,e){d(a,!a&&ca.fromResponseBody(b,
!e&&f))})};a.prototype.list=function(a,d){var c=this.rest,f=c.options.useBinaryProtocol?"msgpack":"json",n=y.supportsLinkHeaders?void 0:f,k=h.defaultGetHeaders(f);if("function"!==typeof d){if(this.rest.options.promises)return h.promisify(this,"list",arguments);d=b}c.options.headers&&h.mixin(k,c.options.headers);(new Q(c,"/push/channelSubscriptions",k,n,function(a,b,c){return ca.fromResponseBody(a,!c&&f)})).get(a,d)};a.prototype.removeWhere=function(a,d){var c=this.rest,f=h.defaultGetHeaders(c.options.useBinaryProtocol?
"msgpack":"json");if("function"!==typeof d){if(this.rest.options.promises)return h.promisify(this,"removeWhere",arguments);d=b}c.options.headers&&h.mixin(f,c.options.headers);c.options.pushFullWait&&h.mixin(a,{fullWait:"true"});K["delete"](c,"/push/channelSubscriptions",f,a,!1,function(a){d(a)})};a.prototype.remove=a.prototype.removeWhere;a.prototype.listChannels=function(a,d){var c=this.rest,f=c.options.useBinaryProtocol?"msgpack":"json",n=y.supportsLinkHeaders?void 0:f,k=h.defaultGetHeaders(f);
if("function"!==typeof d){if(this.rest.options.promises)return h.promisify(this,"listChannels",arguments);d=b}c.options.headers&&h.mixin(k,c.options.headers);c.options.pushFullWait&&h.mixin(a,{fullWait:"true"});(new Q(c,"/push/channels",k,n,function(a,b,c){!c&&f&&(a=h.decodeBody(a,f));for(b=0;b<a.length;b++)a[b]=String(a[b]);return a})).get(a,d)};return function(a){this.rest=a;this.admin=new d(a)}}(),Y=function(){function b(){}function l(a,b,f){d.logAction(d.LOG_MINOR,"Channel()","started; name = "+
b);B.call(this);this.rest=a;this.name=b;this.basePath="/channels/"+encodeURIComponent(b);this.presence=new X(this);this.setOptions(f)}function f(a){return h.arrEvery(a,function(a){return!a.id})}h.inherits(l,B);l.prototype.setOptions=function(a){this.channelOptions=a=a||{};if(a.cipher){if(!T)throw Error("Encryption not enabled; use ably.encryption.js instead");var b=T.getCipher(a.cipher);a.cipher=b.cipherParams;a.channelCipher=b.cipher}else"cipher"in a&&(a.cipher=null,a.channelCipher=null)};l.prototype.history=
function(a,c){d.logAction(d.LOG_MICRO,"Channel.history()","channel = "+this.name);if(void 0===c)if("function"==typeof a)c=a,a=null;else{if(this.rest.options.promises)return h.promisify(this,"history",arguments);c=b}this._history(a,c)};l.prototype._history=function(a,b){var c=this.rest,d=c.options.useBinaryProtocol?"msgpack":"json",f=y.supportsLinkHeaders?void 0:d,l=h.defaultGetHeaders(d);c.options.headers&&h.mixin(l,c.options.headers);var k=this.channelOptions;(new Q(c,this.basePath+"/messages",l,
f,function(a,b,c){return D.fromResponseBody(a,k,!c&&d)})).get(a,b)};l.prototype.publish=function(){var a=arguments[0],c=arguments[1],d=arguments[arguments.length-1],e=this;if("function"!==typeof d){if(this.rest.options.promises)return h.promisify(this,"publish",arguments);d=b}if("string"===typeof a||null===a){var m=[D.fromValues({name:a,data:c})];var l=arguments[2]}else if(h.isObject(a))m=[D.fromValues(a)],l=arguments[1];else if(h.isArray(a))m=D.fromValuesArray(a),l=arguments[1];else throw new q("The single-argument form of publish() expects a message object or an array of message objects",
40013,400);"object"===typeof l&&l||(l={});a=this.rest;var k=a.options,g=k.useBinaryProtocol?"msgpack":"json";a=a.options.idempotentRestPublishing;var p=h.defaultPostHeaders(g);k.headers&&h.mixin(p,k.headers);if(a&&f(m)){var x=h.randomString(9);h.arrForEach(m,function(a,b){a.id=x+":"+b.toString()})}D.encodeArray(m,this.channelOptions,function(a){if(a)d(a);else{a=D.getMessagesSize(m);var b=k.maxMessageSize;a>b?d(new q("Maximum size of messages that can be published at once exceeded ( was "+a+" bytes; limit is "+
b+" bytes)",40009,400)):e._publish(D.serialize(m,g),p,l,d)}})};l.prototype._publish=function(a,b,d,e){K.post(this.rest,this.basePath+"/messages",a,b,d,!1,e)};return l}(),U=function(){function b(){}function l(a,b,f){d.logAction(d.LOG_MINOR,"RealtimeChannel()","started; name = "+b);Y.call(this,a,b,f);this.realtime=a;this.presence=new sa(this,a.options);this.connectionManager=a.connection.connectionManager;this.state="initialized";this.subscriptions=new B;this.syncChannelSerial=void 0;this.properties=
{attachSerial:void 0};this.setOptions(f);this._mode=this._requestedFlags=this.errorReason=null}var f=A.Action;h.inherits(l,Y);l.invalidStateError=function(a){return{statusCode:400,code:90001,message:"Channel operation failed as channel state is "+a}};l.progressOps={statechange:"statechange",sync:"sync"};l.processListenerArgs=function(a){a=Array.prototype.slice.call(a);"function"===typeof a[0]&&a.unshift(null);void 0==a[a.length-1]&&a.pop();return a};l.prototype.publish=function(){var a=arguments.length,
c=arguments[0],d=arguments[a-1];if("function"!==typeof d){if(this.realtime.options.promises)return h.promisify(this,"publish",arguments);d=b;++a}if(this.connectionManager.activeState()){if(2==a)if(h.isObject(c))c=[D.fromValues(c)];else if(h.isArray(c))c=D.fromValuesArray(c);else throw new q("The single-argument form of publish() expects a message object or an array of message objects",40013,400);else c=[D.fromValues({name:arguments[0],data:arguments[1]})];var e=this,f=this.realtime.options.maxMessageSize;
D.encodeArray(c,this.channelOptions,function(a){a?d(a):(a=D.getMessagesSize(c),a>f?d(new q("Maximum size of messages that can be published at once exceeded ( was "+a+" bytes; limit is "+f+" bytes)",40009,400)):e._publish(c,d))})}else d(this.connectionManager.getError())};l.prototype._publish=function(a,b){d.logAction(d.LOG_MICRO,"RealtimeChannel.publish()","message count = "+a.length);var c=this.state;switch(c){case "failed":case "suspended":b(q.fromValues(l.invalidStateError(c)));break;default:d.logAction(d.LOG_MICRO,
"RealtimeChannel.publish()","sending message; channel state is "+c),c=new A,c.action=f.MESSAGE,c.channel=this.name,c.messages=a,this.sendMessage(c,b)}};l.prototype.onEvent=function(a){d.logAction(d.LOG_MICRO,"RealtimeChannel.onEvent()","received message");for(var b=this.subscriptions,f=0;f<a.length;f++){var e=a[f];b.emit(e.name,e)}};l.prototype.attach=function(a,b){"function"===typeof a&&(b=a,a=null);if(!b){if(this.realtime.options.promises)return h.promisify(this,"attach",arguments);b=function(a){a&&
d.logAction(d.LOG_MAJOR,"RealtimeChannel.attach()","Channel attach failed: "+a.toString())}}a&&(this._requestedFlags=a);var c=this.connectionManager;if(c.activeState())switch(this.state){case "attached":if(!a){b();break}default:this.requestState("attaching");case "attaching":this.once(function(a){switch(this.event){case "attached":b();break;case "detached":case "suspended":case "failed":b(a.reason||c.getError());break;case "detaching":b(new q("Attach request superseded by a subsequent detach request",
9E4,409))}})}else b(c.getError())};l.prototype.attachImpl=function(){d.logAction(d.LOG_MICRO,"RealtimeChannel.attachImpl()","sending ATTACH message");this.setInProgress("statechange",!0);var a=A.fromValues({action:f.ATTACH,channel:this.name});this._requestedFlags&&h.arrForEach(this._requestedFlags,function(b){a.setFlag(b)});this.sendMessage(a,b)};l.prototype.detach=function(a){if(!a){if(this.realtime.options.promises)return h.promisify(this,"detach",arguments);a=b}var c=this.connectionManager;if(c.activeState())switch(this.state){case "detached":case "failed":a();
break;default:this.requestState("detaching");case "detaching":this.once(function(b){switch(this.event){case "detached":a();break;case "attached":case "suspended":case "failed":a(b.reason||c.getError());break;case "attaching":a(new q("Detach request superseded by a subsequent attach request",9E4,409))}})}else a(c.getError())};l.prototype.detachImpl=function(a){d.logAction(d.LOG_MICRO,"RealtimeChannel.detach()","sending DETACH message");this.setInProgress("statechange",!0);var c=A.fromValues({action:f.DETACH,
channel:this.name});this.sendMessage(c,a||b)};l.prototype.subscribe=function(){var a=l.processListenerArgs(arguments),c=a[0],d=a[1];a=a[2];if(!a){if(this.realtime.options.promises)return h.promisify(this,"subscribe",[c,d]);a=b}if("failed"===this.state)a(q.fromValues(l.invalidStateError("failed")));else return this.subscriptions.on(c,d),this.attach(a)};l.prototype.unsubscribe=function(){var a=l.processListenerArgs(arguments);this.subscriptions.off(a[0],a[1])};l.prototype.sync=function(){switch(this.state){case "initialized":case "detaching":case "detached":throw new q("Unable to sync to channel; not attached",
4E4);}var a=this.connectionManager;if(!a.activeState())throw a.getError();var b=A.fromValues({action:f.SYNC,channel:this.name});this.syncChannelSerial&&(b.channelSerial=this.syncChannelSerial);a.send(b)};l.prototype.sendMessage=function(a,b){this.connectionManager.send(a,this.realtime.options.queueMessages,b)};l.prototype.sendPresence=function(a,b){var c=A.fromValues({action:f.PRESENCE,channel:this.name,presence:h.isArray(a)?I.fromValuesArray(a):[I.fromValues(a)]});this.sendMessage(c,b)};l.prototype.onMessage=
function(a){var b=!1;switch(a.action){case f.ATTACHED:this.properties.attachSerial=a.channelSerial;this._mode=a.getMode();if("attached"===this.state){var h=a.hasFlag("RESUMED");if(!h||this.channelOptions.updateOnAttached)this.presence.onAttached(a.hasFlag("HAS_PRESENCE")),h=new da(this.state,this.state,h,a.error),this.emit("update",h)}else this.notifyState("attached",a.error,a.hasFlag("RESUMED"),a.hasFlag("HAS_PRESENCE"));break;case f.DETACHED:h=a.error?q.fromValues(a.error):new q("Channel detached",
90001,404);"detaching"===this.state?this.notifyState("detached",h):"attaching"===this.state?this.notifyState("suspended",h):this.requestState("attaching",h);break;case f.SYNC:b=!0;var e=this.syncChannelSerial=a.channelSerial;if(!a.presence)break;case f.PRESENCE:var m=a.presence;h=a.id;var l=a.connectionId;a=a.timestamp;for(var k=this.channelOptions,g=0;g<m.length;g++){try{var p=m[g];I.decode(p,k)}catch(x){d.logAction(d.LOG_ERROR,"RealtimeChannel.onMessage()",x.toString())}p.connectionId||(p.connectionId=
l);p.timestamp||(p.timestamp=a);p.id||(p.id=h+":"+g)}this.presence.setPresence(m,b,e);break;case f.MESSAGE:e=a.messages;h=a.id;l=a.connectionId;a=a.timestamp;k=this.channelOptions;for(g=0;g<e.length;g++){try{m=e[g],D.decode(m,k)}catch(x){d.logAction(d.LOG_MINOR,"RealtimeChannel.onMessage()",x.toString())}m.connectionId||(m.connectionId=l);m.timestamp||(m.timestamp=a);m.id||(m.id=h+":"+g)}this.onEvent(e);break;case f.ERROR:(h=a.error)&&80016==h.code?this.checkPendingState():this.notifyState("failed",
q.fromValues(h));break;default:d.logAction(d.LOG_ERROR,"RealtimeChannel.onMessage()","Fatal protocol error: unrecognised action ("+a.action+")"),this.connectionManager.abort(M.unknownChannelErr)}};l.prototype.onAttached=function(){d.logAction(d.LOG_MINOR,"RealtimeChannel.onAttached","activating channel; name = "+this.name)};l.prototype.notifyState=function(a,b,f,e){d.logAction(d.LOG_MICRO,"RealtimeChannel.notifyState","name = "+this.name+", current state = "+this.state+", notifying state "+a);this.clearStateTimer();
if(a!==this.state){this.presence.actOnChannelState(a,e,b);"suspended"===a&&this.connectionManager.state.sendEvents?this.startRetryTimer():this.cancelRetryTimer();b&&(this.errorReason=b);f=new da(this.state,a,f,b);d.logAction("failed"===a?d.LOG_ERROR:d.LOG_MAJOR,'Channel state for channel "'+this.name+'"',a+(b?"; reason: "+b:""));if("attached"===a)this.onAttached(),this.setInProgress("sync",e),this.setInProgress("statechange",!1);else if("detached"===a||"failed"===a||"suspended"===a)this.setInProgress("statechange",
!1),this.setInProgress("sync",!1);this.state=a;this.emit(a,f)}};l.prototype.requestState=function(a,b){d.logAction(d.LOG_MINOR,"RealtimeChannel.requestState","name = "+this.name+", state = "+a);this.notifyState(a,b);this.checkPendingState()};l.prototype.checkPendingState=function(){var a=this.connectionManager.state;if(a.sendEvents||a.forceQueueEvents)switch(d.logAction(d.LOG_MINOR,"RealtimeChannel.checkPendingState","name = "+this.name+", state = "+this.state),this.state){case "attaching":this.startStateTimerIfNotRunning();
this.attachImpl();break;case "detaching":this.startStateTimerIfNotRunning();this.detachImpl();break;case "attached":this.sync()}else d.logAction(d.LOG_MINOR,"RealtimeChannel.checkPendingState","sendEvents is false; state is "+this.connectionManager.state.state)};l.prototype.timeoutPendingState=function(){switch(this.state){case "attaching":var a=new q("Channel attach timed out",90007,408);this.notifyState("suspended",a);break;case "detaching":a=new q("Channel detach timed out",90007,408);this.notifyState("attached",
a);break;default:this.checkPendingState()}};l.prototype.startStateTimerIfNotRunning=function(){var a=this;this.stateTimer||(this.stateTimer=setTimeout(function(){d.logAction(d.LOG_MINOR,"RealtimeChannel.startStateTimerIfNotRunning","timer expired");a.stateTimer=null;a.timeoutPendingState()},this.realtime.options.timeouts.realtimeRequestTimeout))};l.prototype.clearStateTimer=function(){var a=this.stateTimer;a&&(clearTimeout(a),this.stateTimer=null)};l.prototype.startRetryTimer=function(){var a=this;
this.retryTimer||(this.retryTimer=setTimeout(function(){"suspended"===a.state&&a.connectionManager.state.sendEvents&&(a.retryTimer=null,d.logAction(d.LOG_MINOR,"RealtimeChannel retry timer expired","attempting a new attach"),a.requestState("attaching"))},this.realtime.options.timeouts.channelRetryTimeout))};l.prototype.cancelRetryTimer=function(){this.retryTimer&&(clearTimeout(this.retryTimer),this.suspendTimer=null)};l.prototype.setInProgress=function(a,b){this.rest.channels.setInProgress(this,a,
b)};l.prototype.history=function(a,c){d.logAction(d.LOG_MICRO,"RealtimeChannel.history()","channel = "+this.name);if(void 0===c)if("function"==typeof a)c=a,a=null;else{if(this.rest.options.promises)return h.promisify(this,"history",arguments);c=b}if(a&&a.untilAttach){if("attached"!==this.state){c(new q("option untilAttach requires the channel to be attached",4E4,400));return}if(!this.properties.attachSerial){c(new q("untilAttach was specified and channel is attached, but attachSerial is not defined",
4E4,400));return}delete a.untilAttach;a.from_serial=this.properties.attachSerial}Y.prototype._history.call(this,a,c)};l.prototype.whenState=function(a,b){B.prototype.whenState.call(this,a,this.state,b)};return l}(),sa=function(){function b(){}function l(a){a=a.channel.realtime;var b=a.auth.clientId;return(!b||"*"===b)&&"connected"===a.connection.state}function f(a,b,c){switch(a.state){case "attached":case "suspended":c();break;case "initialized":case "detached":case "detaching":case "attaching":a.attach(function(a){a?
b(a):c()});break;default:b(q.fromValues(U.invalidStateError(a.state)))}}function a(a){X.call(this,a);this.syncComplete=!1;this.members=new c(this);this._myMembers=new c(this);this.subscriptions=new B;this.pendingPresence=[]}function c(a){B.call(this);this.presence=a;this.map={};this.syncInProgress=!1;this.residualMembers=null}function n(a,b){if(a.isSynthesized()||b.isSynthesized())return a.timestamp>b.timestamp;var c=a.parseId(),d=b.parseId();return c.msgSerial===d.msgSerial?c.index>d.index:c.msgSerial>
d.msgSerial}h.inherits(a,X);a.prototype.enter=function(a,b){if(l(this))throw new q("clientId must be specified to enter a presence channel",40012,400);return this._enterOrUpdateClient(void 0,a,"enter",b)};a.prototype.update=function(a,b){if(l(this))throw new q("clientId must be specified to update presence data",40012,400);return this._enterOrUpdateClient(void 0,a,"update",b)};a.prototype.enterClient=function(a,b,c){return this._enterOrUpdateClient(a,b,"enter",c)};a.prototype.updateClient=function(a,
b,c){return this._enterOrUpdateClient(a,b,"update",c)};a.prototype._enterOrUpdateClient=function(a,c,f,k){if(!k)if("function"===typeof c)k=c,c=null;else{if(this.channel.realtime.options.promises)return h.promisify(this,"_enterOrUpdateClient",[a,c,f]);k=b}var e=this.channel;if(e.connectionManager.activeState()){d.logAction(d.LOG_MICRO,"RealtimePresence."+f+"Client()","channel = "+e.name+", client = "+(a||"(implicit) "+this.channel.realtime.auth.clientId));var m=I.fromValues({action:f,data:c});a&&(m.clientId=
a);var l=this;I.encode(m,e.channelOptions,function(a){if(a)k(a);else switch(e.state){case "attached":e.sendPresence(m,k);break;case "initialized":case "detached":e.attach();case "attaching":l.pendingPresence.push({presence:m,callback:k});break;default:a=new q("Unable to "+f+" presence channel (incompatible state)",90001),a.code=90001,k(a)}})}else k(e.connectionManager.getError())};a.prototype.leave=function(a,b){if(l(this))throw new q("clientId must have been specified to enter or leave a presence channel",
40012,400);return this.leaveClient(void 0,a,b)};a.prototype.leaveClient=function(a,c,f){if(!f)if("function"===typeof c)f=c,c=null;else{if(this.channel.realtime.options.promises)return h.promisify(this,"leaveClient",[a,c]);f=b}var e=this.channel;if(e.connectionManager.activeState())switch(d.logAction(d.LOG_MICRO,"RealtimePresence.leaveClient()","leaving; channel = "+this.channel.name+", client = "+a),c=I.fromValues({action:"leave",data:c}),a&&(c.clientId=a),e.state){case "attached":e.sendPresence(c,
f);break;case "attaching":this.pendingPresence.push({presence:c,callback:f});break;case "initialized":case "failed":a=new q("Unable to leave presence channel (incompatible state)",90001);f(a);break;default:f(M.failed)}else f(e.connectionManager.getError())};a.prototype.get=function(){function a(a){k(null,d?a.list(d):a.values())}var c=Array.prototype.slice.call(arguments);1==c.length&&"function"==typeof c[0]&&c.unshift(null);var d=c[0],k=c[1],g=!d||("waitForSync"in d?d.waitForSync:!0);if(!k){if(this.channel.realtime.options.promises)return h.promisify(this,
"get",c);k=b}if("suspended"===this.channel.state)g?k(q.fromValues({statusCode:400,code:91005,message:"Presence state is out of sync due to channel being in the SUSPENDED state"})):a(this.members);else{var l=this;f(this.channel,k,function(){var b=l.members;g?b.waitSync(function(){a(b)}):a(b)})}};a.prototype.history=function(a,c){d.logAction(d.LOG_MICRO,"RealtimePresence.history()","channel = "+this.name);if(void 0===c)if("function"==typeof a)c=a,a=null;else{if(this.channel.realtime.options.promises)return h.promisify(this,
"history",arguments);c=b}a&&a.untilAttach&&("attached"===this.channel.state?(delete a.untilAttach,a.from_serial=this.channel.properties.attachSerial):c(new q("option untilAttach requires the channel to be attached, was: "+this.channel.state,4E4,400)));X.prototype._history.call(this,a,c)};a.prototype.setPresence=function(a,b,c){d.logAction(d.LOG_MICRO,"RealtimePresence.setPresence()","received presence for "+a.length+" participants; syncChannelSerial = "+c);var e,f,h=this.members,m=this._myMembers,
l=[],n=this.channel.connectionManager.connectionId;b&&(this.members.startSync(),c&&(f=c.match(/^[\w\-]+:(.*)$/))&&(e=f[1]));for(c=0;c<a.length;c++)switch(f=I.fromValues(a[c]),f.action){case "leave":h.remove(f)&&l.push(f);f.connectionId!==n||f.isSynthesized()||m.remove(f);break;case "enter":case "present":case "update":h.put(f)&&l.push(f),f.connectionId===n&&m.put(f)}b&&!e&&(h.endSync(),this._ensureMyMembersPresent(),this.channel.setInProgress(U.progressOps.sync,!1),this.channel.syncChannelSerial=
null);for(c=0;c<l.length;c++)f=l[c],this.subscriptions.emit(f.action,f)};a.prototype.onAttached=function(a){d.logAction(d.LOG_MINOR,"RealtimePresence.onAttached()","channel = "+this.channel.name+", hasPresence = "+a);a?this.members.startSync():(this._synthesizeLeaves(this.members.values()),this.members.clear(),this._ensureMyMembersPresent());a=this.pendingPresence;var b=a.length;if(b){this.pendingPresence=[];var c=[],e=ba();d.logAction(d.LOG_MICRO,"RealtimePresence.onAttached","sending "+b+" queued presence messages");
for(var f=0;f<b;f++){var h=a[f];c.push(h.presence);e.push(h.callback)}this.channel.sendPresence(c,e)}};a.prototype.actOnChannelState=function(a,b,c){switch(a){case "attached":this.onAttached(b);break;case "detached":case "failed":this._clearMyMembers(),this.members.clear();case "suspended":this.failPendingPresence(c)}};a.prototype.failPendingPresence=function(a){if(this.pendingPresence.length){d.logAction(d.LOG_MINOR,"RealtimeChannel.failPendingPresence","channel; name = "+this.channel.name+", err = "+
h.inspectError(a));for(var b=0;b<this.pendingPresence.length;b++)try{this.pendingPresence[b].callback(a)}catch(r){}this.pendingPresence=[]}};a.prototype._clearMyMembers=function(){this._myMembers.clear()};a.prototype._ensureMyMembersPresent=function(){function a(a){if(a){a="Presence auto-re-enter failed: "+a.toString();var c=new q(a,91004,400);d.logAction(d.LOG_ERROR,"RealtimePresence._ensureMyMembersPresent()",a);a=new da(b.channel.state,b.channel.state,!0,c);b.channel.emit("update",a)}}var b=this,
c=this.members,f=this._myMembers,g;for(g in f.map)if(!(g in c.map)){var h=f.map[g];d.logAction(d.LOG_MICRO,"RealtimePresence._ensureMyMembersPresent()",'Auto-reentering clientId "'+h.clientId+'" into the presence set');this._enterOrUpdateClient(h.clientId,h.data,"enter",a);delete f.map[g]}};a.prototype._synthesizeLeaves=function(a){var b=this.subscriptions;h.arrForEach(a,function(a){a=I.fromValues({action:"leave",connectionId:a.connectionId,clientId:a.clientId,data:a.data,encoding:a.encoding,timestamp:h.now()});
b.emit("leave",a)})};a.prototype.on=function(){d.deprecated("presence.on","presence.subscribe");this.subscribe.apply(this,arguments)};a.prototype.off=function(){d.deprecated("presence.off","presence.unsubscribe");this.unsubscribe.apply(this,arguments)};a.prototype.subscribe=function(){var a=U.processListenerArgs(arguments),c=a[0],d=a[1];a=a[2];var f=this.channel;if(!a){if(this.channel.realtime.options.promises)return h.promisify(this,"subscribe",[c,d]);a=b}"failed"===f.state?a(q.fromValues(U.invalidStateError("failed"))):
(this.subscriptions.on(c,d),f.attach(a))};a.prototype.unsubscribe=function(){var a=U.processListenerArgs(arguments);this.subscriptions.off(a[0],a[1])};h.inherits(c,B);c.prototype.get=function(a){return this.map[a]};c.prototype.getClient=function(a){var b=this.map,c=[],d;for(d in b){var e=b[d];e.clientId==a&&"absent"!=e.action&&c.push(e)}return c};c.prototype.list=function(a){var b=this.map,c=a&&a.clientId;a=a&&a.connectionId;var d=[],e;for(e in b){var f=b[e];"absent"!==f.action&&(c&&c!=f.clientId||
a&&a!=f.connectionId||d.push(f))}return d};c.prototype.put=function(a){if("enter"===a.action||"update"===a.action)a=I.fromValues(a),a.action="present";var b=this.map,c=a.clientId+":"+a.connectionId;this.residualMembers&&delete this.residualMembers[c];var d=b[c];if(d&&!n(a,d))return!1;b[c]=a;return!0};c.prototype.values=function(){var a=this.map,b=[],c;for(c in a){var d=a[c];"absent"!=d.action&&b.push(d)}return b};c.prototype.remove=function(a){var b=this.map,c=a.clientId+":"+a.connectionId,d=b[c];
if(d&&!n(a,d))return!1;this.syncInProgress?(a=I.fromValues(a),a.action="absent",b[c]=a):delete b[c];return!0};c.prototype.startSync=function(){var a=this.map;d.logAction(d.LOG_MINOR,"PresenceMap.startSync()","channel = "+this.presence.channel.name+"; syncInProgress = "+this.syncInProgress);this.syncInProgress||(this.residualMembers=h.copy(a),this.setInProgress(!0))};c.prototype.endSync=function(){var a=this.map,b=this.syncInProgress;d.logAction(d.LOG_MINOR,"PresenceMap.endSync()","channel = "+this.presence.channel.name+
"; syncInProgress = "+b);if(b){for(var c in a)"absent"===a[c].action&&delete a[c];this.presence._synthesizeLeaves(h.valuesArray(this.residualMembers));for(c in this.residualMembers)delete a[c];this.residualMembers=null;this.setInProgress(!1)}this.emit("sync")};c.prototype.waitSync=function(a){var b=this.syncInProgress;d.logAction(d.LOG_MINOR,"PresenceMap.waitSync()","channel = "+this.presence.channel.name+"; syncInProgress = "+b);if(b)this.once("sync",a);else a()};c.prototype.clear=function(){this.map=
{};this.setInProgress(!1);this.residualMembers=null};c.prototype.setInProgress=function(a){d.logAction(d.LOG_MICRO,"PresenceMap.setInProgress()","inProgress = "+a);this.syncInProgress=a;this.presence.syncComplete=!a};return a}(),ka=function(){function b(){}function l(){for(var a in c)c[a].dispose()}function f(b,d,e,f,l,q,v){B.call(this);e=e||{};e.rnd=h.cheapRandStr();var g,k;if(k=n)k=g=(g=navigator.userAgent.toString().match(/MSIE\s([\d.]+)/))&&Number(g[1]);k&&10===g&&!e.envelope&&(e.envelope="json");
this.uri=b+h.toQueryString(e);this.headers=d||{};this.body=f;this.method=v?v.toUpperCase():h.isEmptyArg(f)?"GET":"POST";this.requestMode=l;this.timeouts=q;this.requestComplete=this.timedOut=!1;c[this.id=String(++a)]=this}var a=0,c={},n="undefined"!==typeof u&&u.XDomainRequest;h.inherits(f,B);var e=f.createRequest=function(a,b,c,d,e,l,n){l=l||t.TIMEOUTS;return new f(a,b,h.copy(c),d,e,l,n)};f.prototype.complete=function(a,b,c,d,e){this.requestComplete||(this.requestComplete=!0,b&&this.emit("data",b),
this.emit("complete",a,b,c,d,e),this.dispose())};f.prototype.abort=function(){this.dispose()};f.prototype.exec=function(){function a(a,b,c,f){b=b+" (event type: "+a.type+")"+(e.xhr.statusText?", current statusText is "+e.xhr.statusText:"");d.logAction(d.LOG_ERROR,"Request.on"+a.type+"()",b);e.complete(new q(b,c,f))}function b(){C=u.responseText;for(var a=C.length-1,b,c;F<a&&-1<(b=C.indexOf("\n",F));){c=C.slice(F,b);F=b+1;a:{try{c=JSON.parse(c)}catch(ma){e.complete(new q("Malformed response body from server: "+
ma.message,null,400));break a}e.emit("data",c)}}}function c(){b();e.streamComplete=!0;h.nextTick(function(){e.complete()})}var e=this,f=this.timer=setTimeout(function(){e.timedOut=!0;u.abort()},0==this.requestMode?this.timeouts.httpRequestTimeout:this.timeouts.recvTimeout),l=this.body,n=this.method,t=this.headers,u=this.xhr=new XMLHttpRequest,w=t.accept,y="text";w?0===w.indexOf("application/x-msgpack")&&(y="arraybuffer"):t.accept="application/json";l&&-1<(t["content-type"]||(t["content-type"]="application/json")).indexOf("application/json")&&
"string"!=typeof l&&(l=JSON.stringify(l));u.open(n,this.uri,!0);u.responseType=y;"authorization"in t&&(u.withCredentials=!0);for(var A in t)u.setRequestHeader(A,t[A]);u.onerror=function(b){a(b,"XHR error occurred",null,400)};u.onabort=function(b){e.timedOut?a(b,"Request aborted due to request timeout expiring",null,408):a(b,"Request cancelled",null,400)};u.ontimeout=function(b){a(b,"Request timed out",null,408)};var B,E,C,D,F=0,G=!1;u.onreadystatechange=function(){var a=u.readyState;if(!(3>a)&&0!==
u.status){if(void 0===E)if(E=u.status,1223===E&&(E=204),clearTimeout(f),D=400>E,204==E)e.complete(null,null,null,null,E);else{var d;if(d=3==e.requestMode&&D)d=u,d=d.getResponseHeader&&(d.getResponseHeader("transfer-encoding")||!d.getResponseHeader("content-length"));B=d}if(3==a&&B)b();else if(4==a)if(B)c();else a:{try{var g=u.getResponseHeader&&u.getResponseHeader("content-type");if(g?0<=g.indexOf("application/json"):"text"==u.responseType){var k="arraybuffer"===u.responseType?z.utf8Decode(u.response):
String(u.responseText);k.length&&(k=JSON.parse(k));G=!0}else k=u.response;if(void 0!==k.response){E=k.statusCode;D=400>E;var l=k.headers;k=k.response}else{var m=h.trim(u.getAllResponseHeaders()).split("\r\n");a={};for(g=0;g<m.length;g++){var n=h.arrMap(m[g].split(":"),h.trim);a[n[0].toLowerCase()]=n[1]}l=a}}catch(ta){e.complete(new q("Malformed response body from server: "+ta.message,null,400));break a}D||h.isArray(k)?e.complete(null,k,l,G,E):((m=k.error)||(m=new q("Error response received from server: "+
E+" body was: "+h.inspect(k),null,E)),e.complete(m,k,l,G,E))}}};u.send(l)};f.prototype.dispose=function(){var a=this.xhr;if(a){a.onreadystatechange=a.onerror=a.onabort=a.ontimeout=b;this.xhr=null;var d=this.timer;d&&(clearTimeout(d),this.timer=null);this.requestComplete||a.abort()}delete c[this.id]};w.xhrSupported&&("object"===typeof fa&&fa.addUnloadListener(l),"undefined"!==typeof y&&(y.supportsAuthHeaders=!0,y.Request=function(a,b,c,d,f,h,l){a=e(c,d,f,h,0,b&&b.options.timeouts,a);a.once("complete",
l);a.exec();return a},y.checkConnectivity=function(a){var b=t.internetUpUrl;d.logAction(d.LOG_MICRO,"(XHRRequest)Http.checkConnectivity()","Sending; "+b);y.getUri(null,b,null,null,function(b,c){var e=!b&&"yes"==c.replace(/\n/,"");d.logAction(d.LOG_MICRO,"(XHRRequest)Http.checkConnectivity()","Result: "+e);a(null,e)})}));return f}();(function(){function b(b,d,a){N.call(this,b,d,a);this.shortName="xhr_streaming"}h.inherits(b,N);b.isAvailable=function(){return w.xhrSupported&&w.streamingSupported&&w.allowComet};
b.tryConnect=function(h,f,a,c){function l(a){c({event:this.event,error:a})}var e=new b(h,f,a);e.on(["failed","disconnected"],l);e.on("preconnect",function(){d.logAction(d.LOG_MINOR,"XHRStreamingTransport.tryConnect()","viable transport "+e);e.off(["failed","disconnected"],l);c(null,e)});e.connect()};b.prototype.toString=function(){return"XHRStreamingTransport; uri="+this.baseUri+"; isConnected="+this.isConnected};b.prototype.createRequest=function(b,d,a,c,h){return ka.createRequest(b,d,a,c,h,this.timeouts)};
"undefined"!==typeof P&&b.isAvailable()&&(P.supportedTransports.xhr_streaming=b);return b})();(function(){function b(b,d,a){a.stream=!1;N.call(this,b,d,a);this.shortName="xhr_polling"}h.inherits(b,N);b.isAvailable=function(){return w.xhrSupported&&w.allowComet};b.tryConnect=function(h,f,a,c){function l(a){c({event:this.event,error:a})}var e=new b(h,f,a);e.on(["failed","disconnected"],l);e.on("preconnect",function(){d.logAction(d.LOG_MINOR,"XHRPollingTransport.tryConnect()","viable transport "+e);
e.off(["failed","disconnected"],l);c(null,e)});e.connect()};b.prototype.toString=function(){return"XHRPollingTransport; uri="+this.baseUri+"; isConnected="+this.isConnected};b.prototype.createRequest=function(b,d,a,c,h){return ka.createRequest(b,d,a,c,h,this.timeouts)};"undefined"!==typeof P&&b.isAvailable()&&(P.supportedTransports.xhr_polling=b);return b})();(function(){function b(){}function l(a,b,c){c.stream=!1;N.call(this,a,b,c);this.shortName="jsonp"}function f(a,b,d,e,f,l,m,n){B.call(this);
void 0===a&&(a=c++);this.id=a;this.uri=b;this.params=e||{};this.params.rnd=h.cheapRandStr();d&&(d["X-Ably-Version"]&&(this.params.v=d["X-Ably-Version"]),d["X-Ably-Lib"]&&(this.params.lib=d["X-Ably-Lib"]));this.body=f;this.method=n;this.requestMode=l;this.timeouts=m;this.requestComplete=!1}var a=u._ablyjs_jsonp={};a._=function(c){return a["_"+c]||b};var c=1,n=null;h.inherits(l,N);l.isAvailable=function(){return w.jsonpSupported&&w.allowComet};l.isAvailable()&&(P.supportedTransports.jsonp=l);w.jsonpSupported&&
(n=document.getElementsByTagName("head")[0]);var e=null;u.JSONPTransport=l;l.tryConnect=function(a,b,c,e){function f(a){e({event:this.event,error:a})}var g=new l(a,b,c);g.on(["failed","disconnected"],f);g.on("preconnect",function(){d.logAction(d.LOG_MINOR,"JSONPTransport.tryConnect()","viable transport "+g);g.off(["failed","disconnected"],f);e(null,g)});g.connect()};l.prototype.toString=function(){return"JSONPTransport; uri="+this.baseUri+"; isConnected="+this.isConnected};var m=l.prototype.createRequest=
function(a,b,c,d,e,l,m){l=this&&this.timeouts||l||t.TIMEOUTS;return new f(void 0,a,b,h.copy(c),d,e,l,m)};h.inherits(f,B);f.prototype.exec=function(){var b=this.id,c=this.body,e=this.method,f=this.uri,l=this.params,m=this;l.callback="_ablyjs_jsonp._("+b+")";l.envelope="jsonp";c&&(l.body=c);e&&"get"!==e&&(l.method=e);c=this.script=document.createElement("script");f+=h.toQueryString(l);c.src=f;c.src.split("/").slice(-1)[0]!==f.split("/").slice(-1)[0]&&d.logAction(d.LOG_ERROR,"JSONP Request.exec()","Warning: the browser appears to have truncated the script URI. This will likely result in the request failing due to an unparseable body param");
c.async=!0;c.type="text/javascript";c.charset="UTF-8";c.onerror=function(a){m.complete(new q("JSONP script error (event: "+h.inspect(a)+")",null,400))};a["_"+b]=function(a){if(a.statusCode){var b=a.response;204==a.statusCode?m.complete(null,null,null,a.statusCode):b?400>a.statusCode||h.isArray(b)?m.complete(null,b,a.headers,a.statusCode):(a=b.error||new q("Error response received from server",null,a.statusCode),m.complete(a)):m.complete(new q("Invalid server response: no envelope detected",null,500))}else m.complete(null,
a)};this.timer=setTimeout(function(){m.abort()},this.requestMode==N.REQ_SEND?this.timeouts.httpRequestTimeout:this.timeouts.recvTimeout);n.insertBefore(c,n.firstChild)};f.prototype.complete=function(a,b,c,d){c=c||{};this.requestComplete||(this.requestComplete=!0,b&&(c["content-type"]="string"==typeof b?"text/plain":"application/json",this.emit("data",b)),this.emit("complete",a,b,c,!0,d),this.dispose())};f.prototype.abort=function(){this.dispose()};f.prototype.dispose=function(){var b=this.timer;b&&
(clearTimeout(b),this.timer=null);b=this.script;b.parentNode&&b.parentNode.removeChild(b);delete a[this.id];this.emit("disposed")};w.jsonpSupported&&!y.Request&&(y.Request=function(a,b,c,d,e,f,l){var g=m(c,d,e,f,N.REQ_SEND,b&&b.options.timeouts,a);g.once("complete",l);h.nextTick(function(){g.exec()});return g},y.checkConnectivity=function(a){var b=t.jsonpInternetUpUrl;if(e)e.push(a);else{e=[a];d.logAction(d.LOG_MICRO,"(JSONP)Http.checkConnectivity()","Sending; "+b);var c=new f("isTheInternetUp",b,
null,null,null,N.REQ_SEND,t.TIMEOUTS);c.once("complete",function(a,b){var c=!a&&b;d.logAction(d.LOG_MICRO,"(JSONP)Http.checkConnectivity()","Result: "+c);for(var f=0;f<e.length;f++)e[f](null,c);e=null});h.nextTick(function(){c.exec()})}});return l})();"undefined"!==typeof G&&(Z.msgpack=ha,Z.Rest=F,Z.Realtime=G,G.ConnectionManager=P,G.BufferUtils=F.BufferUtils=z,"undefined"!==typeof T&&(G.Crypto=F.Crypto=T),G.Defaults=F.Defaults=t,G.Http=F.Http=y,G.Utils=F.Utils=h,G.Http=F.Http=y,G.Message=F.Message=
D,G.PresenceMessage=F.PresenceMessage=I,G.ProtocolMessage=F.ProtocolMessage=A);if("object"===typeof u.exports){for(var ea in u.Ably)u.Ably.hasOwnProperty(ea)&&(u.exports[ea]=u.Ably[ea]);u.exports.__esModule=!0}"function"===typeof u.define&&u.define.amd&&u.define("ably",[],function(){return u.Ably})}).call({});

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4]);
