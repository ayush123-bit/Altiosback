const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,  // Automatically stores the date and time of ticket creation
  },
  userEmail: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  actionTaken: {
    type: String,
    default: "",  // Starts empty; updated when action is taken
  },
  feedback: {
    type: String,
    default: "",  // Starts empty; updated when feedback is provided
  },
  satisfied: {
    type: String,
    default: "No",  // Allows users to indicate if they're satisfied, initially unset
  },
  status: {
    type: String,
    enum: ["active", "pending", "closed"],  // Only allows these values
    default: "pending",  // Default status when ticket is created
  },
  lastUpdated:{
    type:Date,

  },
  lastUpdatedBy: {
    type: Object,  // Store the name and role of the user in this field
    required: false,
  },
});

// Mongoose middleware to automatically update the `lastUpdated` field on any update
TicketSchema.pre('save', function (next) {
  // If any update happens, update `lastUpdated` field
  this.lastUpdated = Date.now();
  next();
});

TicketSchema.pre('updateOne', function (next) {
  // If any updateOne operation happens, update `lastUpdated` field
  this.set({ lastUpdated: Date.now() });
  next();
});

module.exports = mongoose.model('Ticket', TicketSchema);
