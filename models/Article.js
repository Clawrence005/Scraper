var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
// This is similar to a Sequelize model
var ArticleSchema = new Schema({
  // price,
  // link,
  // bedRms,
  // sqFt

  // `price` is required and of type String
  price: {
    type: String,
    required: false
  },
  // `link` is required and of type String
  link: {
    type: String,
    required: false
  },
  // `bedRms` is required and of type String
  bedRms: {
    type: String,
    required: false
  },  // `sqFt` is required and of type String
  sqFt: {
    type: String,
    required: false
  },
  // `note` is an object that stores a Note id
  // The ref property links the ObjectId to the Note model
  // This allows us to populate the Article with an associated Note
  note: {
    type: Schema.Types.ObjectId,
    ref: "Note"
  }
});

// This creates our model from the above schema, using mongoose's model method
var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;
