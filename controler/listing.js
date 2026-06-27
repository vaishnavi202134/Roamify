const Listing =require("../models/listing");
module.exports.index =async (req,res)=>{
    const allListings= await Listing.find({});
    console.log(allListings)
    res.render( "listings/index.ejs",{allListings});
};