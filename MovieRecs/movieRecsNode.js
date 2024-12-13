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

// render pages
app.get('/', (req, res) => {
    res.render("index");
});

app.get('/searchResults', (req, res) => {
    res.render("searchResults");
});

app.get('/viewWatchLists', (req, res) => {
    res.render("viewWatchLists");
});

// post routes
app.post('/search', (req, res) => {
    // keyword that was searched (plug this into api)
    let keyword = req.body.search
    /* plug keyword into API and handle here */
    
    // resolve appropriate data from API into these fields below
    let title; // movie title
    let genres; // an array of up to three genres
    let rating; // movie rating
    let duration; // movie duration
    let director; // director name
    let actors; // an array of up to three actor names from starring cast
    let movieImageURL; // url of movie poster image

    // innerHTML handling here
    let recList;

    res.render("searchResults", { recList });
});

// same exact request as above, copy and paste what you have from the above post
app.post('/searchResults', (req, res) => {
       // keyword that was searched (plug this into api)
       let keyword = req.body.search
       /* plug keyword into API and handle here */
       
       // resolve appropriate data from API into these fields below
       let title; // movie title
       let genres; // an array of up to three genres
       let rating; // movie rating
       let duration; // movie duration
       let director; // director name
       let actors; // an array of up to three actor names from starring cast
       let movieImageURL; // url of movie poster image
   
       // innerHTML handling here
       let recList;

       res.render("searchResults", { recList });
});

app.post('/viewWatchLists', (req, res) => {
    // placeholder for now, might handle differently
});

// server setup -> change later for public url
const server = app.listen(portNumber, () => {
    console.log(`Web server running at http://localhost:${portNumber}`);
});