// from encoding.js: encode, decode, toUrl, fromUrl
// save and restore an arraybuffer to the url
// encoded + a little compressed (run length encoded)

// in this file:
// take the current selection of courses
// make an arrayBuffer from them
// use one byte for every two courses
// we're just smashing the term for every course into a big arraybuffer
// 
// also, the inverse of that
// restore the active selection of courses from an arraybuffer, formatted the same way
//
// the courses are sorted by code first either way
const SORTED_COURSE_CODES = AIRTABLE_COURSES
  .map(c => c['Course Code (FL)'])
  .sort()

// take the currently selected courses and turn them into an arraybuffer
function coursePlanAsArrayBuffer() {
  // for each course in the AIRTABLE_COURSES
  // what's the term in the current plan?
  let plan = mergeCourses();
  let res = new Array(AIRTABLE_COURSES.length);
  // 0 means no term
  res.fill(0);
  for (let year in plan) {
    for (let term in plan[year]) {
      for (let course of plan[year][term]) {
        let i = SORTED_COURSE_CODES.findIndex(c => c == course.code)
        res[i] = parseInt(term) + (parseInt(year) - 1) * 4;
      }
    }
  }
  return res;
}

// shrink to an array buffer of half the size
// requires that all the items in the input ab are uint4 ints, e.g. < 16
let shrink = (ab) => {
  let short = new Uint8Array(Math.ceil(ab.length / 2));
  for (let i = 0; i < ab.length; i+=2) {
    // careful about endianness when joining 4-bits
    if (ab[i] >= 16 || ab[i + 1] >= 16) throw new Error("can't shrink, too big: " + ab[i] + " or " + ab[i + 1]);
    short[i / 2] =  (ab[i] << 4) + (ab[i + 1] || 0);
  }
  return short;
}

// undo the shrink - assume every item in the arraybuffer is really two nibbles; we want the bytes out
let expand = (short) => {
  let ab = new Uint8Array(short.length * 2);
  for (let i = 0; i < short.length; i += 1) {
    // grab two nibbles off of short
    ab[2 * i] = short[i] >> 4; // four high bits
    ab[2 * i + 1] = short[i] & 0b00001111; // four low bits
  }
  return ab
}

function savePlanToUrl() {
  let ab = new Uint8Array(shrink(coursePlanAsArrayBuffer()))
  toUrl(ab);
}

function restorePlanFromUrl() {
  let plan = expand(fromUrl());
  clearChosenCourses();
  if (!plan.length) { return }
  for (courseindex in plan) {
    let term = plan[courseindex];
    if (term > 0) {
      let year = Math.ceil(term / 4);
      term = term % 4;
      term = term == 0 ? 4 : term;
      let courseCode = SORTED_COURSE_CODES[courseindex];
      let course = AIRTABLE_COURSES.find(c => c['Course Code (FL)'] == courseCode)
      course = transformKeys(course);
      if (!course.required) {
        chosenCourses[year][term].push(course)
      }
    }
  }
  render()
}

restorePlanFromUrl();
