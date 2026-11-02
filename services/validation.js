// Validates and cleans the registration body sent by Registration.jsx.
// Never trusts the browser: every field is type-checked, trimmed and length-limited.

const MIN_TEAMS = 1;
const MAX_TEAMS = 5;
const MAX_TEAM_NAME = 60;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
// The registration form only offers Grades 8-10 (must match the model's enum)
const GRADES = ["8", "9", "10"];

const clean = (v, max) =>
  typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max + 1) : "";

function validateRegistration(body) {
  const errors = [];
  const b = body && typeof body === "object" ? body : {};

  const text = (key, label, max = 100) => {
    const value = clean(b[key], max);
    if (!value) errors.push(`${label} is required`);
    else if (value.length > max) errors.push(`${label} must be at most ${max} characters`);
    return value;
  };

  const email = (key, label) => {
    const value = clean(b[key], 120).toLowerCase();
    if (!value) errors.push(`${label} is required`);
    else if (!EMAIL_RE.test(value) || value.length > 120) errors.push(`${label} is not a valid email`);
    return value;
  };

  const phone = (key, label) => {
    const value = clean(b[key], 20);
    if (!value) errors.push(`${label} is required`);
    else if (!PHONE_RE.test(value) || value.replace(/\D/g, "").length < 7)
      errors.push(`${label} is not a valid phone number`);
    return value;
  };

  const data = {
    schoolName: text("schoolName", "School name", 150),
    schoolEmail: email("schoolEmail", "School email"),
    roboticsMentorName: text("roboticsMentorName", "Robotics mentor name"),
    roboticsMentorPhone: phone("roboticsMentorPhone", "Robotics mentor phone"),
    roboticsMentorEmail: email("roboticsMentorEmail", "Robotics mentor email"),
    englishMentorName: text("englishMentorName", "English mentor name"),
    englishMentorPhone: phone("englishMentorPhone", "English mentor phone"),
    englishMentorEmail: email("englishMentorEmail", "English mentor email"),
    teams: [],
  };

  if (!Array.isArray(b.teams)) {
    errors.push("teams must be a list");
  } else if (b.teams.length < MIN_TEAMS || b.teams.length > MAX_TEAMS) {
    errors.push(`A school must register between ${MIN_TEAMS} and ${MAX_TEAMS} teams`);
  } else {
    b.teams.forEach((t, i) => {
      const n = i + 1;
      const team = t && typeof t === "object" ? t : {};

      // NEW: team name (required, max 60 characters)
      const teamName = (() => {
        const value = clean(team.teamName, MAX_TEAM_NAME);
        if (!value) errors.push(`Team ${n}: team name is required`);
        else if (value.length > MAX_TEAM_NAME)
          errors.push(`Team ${n}: team name must be at most ${MAX_TEAM_NAME} characters`);
        return value;
      })();

      const name = (key, label) => {
        const value = clean(team[key], 100);
        if (!value) errors.push(`Team ${n}: ${label} is required`);
        else if (value.length > 100) errors.push(`Team ${n}: ${label} is too long`);
        return value;
      };
      const grade = (key, label) => {
        const value = String(team[key] ?? "").trim();
        if (!GRADES.includes(value)) errors.push(`Team ${n}: ${label} must be Grade 8, 9 or 10`);
        return value;
      };
      data.teams.push({
        teamName,
        student1Name: name("student1Name", "student 1 name"),
        student1Grade: grade("student1Grade", "student 1 grade"),
        student2Name: name("student2Name", "student 2 name"),
        student2Grade: grade("student2Grade", "student 2 grade"),
      });
    });

    // NEW: team names must be unique within the school (case-insensitive)
    const seen = new Map(); // lowercased name -> first team number
    data.teams.forEach((team, i) => {
      if (!team.teamName) return; // already reported as missing
      const key = team.teamName.toLowerCase();
      if (seen.has(key)) {
        errors.push(
          `Team ${i + 1}: team name "${team.teamName}" is already used by Team ${seen.get(key)}. Team names must be unique within a school`
        );
      } else {
        seen.set(key, i + 1);
      }
    });
  }

  return { data, errors };
}

module.exports = { validateRegistration, MIN_TEAMS, MAX_TEAMS, MAX_TEAM_NAME };