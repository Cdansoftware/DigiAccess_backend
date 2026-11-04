const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    student1Name: { type: String, required: true, trim: true, maxlength: 100 },
    student1Grade: { type: String, required: true, trim: true, maxlength: 2 },
    student2Name: { type: String, required: true, trim: true, maxlength: 100 },
    student2Grade: { type: String, required: true, trim: true, maxlength: 2 },
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema(
  {
    schoolName: { type: String, required: true, trim: true, maxlength: 150 },
    // unique => one registration per school email
    schoolEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },

    roboticsMentorName: { type: String, required: true, trim: true, maxlength: 100 },
    roboticsMentorPhone: { type: String, required: true, trim: true, maxlength: 20 },
    roboticsMentorEmail: { type: String, required: true, lowercase: true, trim: true, maxlength: 120 },

    englishMentorName: { type: String, required: true, trim: true, maxlength: 100 },
    englishMentorPhone: { type: String, required: true, trim: true, maxlength: 20 },
    englishMentorEmail: { type: String, required: true, lowercase: true, trim: true, maxlength: 120 },

    teams: {
      type: [teamSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 1 && arr.length <= 5,
        message: "A school must register between 1 and 5 teams",
      },
    },
  },
  { timestamps: { createdAt: "submittedAt", updatedAt: false }, versionKey: false }
);

registrationSchema.index({ submittedAt: -1 });

// Same shape Admin.jsx expects: `id` instead of `_id`
registrationSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model("Registration", registrationSchema);
