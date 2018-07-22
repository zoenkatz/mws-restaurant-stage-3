/**
 * Common database helper functions.
 */
class DBHelper {



  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
      console.log("innnn")
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static addNewReview(reviewData){
      const data = {
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(reviewData)
      };

      return fetch(`http://localhost:1337/reviews/`, data).then((res) => {
          return res.json();
      }).catch((error) => {
            console.log('error:', error);
            return error;
      }).then((review) => {
        console.log(review);

        return review;
      });
  }

  static getAllReviewsForRestaurant(rest_id){
      const data = {
          method: 'GET'
      };

      return fetch(`http://localhost:1337/reviews/?restaurant_id=${rest_id}`, data).then((res) => {
         return res.json();
      });
  }

    static getStoredRestaurants() {
      const idbPromise = DBHelper.openDatabase();

        return idbPromise.then((db) => {
            if (!db) {
                return;
            }
            let tx = db.transaction('restaurants');
            let store = tx.objectStore('restaurants').index('by-date');

            return store.getAll();
        });
    }

  static openDatabase() {
        // If the browser doesn't support service worker,
        // we don't care about having a database
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        }

        return idb.open('mws-restaurant', 1, function(upgradeDb) {
            let store = upgradeDb.createObjectStore('restaurants', {
                keyPath: 'id'
            });
            store.createIndex('by-date', 'createdAt');
        });
    }

    static saveRestaurantsInDatabase(restaurants){
        const idbPromise = DBHelper.openDatabase();
        idbPromise.then(function(db) {
            if (!db) return;

            let tx = db.transaction('restaurants', 'readwrite');
            let store = tx.objectStore('restaurants');
            restaurants.forEach(function(restaurant) {
                store.put(restaurant);
            });

            // limit store to 30 items
            store.index('by-date').openCursor(null, "prev").then(function(cursor) {
                return cursor.advance(30);
            }).then(function deleteRest(cursor) {
                if (!cursor) return;
                cursor.delete();
                return cursor.continue().then(deleteRest);
            });

        });
    };
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
      DBHelper.getStoredRestaurants().then((restaurants) => {
          if (restaurants.length) {
              return callback(null, restaurants);
          }

          fetch(this.DATABASE_URL, {method: 'GET'}).then((res) => {
              return res.json();
          }).catch((error) => {
              console.error('error:', error);
          }).then((restaurants) => {
              DBHelper.saveRestaurantsInDatabase(restaurants);

              return callback(null, restaurants);
          });
      });




      // let xhr = new XMLHttpRequest();
      // xhr.open('GET', DBHelper.DATABASE_URL);
      // xhr.onload = () => {
      //   if (xhr.status === 200) { // Got a success response from server!
      //     const json = JSON.parse(xhr.responseText);
      //     const restaurants = json;
      //     callback(null, restaurants);
      //   } else { // Oops!. Got an error from server.
      //     const error = (`Request failed. Returned status of ${xhr.status}`);
      //     callback(error, null);
      //   }
      // };
      // xhr.send();
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if(restaurant.photograph) {
        return (`/images/${restaurant.photograph}-1600_large_2x.webp`);
    }
    return '';
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}