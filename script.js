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

let is12hour = true;
const btn12h = document.getElementById('12hour');

let countriesAndCities; // array for autocomplete / only the names - strings
let savedLocationsUl = document.querySelector('.saved-zones-container');

loadLocations() // get saved locations from local storage
renderSavedLocations()
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
        getTime();
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
    
    clearTimeout(timeoutId);


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
btn12h.addEventListener('click', (e) => {
    e.target.closest('#12hour');
    is12hour = !is12hour;
    //!jhsdjhhhjjkjhsd
})




// save locations to local storage
function saveLocations() {
    localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
}

//load them when page loads
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
        span3.textContent = dateFormatter(loc.timeZone);
        span4.classList.add('saved-period');

        //!add text to span4 for the period

        btnRemove.classList.add('removeBtn', 'btn')
        btnRemove.textContent = 'x';

        savedLocationsUl.append(li);
        li.append(p1, p2);
        p1.append(span1, span2);
        p2.append(span3, btnRemove);
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
            timeZone: zone
        }).formatToParts(now);

        let timeVl = formatterZone.filter(({type}) => ['hour', 'minute', 'second'].includes(type))
        .map(({value}) => value)
        .join(':');

        

        return ({timeVl, periodVl});


    }
}

//selected time zone display
function getTime () {
    //get the local time
    localTime.textContent = dateFormatter(localZone);
    
    if (!selectedZone) {
        output.textContent = 'Search something..'
    } else {
        //update the time
        time.textContent = dateFormatter(selectedZone);
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
        timeDisplay.textContent = dateFormatter(zone);
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
            
            div.addEventListener('click', () => {
                input.value = item; // update searchBar (city or country)
                updateText(item);

                const divs = document.querySelectorAll('.suggestions'); //clear all divs
                divs.forEach(div => div.remove())
            })
    }})

    
    
})


