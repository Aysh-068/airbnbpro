if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}
console.log(process.env.SECRET)

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const Listing = require('./models/listing');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const wrapAsync = require('./utils/wrapAsync');
const ExpressError = require('./utils/ExpressError');
const {listingSchema, reviewSchema} = require("./schema.js");
const Review = require('./models/review');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require("passport-local");
const User = require('./models/user');
const { isLoggedIn, isOwner, validateListing , validateReview, isReviewAuther} = require('./middleware.js');
const listingController = require("./controllers/listings")
const reviewController = require("./controllers/reviews");
const multer = require('multer');
const {storage} = require("./cloudConfig");
const upload = multer({ storage });


const userRouter = require("./routes/user.js");
const { Console } = require("console");


const dbUrl = process.env.ATLASDB_URL;


main()
.then(() => {
    console.log("connected to db");
})
.catch((err)  => {
    console.log(err);
});
async function main() {
    await mongoose.connect(dbUrl)

}





app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", () => {
    console.log("ERROR in MONGO STORE", err);
    })


const sessionOptions = {
     store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    
    },
};



app.use(session(sessionOptions));
app.use(flash());

//implememniting passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    console.log(res.locals.success);
    next();
});

app.use("/", userRouter);
// //demo user
// app.get("/demouser", async (req, res) => {
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "delta-student"
//     });

//   let regusteredUser =  await  User.register(fakeUser, "helloworld");
//   res.send(regusteredUser);
// })

//index route
app.get("/listings",wrapAsync(listingController.index))


//new route
app.get("/listings/new", isLoggedIn, listingController.renderNewForm);

//show route
app.get("/listings/:id", wrapAsync(listingController.showListing));

//create route
// app.post("/listings",
//     isLoggedIn,
//     validateListing,
//      wrapAsync (listingController.createListing));
app.post(
  "/listings",
  isLoggedIn,
  
  upload.single("listing[image]"),
  validateListing, // ⬅️ add this here
  wrapAsync(listingController.createListing)
);

//edit route
app.get("/listings/:id/edit", 
    isLoggedIn, 
    isOwner,
    wrapAsync(listingController.renderEditForm )
);

//update route
app.put("/listings/:id",
    isLoggedIn,
    isOwner,
      upload.single("listing[image]"),
    validateListing,
    wrapAsync( listingController.updateListing)
);

//delete route
app.delete("/listings/:id", isLoggedIn,isOwner, wrapAsync
    (listingController.deleteListing));

//reviews
//post review  route
app.post("/listings/:id/reviews",
    isLoggedIn,
     validateReview,
      wrapAsync(reviewController.createReview));

//delete review route
app.delete("/listings/:id/reviews/:reviewId",
    isLoggedIn,
    isReviewAuther,
     wrapAsync(reviewController.deleteReview));

// app.get("/testListing", async (req,res) => {
//     let sampleListing = new Listing({
//         "title": "My new villa",
//         "description": "This is a beautiful villa with a pool and a view of the ocean",
//         "price": 50000,
//         "location": "Bali",
//         country : "indonesia"
// });
// await sampleListing.save();
// console.log("sample was saved");
// res.send("successful testing");
// })

// middleware for error handler
// app.all("*", (req, res, next) => {
//     next(new ExpressError(404, "Page not found"));
// });//not working in my lap but working in teachers lap

app.use((req, res) => {
    res.status(404).render("error", { message: "Page Not Found!" });
});

app.use((err, req, res, next) =>{
    let{statusCode=500, message="something went wrong"} = err;
    res.status(statusCode).render("error.ejs", {message});
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});