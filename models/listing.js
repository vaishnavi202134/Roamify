const mongoose=require("mongoose");
const Schema=mongoose.Schema;

// const listingSchema= new Schema({
//     title:
//     { type:String,
//         required:true,
//     },
//     description:{
//         type:String,
//     },
//     location:String,
//     country: String,
//     price: Number,
//     image:{
//         type :String,
//         default:"https://www.pexels.com/photo/house-lights-turned-on-106399/",
//     set:(v)=>(v===""?"https://www.pexels.com/photo/house-lights-turned-on-106399/":v),},

// });
const listingSchema = new Schema({
    title:
     { type: String,
       required: true,
       },
    description:  { 
      type: String,
     },
    location: String,
    country: String,
    price: Number,

    image: {
      type: String,
      default:
        "https://images.pexels.com/photos/4258279/pexels-photo-4258279.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      set: (v) =>
        v === "" || v == null
          ? "https://images.pexels.com/photos/4258279/pexels-photo-4258279.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
          : v,
    },
    latitude: Number,
    longitude: Number,

    
    reviews:[
      {
        type:Schema.Types.ObjectId,
        ref:"review",
      }
          ]
  });
  

  

const Listing=mongoose.model("Listing",listingSchema);
module.exports=Listing;