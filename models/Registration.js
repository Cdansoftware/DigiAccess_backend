const mongoose = require("mongoose");

const GRADES = ["8", "9", "10"];

const teamSchema = new mongoose.Schema(
  {
    teamName: { type: String, trim: true, maxlength: 60, default: "" }, // older docs may lack it
    student1Name: { type: String, required: [true, "Student 1 name is required"], trim: true, maxlength: 100 },
    student1Grade: { type: String, required: [true, "Student 1 grade is required"], enum: { values: GRADES, message: "Student 1 grade must be 8, 9 or 10" } },
    student2Name: { type: String, required: [true, "Student 2 name is required"], trim: true, maxlength: 100 },
    student2Grade: { type: String, required: [true, "Student 2 grade is required"], enum: { values: GRADES, message: "Student 2 grade must be 8, 9 or 10" } },
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema({
  schoolName: { type: String, required: [true, "School name is required"], trim: true, maxlength: 150 },
  schoolEmail: {
    type: String,
    required: [true, "School email is required"],
    trim: true,
    lowercase: true,
    maxlength: 120,
    unique: true, // duplicate -> error code 11000 -> 409 in the route
  },

  roboticsMentorName: { type: String, required: true, trim: true, maxlength: 100 },
  roboticsMentorPhone: { type: String, required: true, trim: true, maxlength: 20 },
  roboticsMentorEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },

  englishMentorName: { type: String, required: true, trim: true, maxlength: 100 },
  englishMentorPhone: { type: String, required: true, trim: true, maxlength: 20 },
  englishMentorEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },

  teams: {
    type: [teamSchema],
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length >= 1 && arr.length <= 5,
      message: "A school must register between 1 and 5 teams",
    },
  },

  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Registration", registrationSchema);