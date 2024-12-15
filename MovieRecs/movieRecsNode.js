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

const uri = 'mongodb+srv://shellfish:fish1234@finalproject.tjmhf.mongodb.net/?retryWrites=true&w=majority&appName=FinalProject';

const databaseAndCollection = {db: "CMSC335", collection: "Movies"}; 
const { MongoClient, ServerApiVersion } = require('mongodb'); 
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 }); 
async function main() { 
  try { 
      await client.connect(); 
  } catch (e) { 
      console.error(e); 
  } 
} 

main();

// failsafe function in case of undefined/null values from api
function failsafe(value) {
  return value !== undefined && value !== null ? value : "unknown";
}

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
  let director = failsafe(credits.crew.find(({job}) => job === 'Director'));
  let cast = failsafe(credits.cast.filter(({order}) => order < 3));
  if (director !== "unknown") {
    director = director.name;
  }
  if (cast != "unknown") {
    cast = cast.map(actor => actor.name);
  }
  return [director, cast];
}

// Makes API call to get duration of a movie
async function getDuration(movieId) {
  const url = `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`;
  const details = failsafe(await fetch(url, options)
                          .then(res => res.json())
                          .catch(err => console.error(err)));
  return details.runtime;
}

// given a list of recommended movies, gathers all needed info and returns html to display
async function getRecommendationInfo(recommendations) {
  let recList = '';
  for (const movie of recommendations.results) {
    const credits = await getDirectorAndCast(movie.id); // failsafes in function
    const duration = await getDuration(movie.id); // failsafes in function
    const movieObj = {
      id: movie.id, // Assuming you need this for form submission
      title: movie.title,
      genres: failsafe(movie.genre_ids.map(id => genreObjs.genres.find(genre => genre.id === id).name).join(', ')),
      rating: failsafe(movie.vote_average),
      duration: duration,
      director: credits[0],
      actors: credits[1].join(', '),
      movieImageURL: 'https://image.tmdb.org/t/p/w300' + movie.poster_path
    };

    // innerHTML
    recList += `
    <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
      <div style="flex: 1; padding-right: 20px;">
        <h2>${movieObj.title}</h2>
        <h3>Genre: ${movieObj.genres}</h3>
        <h3>Rating: ${movieObj.rating}</h3>
        <h3>Duration: ${movieObj.duration} minutes</h3>
        <h3>Directed by: ${movieObj.director}</h3>
        <h3>Starring: ${movieObj.actors}</h3>
        <form action="/add-to-watchlist" method="POST" style="margin-top: 10px;">
          <label for="watchlist-${movieObj.id}">Add to Watchlist:</label>
          <select name="watchlists" id="watchlist-${movieObj.id}" multiple style="margin-left: 5px;">
            <option value="Favorites">Favorites</option>
            <option value="Planned">Planned</option>
            <option value="Watched">Watched</option>
            <option value="On Hold">On Hold</option>
          </select>
          <input type="hidden" name="movieObj" value='${JSON.stringify(movieObj)}'>
          <button type="submit" style="margin-left: 10px;">Submit</button>
        </form>
      </div>
      <div style="flex: 0 0 auto;">
        <img src="${movieObj.movieImageURL}" alt="movie poster" style="max-width: 300px; height: auto;">
      </div>
    </div>
    <hr>`;  
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
    res.render("searchResults", { recList, recsFound });
});

app.post('/add-to-watchlist', (req, res) => {
  const { movieObj, watchlists} = req.body;
  const movie = JSON.parse(movieObj); 
  
  /* ADD MONGODB LOGIC HERE */
  if(watchlists) {
    let entry;
    if (watchlists instanceof Array) {
      for (let i = 0; i < watchlists.length; i++) {
        entry = {id: movie.id, name: movie.title};
        client.db(databaseAndCollection.db).collection(`${watchlists[i]}`).insertOne(entry);
      }
    } else if (typeof watchlists === "string") {
      entry = {id: movie.id, name: movie.title};
      client.db(databaseAndCollection.db).collection(watchlists).insertOne(entry);
    }
  }

  res.redirect('/'); 
});

app.post('/viewWatchLists', async (req, res) => {
  /*
    below are variables that represent the watchlists that will be fetched from mongoDB
    assign them to whatever function call you need so that they each are an array of movie titles
    found in the associated watchlist
   */
  let filter = {}
  const db = await client.db(databaseAndCollection.db).collection("Favorites").find(filter).toArray();
  const db_planned = await client.db(databaseAndCollection.db).collection("Planned").find(filter).toArray();
  const db_watched = await client.db(databaseAndCollection.db).collection("Watched").find(filter).toArray();
  const db_onHold = await client.db(databaseAndCollection.db).collection("On Hold").find(filter).toArray();
  
  let favorites = []; 
  let planned = [];   
  let watched = [];   
  let onHold = [];   
  //favorites = await db.map((entry) => entry.title);
  //console.log(db)
  db.forEach(entry => {
    favorites.push(entry.name)
  })
  db_planned.forEach(entry => {
    planned.push(entry.name)
  })
  db_watched.forEach(entry => {
    watched.push(entry.name)
  })
  db_onHold.forEach(entry => {
    onHold.push(entry.name)
  })
  //console.log(onHold)
  

  // lambda to format lists of movie titles in each watchlist
  const makeUnorderedList = (watchlist) => {
    if (watchlist.length === 0) {
      return '<p style="margin-left: 20px;">No movies found in this watchlist</p>'; 
    }
    return `<ul style="margin-left: 20px;">${watchlist.map(title => `<li>${title}</li>`).join('')}</ul>`;
  };

  const favoritesUL = makeUnorderedList(favorites);
  const plannedUL = makeUnorderedList(planned);
  const watchedUL = makeUnorderedList(watched);
  const onHoldUL = makeUnorderedList(onHold);

  res.render('viewWatchLists', {
    favoritesUL,
    plannedUL,
    watchedUL,
    onHoldUL
  });
});


// server setup -> change later for public url
const portNumber = 3000;
app.listen(portNumber);
console.log(`Web server running at http://localhost:${portNumber}`);