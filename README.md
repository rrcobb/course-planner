# Kibo Course Planner

Drag and drop available courses onto the terms to plan courses for the Kibo program.

## How it works

`available_courses.js` lists the available course information.

`fixed_courses.js` lists the courses that students are required to take in a particular term.

`script.js` uses these course lists to render the terms and the pool of available courses. It sets up drag and drop, and rerenders the whole page when a change is made.

Edit the courses in those files to change what's available.

Right now, a ton of the code is relying on unique course names to work; it'd probably be good to switch to ids at some point.

## Features / TODO

- design:
  - spacing on the terms
  - replace 'Year' with a program summary at the top

- code colors - should match the department, or we need to explain the 'pillars'

- clicking outside of details should hide overlay
- prereq / degree checking
- Curriculum healthcheck
- Fix Woolf / FL toggle (or remove Woolf)
- change names to European / US for credits
    - change only credit display, instead of courses listed?
    - display both european + US credit equivalents

- testing
  - fastcheck fuzzing
  - testing-library integration tests
- Degree 'offramps' after 1 year (term 4), 2 years (term 8)
    - choose target from dropdown?
- Versioning the course list in the saved urls (e.g. Woolf '21, FL '22, saved
    as a byte, so that when the course list changes, the urls still work or
    gracefully fail)

## TODO

TODO: rendering improvements
  * spacing / niceness: lay out like in ppt slide?
  * descriptions for skll, tech, thry, prtc, colors
  * rendering on wide screens

## Validation

TODO: validateTerm - check that a term is healthy
  * undersubscribed
  * oversubscribed
  * balance of course types
  * course section meeting times work!
  * courses are actually _offered_ that term

TODO: allowedCourse - check that a course is allowed
 - can't have 'normal' courses in term with industry experience or capstone project (probably)
 - [x] can't move a fixed course
 - can't drop when prereqs not met
   - Feature should _probably_ allow drops, but highlight invalid courses

TODO: validateProgram - check that the whole program is healthy
 - check that each course + term is valid
 - check enough total credits / correct spread of credits?
 - check that required courses for degree program are present

## Future, if "productionalized" in some way

TODO: export for enrollment, or button-click enrollment
TODO: log into SIS to fetch your actual courses
TODO: mark terms as completed?
TODO: degree program requirements for different degrees

TODO: account for different starts, drops / fails
  mostly, less "fixed" courses, in all likelihood

// distinguish required vs fixed courses.
// i.e. courses that are mandatory vs. ones that must be taken at a specific time

TODO: export merged courses?
TODO: search for courses / filter by prerequisites

# Notes
## Credits

Courses are currently listed for either 3 or 6 credits.

Can toggle between DEAC (US Quarter Credit Hours) and Woolf (ECTS credits)

~16 credits is about the target per term, but some terms end up more or less. We may revise the number of credits for some courses.

### Prerequisites

Expressing prereqs is sometimes hard: some are just courses, some are arbitrary strings. 
- For Woolf, they're strings.
- For FL, it's just other courses, so less complicated

The record ids for prerequisites are in an array (prerequisites) and there's a
'prereqs' string with the course titles... we could use them somehow

### Required and Fixed Courses

Right now, the required courses are "fixed" - they must be taken in a particular term. 

### Canonical Courses

https://airtable.com/appyYlMEGQNM5FwZt/tblFyHzQkLnABd6lR/viwlzOdzoWkTdbzZI?blocks=hide

This is just one view of the courses, and quickly grows outdated.

To update the courses

1. Go to https://airtable.com/appyYlMEGQNM5FwZt/api/docs#curl/table:courses:list
2. Turn on the api key toggle and click to the curl version
3. copy the curl version with the `-H Authorization` header
4. modify the command to add the fields below

```
&fields=Name&fields=Required&fields=Kind&fields=Type&fields=FL&fields=Description&fields=Woolf&fields=prereqs&fields=Sample%20Degree&fields=Quarter%20%28Woolf%20plan%29&fields=Quarter%20%28sample%202%29&fields=Credit%20Hours&fields=ECTS%20Credits&fields=Course%20Code%20%28FL%29&fields=Prerequisites%20%28FL%29
```

5. curl the records to a file called `download.json` 
6. convert the downloaded files to a json array, `node convert.js`
7. copy that array, replace the variable assignment in `airtableCourses.js`

### Sample Programs

Currently, there's one sample degree for the FL / DEAC program.

TODO: 

* add more sample programs, as we add more courses
* create 'specializations' that pre-select courses
* effectively "templates" for planning the degree

E.g. what does it look like to specialize in "Data Science" or in "App Development" or in "Systems Programming".

# Features

## Saving course urls

When you make a change, the url updates with a representation of the currently selected set of courses. If you load that url, it will reload with that set of courses. That means you can share the url, and someone else can see the same course plan that you built.

I think this feature is neat, because it uses some cool features in JavaScript: Uint8Array, base64 encoding with btoa and atob, run-length encoding, and bit-packing. It only works so long as there are fewer than 16 terms :D, and it is only small given that there are lots of 'runs' of courses (that's the run-length encoding part). It should nearly-always be less than the total number of courses offered, in bytes, which is pretty cool.

For the urls to continue to work, the _order of the courses in 'airtableCourses' is significant_. This is a bit of a weird constraint, and it's just how the serialization to url is written right now. Since I am literally the only person using this right now, it's okay, but eventually, this has to be fixed. Adding ids to the courses in airtable, increment-only there, exporting with that field, and sorting the data before serialization / deserialization would do the trick.

## Drag and drop

The HTML drag and drop api is a huge pain in the butt. There's a large and somewhat confusing API surface area, with lots of events that need to be listened to.

Since we're adding and removing elements all the time, the listeners are all attached to the `document`, and we're relying on event bubbling to actually get the events.

See the `setupDnd` function for the actual code. It adds listeners for:
- `dragstart`
- `dragend`
- `dragenter`
- `dragleave`
- `dragover`
- `drop`

All of which are required to make the drag and drop functionality work as expected.

The course divs also get the `draggable="true"` attribute, which makes a little more sense. (Fixed courses are not draggable right now, since you have to take them in a particular term.)

### Pointer hack

There's a weird part of the drag and drop spec, where a 'dragleave' event is fired on a parent element when the drag location enters one of its children. That leads to a lot of weirdness if you use the dragenter and dragleave events to add and remove the styles indicating where the drop will occur (here, we change the background color of the courses box to show where the course will be added). There's a line of css to fix this, setting `pointer-events: none` on all the children of the active box, so that they don't ever see the drag events. It's kinda messed up that the spec requires this hack, but there you go.
