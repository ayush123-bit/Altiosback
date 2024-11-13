const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Define the User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Email should be unique for each user
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."], // Email validation
    },
    password: {
      type: String,
      required: true,
      minlength: 6, // Password should be at least 6 characters long
    },
    role: {
      type: String,
      enum: ["customer", "admin", "agent"], // Define the allowed roles
      default: "customer", // Default role is customer
    },
    lastUpdatedBy: {
      name: { type: String },
      role: { type: String, enum: ["customer", "admin", "agent"] },
    },
  },
  { timestamps: true } // Add timestamps for creation and update times
);

// Middleware to handle updating the lastUpdatedBy field
userSchema.pre("save", function (next) {
  if (!this.isModified("name") && !this.isModified("email") && !this.isModified("password") && !this.isModified("role")) {
    return next();
  }

  // Assuming you have a method to pass the current user's name and role
  // Update this with actual user info in the update function
  const currentUser = { name: "admin", role: "admin" }; // Placeholder; replace with actual data
  
  this.lastUpdatedBy = {
    name: currentUser.name,
    role: currentUser.role,
  };

  next();
});


// Create the User model
const User = mongoose.model("User", userSchema);

module.exports = User;
