
// datetimepicker
$(function () {
  $.extend(true, $.fn.datetimepicker.defaults, {
    icons: {
      time: 'far fa-clock',
      date: 'far fa-calendar',
      up: 'fas fa-arrow-up',
      down: 'fas fa-arrow-down',
      previous: 'fas fa-chevron-left',
      next: 'fas fa-chevron-right',
      today: 'far fa-calendar-check-o',
      clear: 'far fa-trash',
      close: 'far fa-times'
    }
  });
});

$(function () {
  $('.datetimepicker').datetimepicker();
});

// Initial step
fetch("data.json")
  .then(toJSON)
  .then(initApp)
  .catch(handleErrors);

let hotelData;

function toJSON(response) {
  return response.json();
}

function handleErrors(error) {
  // Might be a network error and we need to catch it...
}

function initApp(data) {
  // console.log( data );
  hotelData = data;
  // window.dataDebug = data; // Debugging only
  // Also use: store as global variable DevTools option

  // 1) HANDLE EVENTS
  const hotels = hotelData[1].entries;
  const roomsizes = hotelData[0].roomtypes;

  //populate autocomplete for search bar
          //  if i transfer lines 51-62 into a function, I can't make it work !?
  let temp = {}
  for (let i = 0; i < hotels.length; i++) {
    temp[hotels[i].city] = hotels[i].city;
  }
  arrayDistinctCities = [];
  for (let o in temp) {
    arrayDistinctCities.push(temp[o]);
  }

  $(".js-autocomplete").autocomplete({
    source: arrayDistinctCities
  });

  //check in, check out
    // no further action required

  //populate roomtypes (dynamically)
  appendRoomtypes(roomsizes);

  //set slider Limits (dynamically)
  setSliderLimits(hotels);

  //populate hotel location (dynamically)
  appendHotelLocation(arrayDistinctCities);

  //populate sort options (dynamically)
  appendSortingOptions(hotels);

  // 2) HANDLE FILTERING
  // 3) HANDLE OUTPUT (DOM)

  $('.js-price-slider').on('input', function (ev) {
    let currentValue = ev.target.value;
    $('.js-slider-value').text(currentValue);
  });

  $('.js-price-slider').trigger('input'); // blank issue

  //submit form listener
  $('.js-form').on('submit', function (ev) {
    ev.preventDefault();
    entriesFound = filterHotelsOnEvent (hotels);
    displayResults(entriesFound);
  });

  //change form listener
  $('.js-form').on('change', function (ev) {
    ev.preventDefault();
    entriesFound = filterHotelsOnEvent (hotels);
    displayResults(entriesFound);
  });

}

//populates roomtypes (dynamically)
function appendRoomtypes(roomsizes) 
{
  arrayRoomtypes = [];
  for (let i = 0; i < roomsizes.length; i++) {
    arrayRoomtypes.push(roomsizes[i].name);
  }
  arrayRoomtypes = arrayRoomtypes.sort();
  arrayRoomtypes.forEach(roomtype => {
    $('.js-roomtype').append(`<option value="${roomtype}">${roomtype}</option>`);
  });
}

//sets slider Limits (dynamically)
function setSliderLimits(hotels) 
{
  let min = hotels[0].price;
  let max = hotels[0].price;

  for (let i = 1; i < hotels.length; i++) {
    let value = hotels[i].price;
    if (value < min) min = value;
    if (value > max) max = value;
  }

  $('.js-price-slider').attr({ "max": max, "min": min, "value": max });
}

//populates hotel location (dynamically)
function appendHotelLocation(arrayDistinctCities) 
{
  arrayDistinctCities.forEach(city => {
    $('.js-hotel-location').append(`<option value="${city}">${city}</option>`);
  });
}

//populates sort options (dynamically)
function appendSortingOptions(hotels) 
{
  let sortingOptionsObj = {};
  let sortingOptions = [];

  hotels.forEach(function (entry) {
    entry.filters.forEach(function (filter) {
      sortingOptionsObj[filter.name] = true;
    });
  });

  for (let filter in sortingOptionsObj) {
    sortingOptions.push(filter);
  }

  sortingOptions = sortingOptions.sort();

  sortingOptions.forEach(filter => {
    $('.js-sort').append(`<option value="${filter}">${filter}</option>`);
  });

}

//HANDLES FILTERING
function filterHotelsOnEvent (hotels) 
{
  entriesFound = [];
  let inputText = $('#search-bar').val();
  let autocompleteSelected = $('.js-autocomplete').val();
  let ratingStarsSelected = parseInt($('.js-rating-stars').val());
  let guestRatingSelected = $('.js-guest-rating').val();
  let maxPriceSelected = parseInt($('.js-price-slider').val());
  let sortSelected = $('.js-sort').val();
  let hotelLocationSelected = $('.js-hotel-location').val();

  hotels.forEach(entry => {

    if (entry.price <= maxPriceSelected &&
      (entry.rating === ratingStarsSelected || ratingStarsSelected === 0) &&
      (entry.ratings.text === guestRatingSelected || guestRatingSelected === 'All') &&
      (entry.city === autocompleteSelected || autocompleteSelected === '' || (entry.city.toLowerCase()).includes(inputText.toLowerCase())) &&
      (entry.city === hotelLocationSelected || hotelLocationSelected === 'All')
    ) {
      let sortFound = false;

      if (sortSelected === 'All') {
        sortFound = true;
      } else {
        entry.filters.forEach(function (filter) {
          if (filter.name === sortSelected) {
            sortFound = true;
          }
        })
      }

      if (sortFound) {
        entriesFound.push(entry);
      }
    }
  });

  console.log('found', entriesFound);
return entriesFound;}

// displays hotels ( for this impl, the hotels which were found after filtering ) 
function displayResults(entriesFound) {
  let output = "";
  let len = entriesFound.length;
  for (let i = 0; i < len; i++) {
    output += renderHotel(entriesFound[i]);
  }
  document.querySelector(".js-search-results").innerHTML = output;
}


function renderHotel(hotelObj) 
{
  const template = `
  <div class="form-row hotel shadow pb-2 mb-2 bg-white rounded">
  <div class="col-3" style="background-color:white;">
    <img src="${hotelObj.thumbnail}" alt="hotel-img" style="width:100%; height:200px; object-position: 50% 50%; object-fit: fill;">
  </div>

  <div class="col-4 border-right bg-white">
    <h4>${hotelObj.hotelName}</h4>
    <p><span class="stars">${renderStars(hotelObj.rating)}</span>&nbsp;Hotel</p>
    <p>${hotelObj.city}</p>
    <p><div class="d-inline text-white bg-success p-2">${hotelObj.ratings.no}</div> &nbsp; <strong>${hotelObj.ratings.text}</strong></p>
    <p>Excellent location</p>
  </div>

  <div class="col-2 bg-white">
    <div class="btn-group-vertical d-flex justify-content-center">
      <button type="button" class="btn btn-outline-primary btn-sm pb-1"><strong>Hotel website <br> ${hotelObj.price} <i class="fas fa-euro-sign"></i> </strong></button>
      <button type="button" class="btn btn-outline-secondary btn-sm pb-1">Travelocity <br> ${Math.round(hotelObj.price * 0.96)} <i class="fas fa-euro-sign"></i> </button>
      <button type="button" class="btn btn-outline-secondary btn-sm pb-1">HappyTravel <br> ${Math.round(hotelObj.price * 0.98)} <i class="fas fa-euro-sign"></i> </button>
      <button type="button" class="btn btn-outline-dark btn-sm border-top pb-1"><strong>More details from <br> ${Math.round(hotelObj.price * 0.95)} <i class="fas fa-euro-sign"></i> </strong></button>
    </div>
  </div>

  <div class="col-3 border-left d-flex flex-column justify-content-center align-items-center bg-white">
    <div class="h6 text-success">Hotel website</div>
    <div class="h3 text-success"><strong>${hotelObj.price} <i class="fas fa-euro-sign"></i></strong></div>
    <div class="h6">3 nights for <strong> <span class="text-success"> ${hotelObj.price * 3} <i class="fas fa-euro-sign">  </span></i></strong></div>

    <button type="button" class="btn btn btn-success btn-md pb-1 position-absolute cta-btn">
      View Deal <i class="fas fa-angle-right"></i>
    </button>
  </div>

</div>
`;
  return template;
}

function renderStars(number) 
{
  let output = '';
  for (let index = 1; index <= 5; index++) {
    let starClass = index <= number ? 'checked' : '';
    output += `<i class="fas fa-star ${starClass}"></i>`
  }
  return output;
}

