const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const Listing = require('../models/listing');
const {listingSchema, reviewSchema} = require("../schema.js");
const ExpressError = require('../utils/ExpressError');

const validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    else{
        next();
    }
};

//index route
router.get("/", async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
});

//new route
router.get("/new", async (req, res) =>{
    res.render("listings/new");
});



//show route
router.get("/:id", wrapAsync(async (req, res) =>{
    let {id} = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show", {listing});
})
);


//create route
router.post("/",
    validateListing,
     wrapAsync (async (req, res, next) => {
    const newListing = new Listing( req.body.listing);
    await newListing.save();
    res.redirect("/listings");
})
   
);

//edit route
router.get("/:id/edit",wrapAsync( async (req,res) => {
     let {id} = req.params;
      const listing = await Listing.findById(id);
      res.render("listings/edit",{listing});

})
);

//update route
router.put("/:id",
    validateListing,
    wrapAsync( async (req, res) =>
{
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id, {...req.body.listing});
    res.redirect(`/listings/${id}`);
})
);

//delete route
router.delete("/:id",wrapAsync (async (req,res) => {
    let {id} = req.params;
   let deletedListing = await Listing.findByIdAndDelete(id);
   console.log(deletedListing);
   res.redirect("/listings")
})
);

module.exports = router;