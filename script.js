// consts defined in other files: 
// the courses: AIRTABLE_COURSES

const AT_names_to_keys = {
  "Name": "name",
  "Quarter (Woolf plan)": "woolf_quarter",
  "Required": "required",
  "Quarter (sample 2)": "sample_quarter",
  "Credit Hours": "credit_hours",
  "ECTS Credits": "ects_credits",
  "Kind": "kind",
  "Type": "type",
  "FL": "deac",
  "Description": "description",
  "Woolf": "woolf",
  "Sample Degree": "sample",
  "Course Code (FL)": "code",
  "prereqs": "prereqs",
  "Prerequisites (FL)": "prerequisite_course_ids",
  "id": "id",
}

const YEARS = [1, 2, 3];
const TERMS = YEARS
  .flatMap((year) => [1,2,3,4]
    .map(term => ({year, term}))
  )

const transformKeys = (course) => Object.fromEntries(Object.entries(course).map(([key, val]) => [AT_names_to_keys[key], val]))

// airtable courses -> available courses
// just transform the data
const ALL_AVAILABLE_COURSES = AIRTABLE_COURSES.map(course => transformKeys(course))

// Mode: "woolf" - filter to the woolf courses, show ects credits (call mode "europe"?)
// Mode: "deac" - filter to deac courses, show credit hours (call mode "us"?)
var mode = "deac";

const COURSES = {
  "woolf": ALL_AVAILABLE_COURSES.filter(course => course.woolf),
  "deac": ALL_AVAILABLE_COURSES.filter(course => course.deac),
}

// Required courses... can't be moved? for now
const REQUIRED = {
  "woolf": COURSES.woolf.filter(c => c.required),
  "deac": COURSES.deac.filter(c => c.required),
}
function getRequired() {
  return REQUIRED[mode];
}

function getQuarter(course) {
  return mode == "woolf" ? course.woolf_quarter : course.sample_quarter;
}

function yearFromQuarter(course) {
  return Math.floor((getQuarter(course) - 1) / 4) + 1;
}
const termFromQuarter = course => (getQuarter(course) % 4) || 4; // 0 => 4

function groupIntoYears(courses) {
  let grouped = {};
  for (let term of TERMS) {
    grouped[term.year] ||= {};
    grouped[term.year][term.term] = courses
        .filter(c => yearFromQuarter(c) == term.year && termFromQuarter(c) == term.term);
  }
  return grouped;
}

// airtable courses -> fixed courses
//  - filter by required
//  - group by: "woolf" -> quarter_woolf
//  -           "deac" -> sample_quarter
const FIXED_COURSES = groupIntoYears(getRequired());

// The courses chosen by the user.
// Keyed by year, then by term
let chosenCourses;
function clearChosenCourses() {
  chosenCourses = {
    1: {
      1: [],
      2: [],
      3: [],
      4: [],
    },
    2: {
      1: [],
      2: [],
      3: [],
      4: [],
    },
    3: {
      1: [],
      2: [],
      3: [],
      4: [],
    },
  }
}
clearChosenCourses();

function availableCourses() {
  return COURSES[mode];
}

function merge(fixed, chosen) {
  let merged = {}
  for (year in fixed) {
    merged[year] = {}
    for (term in fixed[year]) {
      let fcourses = fixed[year][term].map(course => ({...course, fixed: true}));
      let ccourses = (chosen[year][term] || []).map(course => ({...course, fixed: false}))
      merged[year][term] = fcourses.concat(ccourses)
    }
  }
  return merged
}

function flattenedCourses(nested) {
  return Object.values(nested).flatMap(Object.values).flat(1)
}

function selectedCourses() {
  return flattenedCourses(merge(FIXED_COURSES, chosenCourses))
}

function unselectedCourses() {
  let selectedNames = new Set(selectedCourses().map(course => course.name));
  return availableCourses().filter(course => !selectedNames.has(course.name))
}

// currently ignores woolf, there's no woolf sample program :o
function samplePrograms(mode) {
  return AIRTABLE_COURSES.filter(course => course['Sample Degree'])
}


function renderYear(year) {
  return `<div class="year" id="year-${year}">
    <h2>Year ${year}</h2>
    <div class="info"></div>
  </div>`
}

function renderTerm(term) {
  return `<div class="term" id="term-${term.year}-${term.term}" data-year="${term.year}" data-term="${term.term}">
    <h3>Term ${term.term} (Year ${term.year})</h3>
    <div class="info"></div>
    <div class="courses">
      <div class="labels">
        <div>
          <span class="code-label">code</span>
          <span class="name-label">name</span>
        </div>
        <span class="credits-label">credits</span>
      </div>
    </div>
  </div>`
}

function renderTerms() {
  let target = document.querySelector("#target")
  for (let year of YEARS) {
    target.innerHTML += renderYear(year);
    renderedYear = target.lastChild;
    let yterms = TERMS.filter(t => t.year == year);
    for (let term of yterms) {
      renderedYear.innerHTML += renderTerm(term);
    }
  }
}

function credits(course) {
  return ({
    "woolf": course.ects_credits,
    "deac": course.credit_hours,
  })[mode];
}

function creditVocab() {
  return mode == "woolf" ? "ECTS Credits" : "Credit Hours";
}

function renderCourse(course) {
  let detailsUrl = new URL(document.location);
  detailsUrl.searchParams.set('f', course.code);
  return `<div class="course ${course.kind.toLowerCase()} ${course.fixed && 'fixed'}" draggable="${course.fixed ? 'false' : 'true'}">
  <div>
    <span class="code">${course.code}</span>
    <span class="name">${course.name}</span>
  </div>
  <div>
    <span class="credits">${credits(course)}</span>
    <a class="show-detail" href="${detailsUrl}"><small>show</small></a>
  </div>
  </div>`
}

function renderTermCredits(courses) {
  let totalCredits = 0;
  courses.forEach(course => {
    totalCredits += credits(course);
  })
  return `Total: ${totalCredits} ${creditVocab()}`;
}

function renderYearCredits(courses)  {
  let totalCredits = 0;
  courses.forEach(course => {
    totalCredits += credits(course);
  })
  return `Total: ${totalCredits} ${creditVocab()}`;
}

function renderTotalCredits(courses) {
  let totalCredits = 0;
  courses.forEach(course => {
    totalCredits += credits(course);
  })
  return `Total: ${totalCredits} ${creditVocab()}`;
}

function mergeCourses() {
  return merge(FIXED_COURSES, chosenCourses);
}

function renderMergedCourses() {
  let mergedCourses = mergeCourses();
  for (let year in mergedCourses) {
    for (let term in mergedCourses[year]) {
      let targetTerm = document.querySelector(`#term-${year}-${term}`);
      let courses = mergedCourses[year][term]
      targetTerm.querySelector('.info').innerHTML += renderTermCredits(courses)
      let coursesDiv = targetTerm.querySelector('.courses')
      for (let course of courses) {
        coursesDiv.innerHTML += renderCourse(course);
      }
    }
    document.querySelector(`#year-${year} .info`).innerHTML += renderYearCredits(flattenedCourses(mergedCourses[year]))
  }
  document.querySelector('#target .info').innerHTML += renderTotalCredits(flattenedCourses(mergedCourses))
}

function renderCourseDetails() {
  // find focused course from url, if there is one
  let f = new URL(document.location).searchParams.get('f');
  let focusedCourse = availableCourses().find(c => c.code == f);
  if (focusedCourse) {
    let unfocusedUrl = new URL(document.location);
    unfocusedUrl.searchParams.delete('f');
    let details = `<div class="details ${focusedCourse.kind.toLowerCase()}">
        <span class="code">${focusedCourse.code}</span>
      <h2>${focusedCourse.name}</h2>
      <a class="hide-detail" href="${unfocusedUrl}">hide</a>
      <div><label for="credits"><strong>Credits:</strong></label> <span id="credits" class="credits">${credits(focusedCourse)}</span></div>
      <div>
<label for="prereqs"><strong>Prerequisites:</strong></label>
        <span class="prereqs" id="prereqs">${focusedCourse.prereqs ? focusedCourse.prereqs : 'None'}</span>
      </div>
      <div><em>${focusedCourse.required ? 'Required' : 'Elective'}</em></div>
      <div class="description">${focusedCourse.description}</div>
    </div>`
    document.querySelector('#target').innerHTML += details;
  }
}

function renderAvailableCourseContainer() {
  return `<div class="available"><h2>Available Courses</h2>
    <div class="courses">
      <div class="labels">
        <div>
          <span class="code-label">code</span>
          <span class="name-label">name</span>
        </div>
        <span class="credits-label">credits</span>
      </div>
    </div>
    </div>`
}

function renderAvailableCourses() {
  let target = document.querySelector("#target")
  let available = unselectedCourses();
  target.innerHTML +=  renderAvailableCourseContainer(); 
  let availableCoursesDiv = target.querySelector(".available .courses");
  for (course of available) {
    availableCoursesDiv.innerHTML += renderCourse(course);
    const element = availableCoursesDiv.lastChild;
  }
}

function renderHelp() {
  // find help from url, if present
  let helpActive = new URL(document.location).searchParams.get('help');
  if (helpActive) {
    let unfocusedUrl = new URL(document.location);
    unfocusedUrl.searchParams.delete('help');
    let help = `
  <div class="help">
    <a class="hide-detail" href="${unfocusedUrl}">hide</a>
    <p>Use this tool to chart your course through Kibo's <a href="https://kibo.school/degree">3-year BSc in Computer Science</a>.</p>
    <p>Drag and drop courses from the available courses to each term to plan your degree.</p>
    <ul>
    <li>Click 'show' to see a course's description and prereqs.</li>
    <li>Save or share the url. Your progress automatically updates in the address bar.</li>
    <li>Click 'Load Sample' to load a sample degree plan.</li>
  </ul>
  <p>Courses with a '*' are required courses. You can't move them.</p>
</div>`
    document.querySelector('#target').innerHTML += help;
  }
}

function renderAbout() {
  let about = document.querySelector('.about');
  let helpLink = new URL(document.location);
  helpLink.searchParams.set('help', true)
  // todo: figure out how to add the logo here but... not suck
  about.innerHTML += `
  <div>
    <h1>Kibo Degree Planner</h1>
  </div>`
  about.innerHTML += `<p><a href="${helpLink}">Help</a></p>`
  about.innerHTML += `<p><a href="https://kibo.school/degree-program">Degree Home</a></p>`
}

function render() {
  let target = document.querySelector("#target");
  target.innerHTML = "";
  target.innerHTML += "<div class='about'></div>"
  target.innerHTML += "<div class='mode'></div>"
  target.innerHTML += "<div class='sample'></div>"
  target.innerHTML += "<div class='info'></div>"
  renderAbout();
  renderHelp();
  renderTerms();
  renderMergedCourses();
  renderAvailableCourses();
  // renderModeSwitch();
  renderLoadSample();
  renderCourseDetails();
}

function renderLoadSample() {
  let sampleDiv = document.querySelector('.sample');
  sampleDiv.innerHTML = "<button>Load Sample</button>";
  sampleDiv.querySelector('button').addEventListener('click', e => {
    loadSample();
  })
}

function loadSample() {
  let sample = samplePrograms(mode)
    .map(course => transformKeys(course))
    .filter(course => !getRequired()
      .some(c => c.name == course.name)
    );
  chosenCourses = groupIntoYears(sample);
  render()
  savePlanToUrl()
}

function renderModeSwitch() {
  let modeDiv = document.querySelector('.mode');
  modeDiv.innerHTML = `
  <input type="radio" id="deac" name="mode" value="deac" ${mode == "deac" && "checked"}>
  <label for="deac">DEAC</label>
  <input type="radio" id="woolf" name="mode" value="woolf" ${mode == "woolf" && "checked"}>
  <label for="woolf">Woolf</label>
  `;
  let inputs = modeDiv.querySelectorAll('input')
  for (input of inputs) {
    input.addEventListener("click", (e) => {
      mode = event.target.value;
      render();
    });
  }
}

function setupDnd() {
  document.addEventListener('dragstart', (ev) => {
    let courseName = ev.target.querySelector('.name').innerText;
    event.target.style.opacity = .5;
    document.body.classList.add('dragging')
    ev.dataTransfer.setData("application/course", courseName);
    let term = ev.target.closest('.term');
    if (term) {
      ev.dataTransfer.setData('application/fromTerm', JSON.stringify({term: term.dataset.term, year: term.dataset.year}));
    }
  })
  document.addEventListener('dragend', ev => {
    // reset opacity after end drag
    document.body.classList.remove('dragging')
    ev.target.style.opacity = 1;
  });
  document.addEventListener('dragenter', (ev) => {
    let termTarget = ev.target.closest('.term');
    if (termTarget) {
      ev.preventDefault()
      termTarget.classList.add('droptarget')
    }
    let availableTarget = ev.target.closest('.available')
    if (availableTarget) {
      ev.preventDefault()
      availableTarget.classList.add('droptarget')
    }
  })
  document.addEventListener('dragleave', ev => {
    if (ev.target.classList.contains('term') || ev.target.classList.contains('available')) {
      ev.preventDefault()
      ev.dataTransfer.dropEffect = "move";
      ev.target.classList.remove('droptarget')
    }
  });
  document.addEventListener('dragover', ev => {
    ev.preventDefault();
  })
  document.addEventListener('drop', (ev) => {
    let termElement = ev.target.closest('.term');
    let courseName = ev.dataTransfer.getData("application/course")
    if (termElement) {
      termElement.classList.remove('droptarget');
      let { term, year } = termElement.dataset;
      console.log('adding', courseName, 'to', {term, year})
      let course = availableCourses().find(c => c.name == courseName);
      chosenCourses[year][term].push(course);
    }

    let fromTerm = ev.dataTransfer.getData('application/fromTerm');
    if (fromTerm) {
      fromTerm = JSON.parse(fromTerm);
      console.log('dropped from term', fromTerm)
      let old = chosenCourses[fromTerm.year][fromTerm.term];
      chosenCourses[fromTerm.year][fromTerm.term] = old.filter(c => c.name != courseName);
      console.log('removing', courseName, 'from', fromTerm.year, fromTerm.term, 'courses are now: ', )
    }
    render();
    savePlanToUrl()
  });
}

render();
setupDnd();
