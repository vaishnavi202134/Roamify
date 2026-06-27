module.exports.isLoggedIn=(req,res,next)=>{
    if (!req.isAuthenticated()) {
        req.flash("err","You must logged in to create listing");
       return res.redirect("/login");
        
      };
      next();
}