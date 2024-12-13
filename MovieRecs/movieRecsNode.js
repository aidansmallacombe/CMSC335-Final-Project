// dependencies
const express = require("express");
const fs = require("fs");
const path = require("path");

// express setup
const app = express();
// middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
// sets
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

let genreObjs; // list of genre names with their associated id

// access token for API
const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3M2VhNWI5YzFiOGUzZTYyYTYzZTNiYzdlYWJlMzQ5MiIsIm5iZiI6MTczNDA0NDkzNy4xMTksInN1YiI6IjY3NWI2ZDA5NmY5ZTdmMmNjYjZhMjQwNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.mZY3XdOgInUDxism6lULbIIQCpZadmhhvONTK8uIvdU'
  }
};

// makes API call to grab director and top 3 cast members for a movie
async function getDirectorAndCast(movieId) {
  const creditsURL = `https://api.themoviedb.org/3/movie/${movieId}/credits?language=en-US`;
  const credits = await fetch(creditsURL, options)
                      .then(res => res.json())
                      .catch(err => console.error(err));
  let director = credits.crew.find(({job}) => job === 'Director');
  let cast = credits.cast.filter(({order}) => order < 3);
  director = director.name;
  cast = cast.map(actor => actor.name);
  return [director, cast];
}

// Makes API call to get duration of a movie
async function getDuration(movieId) {
  const url = `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`;
  const details = await fetch(url, options)
                        .then(res => res.json())
                        .catch(err => console.error(err));
  return details.runtime;
}

// given a list of recommended movies, gathers all needed info and returns html to display
async function getRecommendationInfo(recommendations) {
  let recList = '';
  for(const movie of recommendations.results) {
    const credits = await getDirectorAndCast(movie.id);
    const duration = await getDuration(movie.id);
    const movieObj = {
      title: movie.title,
      genres: movie.genre_ids.map(id => genreObjs.genres.find(genre => genre.id === id).name).join(', '),
      rating: movie.vote_average,
      duration: duration,
      director: credits[0],
      actors: credits[1].join(', '),
      movieImageURL: 'https://image.tmdb.org/t/p/w300' + movie.poster_path
    };
    recList += `<h1>${movieObj.title}</h1> <h3>Genre: ${movieObj.genres}</h3> <h3>Rating: ${movieObj.rating}</h3> <h3>Duration: ${movieObj.duration} minutes</h3>`;
    recList += `<h3>Directed by: ${movieObj.director}</h3> <h3>Starring: ${movieObj.actors}</h3>`;
    recList += `<img src="${movieObj.movieImageURL}"> <br>`;
  }
  return recList;
}
// render pages
app.get('/', async (req, res) => {
    const genreURL = 'https://api.themoviedb.org/3/genre/movie/list?language=en';
    genreObjs = await fetch(genreURL, options)
                        .then(res => res.json())
                        .catch(err => console.error(err));
    res.render("index");
});

app.get('/searchResults', (req, res) => {
    res.render("searchResults");
});

app.get('/viewWatchLists', (req, res) => {
    res.render("viewWatchLists");
});

// post routes
app.post('/search', async (req, res) => {
    // keyword that was searched (plug this into api)
    let keyword = req.body.search
    /* plug keyword into API and handle here */
    const movieName = keyword;
    keyword = keyword.split(' ').join('%');
    const searchURL = `https://api.themoviedb.org/3/search/movie?query=${keyword}&include_adult=false&language=en-US&page=1`;

    const movies = await fetch(searchURL, options)
                          .then(res => res.json())
                          .catch(err => console.error(err));
    let recList, recsFound;
    if(movies.results.length > 0) {
      const movieId = movies.results[0].id;
      const recommendationURL = `https://api.themoviedb.org/3/movie/${movieId}/recommendations?language=en-US&page=1`;
      const recommendations = await fetch(recommendationURL, options)
                                      .then(res => res.json())
                                      .catch(err => console.error(err));
  
      // innerHTML handling here
      recList = await getRecommendationInfo(recommendations);
      recsFound = recommendations.results.length + ' results found';
    } else {
      recList = 'Movie not found';
      recsFound = '0 results found';
    }
    res.render("searchResults", { movieName, recList, recsFound });
});

// same exact request as above, copy and paste what you have from the above post
app.post('/searchResults', async (req, res) => {
    // keyword that was searched (plug this into api)
    let keyword = req.body.search
    /* plug keyword into API and handle here */
    const movieName = keyword;
    keyword = keyword.split(' ').join('%');
    const searchURL = `https://api.themoviedb.org/3/search/movie?query=${keyword}&include_adult=false&language=en-US&page=1`;

    const movies = await fetch(searchURL, options)
                          .then(res => res.json())
                          .catch(err => console.error(err));
    
    let recList, recsFound;
    if(movies.results.length > 0) {
      const movieId = movies.results[0].id;
      const recommendationURL = `https://api.themoviedb.org/3/movie/${movieId}/recommendations?language=en-US&page=1`;
      const recommendations = await fetch(recommendationURL, options)
                                      .then(res => res.json())
                                      .catch(err => console.error(err));
  
      // innerHTML handling here
      recList = await getRecommendationInfo(recommendations);
      recsFound = recommendations.results.length + ' results found';
    } else {
      recList = 'Movie not found';
      recsFound = '0 results found';
    }
    res.render("searchResults", { movieName, recList, recsFound });
});

app.post('/viewWatchLists', (req, res) => {
    // placeholder for now, might handle differently
});

// server setup -> change later for public url
const portNumber = 3000;
app.listen(portNumber);
console.log(`Web server running at http://localhost:${portNumber}`);