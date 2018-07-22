let restaurant;
let map;
let once = false;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: self.restaurant.latlng,
        scrollwheel: false
      });
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        // google.maps.event.addListener(this.map, 'tilesloaded', function() {
        //     let images = document.querySelectorAll('#map img');
        //     images.forEach(function(image) {
        //         image.alt = "Google Maps Image";
        //     });
        // });
};

document.addEventListener('DOMContentLoaded', (event) => {
        fetchRestaurantFromURL((error, restaurant) => {
            if (error) { // Got an error!
                console.error(error);
            }
            else{
                fillBreadcrumb();
            }
        });
});

document.addEventListener('wheel', () => {
    if(!once) {
        once = true;
        initMap();
        //fillBreadcrumb();
    }
});

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      registerServiceWorker();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = restaurant.name;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {

  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

    if(!window.navigator.onLine) {

        //create offline connection notice
        const notifyOfflineConnection = document.createElement('p');
        notifyOfflineConnection.innerHTML = "Connection is now offline. Adding reviews is still available";
        notifyOfflineConnection.setAttribute('id', 'offline-notice');
        container.appendChild(notifyOfflineConnection);
    }

  const addReviewButton = document.createElement('button');
  addReviewButton.setAttribute('class', 'add-review');
  addReviewButton.innerHTML = "Add Review";
  container.appendChild(addReviewButton);

  //form
  const addReviewForm = document.createElement('form');
  addReviewForm.setAttribute('id', 'add-review-form');
  addReviewForm.setAttribute('style', 'display: none');
  container.appendChild(addReviewForm);

  //form title
  const addReviewTitle = document.createElement('h5');
  addReviewTitle.innerHTML = "Add Review";
  addReviewForm.appendChild(addReviewTitle);

  //container div
    const addReviewContainer = document.createElement('div');
    addReviewContainer.setAttribute('class', 'review-form-container');
    addReviewForm.appendChild(addReviewContainer);


  //form name of user
    const userNameLabel = document.createElement('label');
    userNameLabel.innerHTML = 'Username: ';
    addReviewContainer.appendChild(userNameLabel);

    const userName = document.createElement('input');
    userName.setAttribute('id', 'user-name');
    userName.setAttribute('type', 'text');
    userName.setAttribute('placeholder', 'Username');
    addReviewContainer.appendChild(userName);



    //select review rate

    const ratingLabel = document.createElement('label');
    ratingLabel.innerHTML = 'Rate restaurant: ';
    addReviewContainer.appendChild(ratingLabel);

    const selectReviewRate = document.createElement('select');
    selectReviewRate.setAttribute('class', 'rate-select');
    addReviewContainer.appendChild(selectReviewRate);



    for(let i = 5; i >= 1 ; i--){
        const optionReviewRate = document.createElement('option');
        optionReviewRate.innerHTML = `${i}`;
        optionReviewRate.setAttribute('value', `${i}`);
        selectReviewRate.appendChild(optionReviewRate);
    }

    //comments

    const commentsLabel = document.createElement('label');
    commentsLabel.innerHTML = 'Add Comments: ';
    addReviewContainer.appendChild(commentsLabel);

    const comments = document.createElement('input');
    comments.setAttribute('id', 'review-comments');
    comments.setAttribute('type', 'text');
    comments.setAttribute('placeholder', 'Add comments');
    addReviewContainer.appendChild(comments);



    //submit button
    const submitButton = document.createElement('button');
    submitButton.setAttribute('class', 'submit-review');
    submitButton.innerHTML = "Submit";
    addReviewContainer.appendChild(submitButton);



  addReviewButton.addEventListener('click', () => {
      addReviewForm.setAttribute('style','display: block');
  });

    submitButton.addEventListener('click', (e) => {
      e.preventDefault();

      const formData = {
          restaurant_id: self.restaurant.id,
          name: userName.value,
          rating: selectReviewRate.value,
          comments: comments.value

      };

      DBHelper.addNewReview(formData).then((response) => {
          console.log(response + "---------");
          if(!window.navigator.onLine){

              //update reviews from local storage
              let reviews = JSON.parse(window.localStorage.getItem('reviews'));
              reviews.push(response);
              window.localStorage.setItem('reviews', JSON.stringify(reviews));

          }
      });

    });

    DBHelper.getAllReviewsForRestaurant(self.restaurant.id).then((reviews) => {
        if (!reviews) {
            const noReviews = document.createElement('p');
            noReviews.innerHTML = 'No reviews yet!';
            container.appendChild(noReviews);
            return;
        }
        if(!window.navigator.onLine){
            reviews = JSON.parse(window.localStorage.getItem('reviews'));
        }

        const ul = document.getElementById('reviews-list');
        reviews.forEach(review => {
            ul.appendChild(createReviewHTML(review));
        });
        container.appendChild(ul);

        window.localStorage.setItem('reviews', JSON.stringify(reviews));
    });
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Register serviceWorker
 */
registerServiceWorker = () => {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.register('/serviceWorkerCache.js').then(() => {
        console.log('Registration worked!');
    }).catch(() => {
        console.log('Registration failed!');

    });
}