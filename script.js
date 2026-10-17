const formInput = document.querySelector('#main-input-form')
const suggestionsBox = document.querySelector('.suggestions-box');

const input = document.getElementById('searchBar')

// Displays
const output = document.querySelector('.assistant-display p')
const country = document.getElementById('country');
const city = document.getElementById('city');
const timeZone = document.getElementById('time-zone');

const time = document.getElementById('time'); // searched time
const period =document.getElementById('period'); // searched period
const offset = document.getElementById('offset');
const localZoneDisplay = document.getElementById('localZoneDisplay');
const localTime = document.getElementById('localTime');
const localPeriod = document.getElementById('localPeriod');
const localOffset = document.getElementById('localOffset');


//Select for the input
const selectZones = document.getElementById('timeZoneSelect');
// Select for the converter
 

// Buttons add / remove
const addLocationBtn = document.querySelector('#add-location-btn');


let savedLocations = []; //array with obj


//===================API===================

const timezones = 'https://api.timezones.in/v1/timezones';

let zonesData; //all the api array w obj
let filteredData;   //only the values I need / array w obj
let selectedZone; // assign every time a different zone / string
let localZone =  Intl.DateTimeFormat().resolvedOptions().timeZone; // find local timezone / string
let timeoutId; // for running and stopping the function


let is12hour; // true or false
const btn12h = document.getElementById('toggle12hour');

let countriesAndCities; // array for autocomplete / only the names - strings
let savedLocationsUl = document.querySelector('.saved-zones-container');


async function loadZones () {
    output.textContent = 'Loading data..'    
    
    try {
        const res = await fetch(timezones);
        
        if (!res.ok) {
            console.log('Could not get data!');
            return
        } 
        
        zonesData = await res.json();
        output.textContent = 'Search something..'
        return extractData(zonesData);
        
    } catch (er) {
        console.log(`Fetch error: ${er.message}!`);
    }
    
    output.textContent = zonesData ? '' : 'Could not load data';
}

// ==========format the obj to my needs============

function extractData (data) {
    filteredData = data.map((item) => { 
        return {
            country: item.countryName,
            cities: item.mainCities,
            timeZone: item.name
        }
    }); 
    
    // ======'Select (all of them)'========
        // fill select input, and both the one in the convert area
        fillSelect(selectZones)
        fillSelect(convertFromTimezone)
        fillSelect(convertToTimezone)

    //create a big array for the autocomplete
    countriesAndCities = filteredData.reduce((acc, item) => {
        acc.push(item.country, ...item.cities);
        return acc;
    }, [])
    
    return filteredData;
}

function fillSelect (select) {
        filteredData.forEach(zone => {
        const option = document.createElement('option');
        option.value = zone.timeZone;
        option.textContent = zone.timeZone;
        
        // fill select input, and both the one in the convert area
        select.appendChild(option);
    })
}




// so far the page loaded and filteredData and zonesData are saved




// ===============Events==============

// submit event
formInput.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const userInput = input.value.trim();
    
    updateText(userInput);
    
    input.value = '';
})

// select event
selectZones.addEventListener('change', () => {
    clearTimeout(timeoutId);
    selectedZone = selectZones.value;
    updateText(selectedZone);
})

// 'Add location' & 'remove' btn event
addLocationBtn.addEventListener('click', (e) => {
    
    if (!selectedZone) return;
    
    let chosenLocation = filteredData.find(item => item.timeZone.toLowerCase() === selectedZone.toLowerCase());
    
    if(!chosenLocation) return;
    
    let alreadySaved = savedLocations.some(item => 
        item.timeZone === chosenLocation.timeZone) 
        
        if(!alreadySaved) {
            savedLocations.push(chosenLocation);
            saveLocations();
            renderSavedLocations()
        }
        
    })
    
// remove list btn
savedLocationsUl.addEventListener('click', (e) => {
if (e.target.classList.contains('removeBtn')) {
    const li = e.target.closest('li');
    
    savedLocations = savedLocations.filter(
        item => item.timeZone !== li.dataset.timezone);
        
        saveLocations()
        renderSavedLocations();
    }
})

// 12hour btn
btn12h.addEventListener('click', () => {
    is12hour = !is12hour;
    
    localStorage.setItem('is12hour', JSON.stringify(is12hour))
    
    btn12h.querySelector('button').textContent = is12hour ? '12h' : '24h';
    
    clearTimeout(timeoutId);
    getTime();
})


// =========Local Storage==========

// save locations 
function saveLocations() {
    localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
}

// load AM / Pm
function load12hour (){
    const load12 = JSON.parse(localStorage.getItem('is12hour'));
    
    is12hour = load12 ?? true
    
    btn12h.querySelector('button').textContent = is12hour ? '12h' : '24h';
}

//load locations when page loads
function loadLocations() {
    let storedLocations = localStorage.getItem('savedLocations');
    
    if(!storedLocations) return;
    
    try {
        savedLocations = JSON.parse(storedLocations);
        output.textContent = 'Search something'

    } catch (error) {
        output.textContent = error;
        localStorage.removeItem('savedLocations');
        savedLocations = [];
    }
}







// render the li for every 'add location' click
function renderSavedLocations() {
    savedLocationsUl.replaceChildren();

    savedLocations.forEach((loc) => {
        let li = document.createElement('li');
        let p1 = document.createElement('p');
        let p2 = document.createElement('p');
        let span1 = document.createElement('span');
        // let span2 = document.createElement('span');
        let span3 = document.createElement('span');
        let span4 = document.createElement('span');
        let span5 = document.createElement('span');
        let btnRemove = document.createElement('button');

        li.dataset.timezone = loc.timeZone;
        p1.classList.add('saved-city-offset');
        p2.classList.add('saved-time-period-btn')
        span1.classList.add('saved-city');
        span1.textContent = `${loc.cities[0]} `;
        // span2.classList.add('saved-timeZone');
        // span2.textContent = loc.timeZone;
        span3.classList.add('saved-time');
        span3.textContent = dateFormatter(loc.timeZone).timeVl;
        span4.classList.add('saved-period');
        span4.textContent = dateFormatter(loc.timeZone).periodVl;
        span5.classList.add('saved-offset');
        span5.textContent = dateFormatter(loc.timeZone).offsetVl;

        btnRemove.classList.add('removeBtn', 'btn')
        btnRemove.textContent = 'x';

        savedLocationsUl.append(li);
        li.append(p1, p2, btnRemove);
        p1.append(span1, span5);
        p2.append(span3, span4);

        }
    )
}


// ============Search============

async function updateText (inp) {
    
    if(!filteredData) {
        output.textContent = 'Could not load data'
        return
    } else {
        // check if input matches
        const result = filteredData.find(value => 
            value.country.toLowerCase() === inp.toLowerCase() ||
            value.cities.some(x => x.toLowerCase() === inp.toLowerCase()) || //some gets true or false
            value.timeZone.toLowerCase() === inp.toLowerCase()    // the timezone do not get altered, keep it mix letters
        )

        
        if (result) {
            //text update
            country.textContent = result.country;
            city.textContent = result.cities.find(x => x.toLowerCase() === inp.toLowerCase()) ?? result.cities[0];
            timeZone.textContent = result.timeZone;
            //update input value 
            inp.value = '';
            //update the selectedZone variable
            selectedZone = result.timeZone; // assign to the result the selected zone
            //update the select
            selectZones.value = selectedZone;
            getTime();

        } else {
            output.textContent = 'No matching timezone found';
            return
        }
    }
}

function dateFormatter (zone) {
    const now = new Date();

        const formatterZone = Intl.DateTimeFormat('en-US', {
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: is12hour,
            hourCycle: 'h23',
            timeZone: zone,
            timeZoneName: 'shortOffset'
        }).formatToParts(now);

        let timeVl = formatterZone.filter(({type}) => ['hour', 'minute', 'second'].includes(type))
        .map(({value}) => value)
        .join(':');

        let periodVl = formatterZone.find(({type}) => type === 'dayPeriod')?.value;

        let offsetVl = formatterZone.filter(({type}) => type === 'timeZoneName').map(({value}) => value)[0];


        return ({timeVl, periodVl, offsetVl})
}


//selected time zone display
function getTime () {
    clearTimeout(timeoutId);

    //get the local time
    localZoneDisplay.textContent = localZone;
    localTime.textContent = dateFormatter(localZone).timeVl;
    localPeriod.textContent = dateFormatter(localZone).periodVl;
    localOffset.textContent = dateFormatter(localZone).offsetVl;

    if (selectedZone) {
        //update the time
        time.textContent = dateFormatter(selectedZone).timeVl;
        period.textContent = dateFormatter(selectedZone).periodVl;
        offset.textContent = dateFormatter(selectedZone).offsetVl;
    }

    //update all list/saved items
    updateSavedTimes();

    timeoutId = setTimeout(() => getTime(), 1000);
}

function updateSavedTimes () {
    const liItems = savedLocationsUl.querySelectorAll('li');

    if(!liItems) return;

    liItems.forEach(li => {
        const zone = li.dataset.timezone;
        li.querySelector('.saved-time').textContent = dateFormatter(zone).timeVl;
        li.querySelector('.saved-period').textContent = dateFormatter(zone).periodVl;
        li.querySelector('.saved-offset').textContent = dateFormatter(zone).offsetVl;
    })
}

// ==========auto fill===========
const suggestions = document.querySelector('.suggestions');

input.addEventListener('input', () => {
    
    suggestionsBox.replaceChildren();

    const searchTerm = input.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        return
    }
    
    if (countriesAndCities) {
        countriesAndCities.forEach(item => {
            if(item.toLowerCase().includes(searchTerm)) {
                const div = document.createElement('div');
                div.classList.add('suggestions');
                div.textContent = item;
                suggestionsBox.appendChild(div);
                
                
                // click event for select
                div.addEventListener('click', () => {
                    input.value = item; // update searchBar (city or country)
                    updateText(item);
                    
                    const divs = document.querySelectorAll('.suggestions'); //clear all divs
                    divs.forEach(div => div.remove())
                })
            }
        })
    } else {
        output.textContent = 'Server error!'
    }
})
    
// input arrow down event
let eventIndex = -1;

input.addEventListener('keydown', (e) => {
    const divs = document.querySelectorAll('.suggestions');

    
    if (e.key === 'ArrowDown') {
        
        eventIndex ++;
        updateHighlights (divs, eventIndex);
        
    } else if (e.key === 'ArrowUp') {
        eventIndex --;
        updateHighlights (divs, eventIndex);
    } else if (e.key === 'Escape') {
        eventIndex = -1;
        suggestionsBox.replaceChildren()            
    } else if (e.key === 'Enter') {
        suggestionsBox.replaceChildren()            
    }
})

function updateHighlights (divs, idx) {
    divs.forEach(div => div.classList.remove('highlight'))
    
    if (idx >= 0 && idx < divs.length) {
        divs[idx].classList.add('highlight');
        input.value = divs[idx].textContent;
        
    } else if (idx >= divs.length && divs.length > 0) {
        divs[0].classList.add('highlight');
        input.value = divs[0].textContent;
        return eventIndex = 0;
        
    } else if (idx < 0 && divs.length > 0) {
        divs[divs.length - 1].classList.add('highlight');
        input.value = divs[divs.length - 1].textContent;
        
        return eventIndex = divs.length - 1;
    }
}

// mouse hover highlight events
suggestionsBox.addEventListener('mouseover', (e) => {
    const divs = document.querySelectorAll('.suggestions');

    divs.forEach((div, i) => {
        if (e.target.closest('.suggestions') === div) {
            eventIndex = i;
            updateHighlights(divs, eventIndex);
        }
    });
})

suggestionsBox.addEventListener('mouseleave', () => {
    const divs = document.querySelectorAll('.suggestions');
    divs.forEach(div => div.classList.remove('highlight'))
    eventIndex = -1;
});



// ============== Time Converter ==================
// The inputs
const convertFromTimezone = document.getElementById('convertFromTimezone');
const convertToTimezone = document.getElementById('convertToTimezone');
const convertFromTime = document.getElementById('convertFromTime');
const convertFromDate = document.getElementById('convertFromDate');
const convertForm = document.querySelector('#time-converter form');
const converterInputs = [convertFromDate, convertFromTime, convertFromTimezone, convertToTimezone];

// The displayed result
const convertedDate = document.querySelector('.converted-date');
const convertedTime = document.querySelector('.converted-time');
const convertedTimezone = document.querySelector('.converted-timezone');
const result = [convertedDate, convertedTime, convertedTimezone]

const convertButton = document.getElementById('convert');


// Check if all are filled, then automatically display the result
function checkIfFilled (inputs) {
    let everythingFilled = true;
    inputs.forEach(input => {
        if (input.value === '' || input.value === 'Timezone') {
             everythingFilled = false;
        } 
    })
    return everythingFilled;
}

// if all inputs are filled then do the conversion
convertForm.addEventListener('input', (e) => {
    if (checkIfFilled(converterInputs)) {
        convertTime();
    } else {
        result.forEach(p => p.textContent = '');
    }
})
    

function convertTime () {
    let convertedDateTimeNZone = Temporal.ZonedDateTime.from({
        year: convertFromDate.value.split('-')[0],
        month: convertFromDate.value.split('-')[1],
        day: convertFromDate.value.split('-')[2],
        hour: convertFromTime.value.split(':')[0],
        minute: convertFromTime.value.split(':')[1],
        timeZone: convertFromTimezone.value
    }).withTimeZone(convertToTimezone.value);

    convertedDate.textContent =`${String(convertedDateTimeNZone.day).padStart(2, '0')}-${String(convertedDateTimeNZone.month).padStart(2, '0')}-${String(convertedDateTimeNZone.year).padStart(2, '0')}`;

    convertedTime.textContent = `${String(convertedDateTimeNZone.hour).padStart(2, '0')}:${String(convertedDateTimeNZone.minute).padStart(2, '0')}:${String(convertedDateTimeNZone.second).padStart(2, '0')}`;

    convertedTimezone.textContent = `${convertedDateTimeNZone.timeZoneId}`;
}


    





// ======== Footer ========

const footerDate = document.getElementById('footerDate');
const footerYear =  new Date().getFullYear();
footerDate.textContent = `${footerYear}`;

loadLocations() // get saved locations from local storage
load12hour() // recover from local storage am / pm
renderSavedLocations()
getTime() // start local clock
loadZones(); // fetch once in the load page
