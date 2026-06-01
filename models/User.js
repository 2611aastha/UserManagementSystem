const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },

    profilePicture:{
    type:String,
    default:"default.png"
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    contact:{
        type:String,
        required:true
    },

    password:{
        type:String,
        required:true
    },

    role:{
        type:String,
        default:"user"
    },

    status:{
        type:String,
        default:"Inactive"
    },

    createdAt:{
        type:Date,
        default:Date.now
    }

});

module.exports = mongoose.model("User", UserSchema);