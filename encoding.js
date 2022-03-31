// we want to save and restore, using the url
// let's start with just saving and restoring an arbitrary transformation of some data
// let's just, idk, base64 encode something and restore it

function _arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return btoa( binary );
}

function _base64ToArrayBuffer( base64string ) {
  var binary = atob(base64string);
  var bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary[i].charCodeAt(0);
  }
  return bytes;
}

function encode(data) {
  return _arrayBufferToBase64(rle(data));
}

function decode(encoded_data) {
  return rld(_base64ToArrayBuffer(encoded_data));
}

// utility function for extending an array buffer
function extend(ab) {
  // dynamically extend array
  let new_ab = new Uint8Array(ab.length * 2 + 8);
  new_ab.set(ab);
  return new_ab;
}

// run-length-encoding
function rle(arrayBuffer) {
  let encoded = new Uint8Array();
  if (arrayBuffer.length == 0) {return encoded};
  let prev = arrayBuffer[0]; // should be out of range for uint8array data
  let count = 0;
  let eindex = 0;
  let val;
  for (let i = 0; i < arrayBuffer.length; i++) {
    val = arrayBuffer[i];
    // confirm not past 255 uint8 max value
    if (val == prev && count < 254) {
      count++
    } else {
      if (encoded.length <= eindex + 2) {
        encoded = extend(encoded);
      }
      // add the rle count and val to the buffer
      encoded[eindex++] = count;
      encoded[eindex++] = prev;
      count = 1;
      prev = val;
    }
  }
  // add the final val
  if (encoded.length <= eindex + 2) {
    encoded = extend(encoded);
  }
  encoded[eindex++] = count;
  encoded[eindex++] = val;
  return encoded.subarray(0, eindex)
}

// run-length decoding
function rld(arrayBuffer) {
  let size = 0;
  for (let i = 0; i < arrayBuffer.length; i += 2){
    size += arrayBuffer[i]
  };
  let res = new Uint8Array(size);
  let pos = 0;
  for (let i = 0; i < arrayBuffer.length; i += 2){
    let count = arrayBuffer[i];
    let val = arrayBuffer[i+1];
    res.fill(val, pos, pos + count);
    pos += count;
  };
  return res
}

// store the data into the url
function toUrl(data) {
  // encode -> store in url
  let encoded = encode(data);
  let l = new URL(document.location);
  l.searchParams.set('s', encoded);
  history.replaceState(null, null, l);
}

// parse the data from the url, return it
function fromUrl() {
  // get from url -> decode -> return data
  let params = (new URL(document.location)).searchParams;
  let encoded_data = params.get('s');
  if (encoded_data) {
    return decode(encoded_data)  
  } else {
    return new Uint8Array(0);
  }
}

/// UNCOMMENT TO TEST
// let data = new Uint8Array([1,2,3,4,5,4,3,2,1])
// let shortable = new Uint8Array([1,1,1,1,2,2,2,2,3,3,3,3,3,4,5,5,5,5])
// roundtrips run-length encoding / decoding
// console.log(shortable, rle(shortable), rld(rle(shortable)));
// toUrl(shortable)