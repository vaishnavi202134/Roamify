if(process.env.node_env!="production"){
  require('dotenv').config();
}


const express=require("express");
const app = express();
const mongoose =require("mongoose");
const Listing=require("./models/listing.js");
const path = require("path");
const fs = require("fs");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const Review = require("./models/review.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const multer = require("multer");
const User = require("./models/user.js");



const mongo_url ="mongodb://127.0.0.1:27017/wanderlust";
main()
.then(()=>{
    console.log("connected to DB");
})
.catch((err)=>{
    console.log(err);
});
async function main() {
    await mongoose.connect(mongo_url);
    
}
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

const uploadPath = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_.]/g, "");
    cb(null, `${Date.now()}-${safeName}`);
  },
});
const upload = multer({ storage });

const sessionOption = {
    secret: "mycode",
    resave: false,
    saveUninitialized: true, 
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    },
   
};

app.get("/", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect("/listings");
  }
  res.redirect("/login");
});

app.use(session(sessionOption));
app.use(flash());

// app.use(passport.initialize());
// app.use(passport.session());
// passport.use(new localStrategy(User.authenticate()));

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
// Passport configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

// Signup route
app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

app.post("/signup", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const newUser = new User({ email });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
});

// Login route
app.get("/login", (req, res) => {
  res.render("login.ejs");
});
app.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    req.flash("success", "Welcome back!");
    res.redirect("/listings");
  }
);


  

// Logout route
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Goodbye!");
    res.redirect("/listings");
  });
});

app.get("/demouser", async (req, res) => {
    let fakeUser = new User({
      email: "student@gmail.com",
      username: "delta-student",
    });
  
    let registeredUser = await User.register(fakeUser, "helloworld");
    res.send(registeredUser);
  });
  

// index route with optional search
app.get("/listings", async (req, res) => {
  const { search } = req.query;
  let query = {};
  if (search) {
    const regex = new RegExp(search, "i");
    query = {
      $or: [{ title: regex }, { location: regex }, { country: regex }],
    };
  }
  const allListings = await Listing.find(query);
  res.render("listings/index.ejs", { allListings, search });
});


//new route
app.get("/listing/new", (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be logged in to create a listing");
    return res.redirect("/login");
  }
  res.render("listings/new.ejs");
});
//show route
app.get("/listings/:id", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews");
  res.render("listings/show.ejs", { listing });
});

//create route
app.post("/listings", upload.single("imageFile"), async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be logged in to create a listing");
    return res.redirect("/login");
  }
  try {
    const listingData = req.body.listing || {};
    if (req.file) {
      listingData.image = `/uploads/${req.file.filename}`;
    }
    const newListing = new Listing(listingData);
    await newListing.save();
    res.redirect("/listings");
  } catch (e) {
    console.error("Failed to create listing:", e);
    req.flash("error", e.message || "Unable to create listing. Please check your input.");
    res.redirect("/listing/new");
  }
});

// Edit route
app.get("/listings/:id/edit", async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be logged in to edit a listing");
    return res.redirect("/login");
  }
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
});


// update route
app.put("/listings/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be logged in to update a listing");
    return res.redirect("/login");
  }
  const { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect("/listings");
});


app.delete("/listings/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be logged in to delete a listing");
    return res.redirect("/login");
  }
  try {
    const { id } = req.params;
    const deletedListing = await Listing.findByIdAndDelete(id);
    console.log("Deleted listing:", deletedListing);
    res.redirect("/listings");
  } catch (err) {
    console.error("Error deleting listing:", err);
    res.status(500).send("Internal Server Error");
  }
});
   
// review post route
app.post("/listings/:id/reviews", async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be logged in to leave a review");
    return res.redirect("/login");
  }
  const listing = await Listing.findById(req.params.id);
  const newReview = new Review(req.body.review);
  await newReview.save();
  listing.reviews.push(newReview);
  await listing.save();
  res.redirect(`/listings/${listing._id}`);
});
  
// app.get("/testListing", async (req,res)=>{
//     let sampleListing=new Listing({
//         title:"The villa",
//         description:"A holy place",
//         location:"calicut, kerla",
//         country:"india",
//         price:1200,
//     });
//    await sampleListing.save();
//    console.log("Sample was saved");
//    res.send("successful testing");
// });
app.listen(8080,()=>{
    console.log("server is listen on port 8080");
});