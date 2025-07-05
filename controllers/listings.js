 //index
 const Listing = require("../models/listing");
 module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
};
//new
module.exports.renderNewForm = (req, res) =>{
    console.log(req.user);
    res.render("listings/new");
};
//show
module.exports.showListing = async (req, res) =>{
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate({
        path :"reviews",
    populate: {
        path: "author",
    },
})
.populate("owner");
    if(!listing) {
        req.flash("error", "listing you requested for does not exist!");
        res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show", {listing});
}

//create
module.exports.createListing = async (req, res, next) => {
  // 1️⃣ Create a new Listing instance with other form data
  const newListing = new Listing(req.body.listing); // Make sure your form uses `listing[...]` names!

  // 2️⃣ Add the image if uploaded
  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  }

  // 3️⃣ Set the owner
  newListing.owner = req.user._id;

  // 4️⃣ Save it
  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};


//edit route

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }

   let originalImageUrl = listing.image.url;
originalImageUrl = originalImageUrl.replace("/upload/", "/upload/w_250/");
res.render("listings/edit.ejs", { listing, originalImageUrl });

  }
//update
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  }

  await listing.save();
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};


//delete
module.exports.deleteListing = async (req,res) => {
    let {id} = req.params;
    Listing.findById(id);
   let deletedListing = await Listing.findByIdAndDelete(id);
   console.log(deletedListing);
   req.flash("success", "Listing Deleted!");
   res.redirect("/listings")
}
