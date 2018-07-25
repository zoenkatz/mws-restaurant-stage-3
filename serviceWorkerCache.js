importScripts('/js/dbhelper.js');

const CACHE_REST = 'restaurants-cache';

let allCaches = [
    CACHE_REST
];

self.addEventListener('install', (function(event){
    event.waitUntil(
        caches.open(CACHE_REST).then(function(cache){
           return cache.addAll([
               '/',
               'index.html',
               'restaurant.html',
               'restaurant.html?id=1',
               'restaurant.html?id=2',
               'restaurant.html?id=3',
               'restaurant.html?id=4',
               'restaurant.html?id=5',
               'restaurant.html?id=6',
               'restaurant.html?id=7',
               'restaurant.html?id=8',
               'restaurant.html?id=9',
               'restaurant.html?id=10',
               'js/main.js',
               'js/idb.js',
               'js/dbhelper.js',
               'js/restaurant_info.js',
               'css/styles.css',
               'data/restaurants.json',
               'images/1-1600_large_2x.webp',
               'images/2-1600_large_2x.webp',
               'images/3-1600_large_2x.webp',
               'images/4-1600_large_2x.webp',
               'images/5-1600_large_2x.webp',
               'images/6-1600_large_2x.webp',
               'images/7-1600_large_2x.webp',
               'images/8-1600_large_2x.webp',
               'images/9-1600_large_2x.webp',
               'images/10-1600_large_2x.webp'

           ])
        })
    )
}));


self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith('restaurants-') &&
                        !allCaches.includes(cacheName);
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('sync', function(event) {
    if (event.tag == 'syncRequestReviewSubmission') {
        debugger;
        let formData = {}
        DBHelper.getStoredReviews().then((reviews) => {
            console.log(reviews);
           //formData = reviews.pop();
            //event.waitUntil(DBHelper.addNewReview(formData))
        });

    }
});