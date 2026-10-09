const form = document.querySelector('.input form')
const suggestionsBox = document.querySelector('.suggestions-box');

const input = document.getElementById('searchBar')

// Displays
const output = document.querySelector('.assistant-display p')
const country = document.getElementById('country');
const city = document.getElementById('city');
const timeZone = document.getElementById('time-zone');

const time = document.getElementById('time'); // searched time
const period =document.getElementById('period'); // searched period
const localTime = document.getElementById('localTime');
const localPeriod = document.getElementById('localPeriod')

//Select
const selectZones = document.getElementById('timeZoneSelect');

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

loadLocations() // get saved locations from local storage
renderSavedLocations()
load12hour() // recover from local storage am / pm
getTime() // start local clock
loadZones(); // fetch once in the load page

async function loadZones () {
    output.textContent = 'Loading data..'    
    
    try {
        const res = await fetch(timezones);
        
        if (!res.ok) {
            console.log('Could not get data!');
            return
        } 
        
        output.textContent = 'Data received!'
        zonesData = await res.json();
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

    // ======'Select'========
    
    filteredData.forEach(zone => {
        const option = document.createElement('option');
        option.value = zone.timeZone;
        option.textContent = zone.timeZone;
        
        selectZones.appendChild(option);
    })
    //create a big array for the autocomplete
    countriesAndCities = filteredData.reduce((acc, item) => {
        acc.push(item.country, ...item.cities);
        return acc;
    }, [])
    
    return filteredData;
}




// so far the page loaded and filteredData and zonesData are saved




// ===============Events==============

// submit event
form.addEventListener('submit', (e) => {
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

    }
    saveLocations()
    renderSavedLocations();
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
        let span2 = document.createElement('span');
        let span3 = document.createElement('span');
        let span4 = document.createElement('span');
        let btnRemove = document.createElement('button');

        li.dataset.timezone = loc.timeZone;
        span1.classList.add('saved-city');
        span1.textContent = `${loc.cities[0]} `;
        span2.classList.add('saved-timeZone');
        span2.textContent = loc.timeZone;
        span3.classList.add('saved-time');
        span3.textContent = dateFormatter(loc.timeZone).timeVl;
        span4.classList.add('saved-period');
        span4.textContent = dateFormatter(loc.timeZone).periodVl;

        btnRemove.classList.add('removeBtn', 'btn')
        btnRemove.textContent = 'x';

        savedLocationsUl.append(li);
        li.append(p1, p2);
        p1.append(span1, span2);
        p2.append(span3, span4, btnRemove);

        }
    )
}


// ============Search============

async function updateText (input) {
    
    if(!filteredData) {
        output.textContent = 'Could not load data'
        return
    } else {
        // check if input matches
        const result = filteredData.find(value => 
            value.country.toLowerCase() === input.toLowerCase() ||
            value.cities.some(x => x.toLowerCase() === input.toLowerCase()) || //some gets true or false
            value.timeZone.toLowerCase() === input.toLowerCase()    // the timezone do not get altered, keep it mix letters
        )

        
        if (result) {
            //text update
            country.textContent = result.country;
            city.textContent = result.cities.find(x => x.toLowerCase() === input.toLowerCase()) ?? result.cities[0];
            timeZone.textContent = result.timeZone;
            //update input value 
            input.value = '';
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
            timeZone: zone,
        }).formatToParts(now);

        let timeVl = formatterZone.filter(({type}) => ['hour', 'minute', 'second'].includes(type))
        .map(({value}) => value)
        .join(':');

        let periodVl = formatterZone.find(({type}) => type === 'dayPeriod')?.value;

        return ({timeVl, periodVl})
}


//selected time zone display
function getTime () {
    clearTimeout(timeoutId);

    //get the local time
    localTime.textContent = dateFormatter(localZone).timeVl;
    localPeriod.textContent = dateFormatter(localZone).periodVl;
    
    if (!selectedZone) {
        output.textContent = 'Search something..'
    } else {
        //update the time
        time.textContent = dateFormatter(selectedZone).timeVl;
        period.textContent = dateFormatter(selectedZone).periodVl;
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
        const timeDisplay = li.querySelector('.saved-time')
        const periodDisplay = li.querySelector('.saved-period')
        timeDisplay.textContent = dateFormatter(zone).timeVl;
        periodDisplay.textContent = dateFormatter(zone).periodVl;
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
        updateHighlights (divs, eventIndex);ß
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


