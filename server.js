var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));


// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/craigslistPopulater";

mongoose.connect(MONGODB_URI);
// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/craigslistPopulater", { useNewUrlParser: true });

// Routes
// GET route for scraping the craigslist website
app.get("/scrape", function (req, res) {

  // First, tell the console what server.js is doing
  console.log("\n***********************************\n" +
    "Grabbing every thread name and link\n" +
    "from 's craigslist:" +
    "\n***********************************\n");

  // Making a request via axios for reddit's "webdev" board. We are sure to use old.reddit due to changes in HTML structure for the new reddit. The page's Response is passed as our promise argument.
  axios.get("https://austin.craigslist.org/d/apts-housing-for-rent/search/apa").then(function (response) {

    // Load the Response into cheerio and save it to a variable
    // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
    var $ = cheerio.load(response.data);

    // An empty array to save the data that we'll scrape
    var results = {};
    $("form div.content ul .result-row").each(function (i, element) {

      var price = $(element).find(".result-meta .result-price").text().trim();
      var rooms = $(element).find(".housing").text().trim();
      var roomsPretty = rooms.split("-");
      var roomsMap = roomsPretty.map(s => s.trim());
      var bedRms = roomsMap[0];
      var sqFt = roomsMap[1];



      // In the currently selected element, look at its child elements (i.e., its a-tags),
      // then save the values for any "href" attributes that the child elements may have
      var link = $(element).children().attr("href");

      var results = [{
        price,
        link,
        bedRms,
        sqFt
      }
      ]
      console.log(results);
      // Save these results in an object that we'll push into the results array we defined earlier 
      // if(bedRms=='1br' && price > 800){
      // results.push({
      //   price,
      //   // roomsMap,
      //   link,
      //   bedRms,
      //   sqFt
      // });
      // // };
      // results.forEach(function(result ))

      console.log("~~~~~~~~~~~~");
      // // Log the results once you've looped through each of the elements found with cheerio
      // for (i = 0; i < results.length; i++) {
      var finalResults = [];
      results.forEach(result => {

        finalResults.push(result)
        console.log(result);
        db.Article.create(result)
          .then(function (dbArticle) {
            // View the added result in the console
            // MANY
            console.log(dbArticle);
          })
          .catch(function (err) {
            // If an error occurred, log it
            console.log(err);
          });

        // Send a message to the client
        res.send("Scrape Complete");
      });
    });
  });
});
// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
