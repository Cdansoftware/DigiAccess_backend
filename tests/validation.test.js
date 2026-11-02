const assert = require("node:assert/strict");
const { validateRegistration } = require("../services/validation");

const team = (n = 1) => ({
  teamName: `Team ${n}`,
  student1Name: `A${n}`, student1Grade: "8",
  student2Name: `B${n}`, student2Grade: "8",
});

// Exact payload shape from the Registration.jsx console log
const base = () => ({
  schoolName: "Satya Bharti Adarsh Sen. Sec. School Rauni",
  schoolEmail: "Sbasrauni@gmail.co",
  roboticsMentorName: "Chandan Prajapti",
  roboticsMentorPhone: "08416847643",
  roboticsMentorEmail: "chandan.softwaredeveloper@gmail.com",
  englishMentorName: "Nimrat",
  englishMentorPhone: "8416847643",
  englishMentorEmail: "cdan@gmail.com",
  teams: [team(1), team(2)],
});

// 1. Valid payload passes, email is lowercased, team name is kept
{
  const { data, errors } = validateRegistration(base());
  assert.deepEqual(errors, []);
  assert.equal(data.schoolEmail, "sbasrauni@gmail.co");
  assert.equal(data.teams.length, 2);
  assert.equal(data.teams[0].teamName, "Team 1");
}

// 2. 1 and 5 teams are allowed
for (const n of [1, 5]) {
  const b = base();
  b.teams = Array.from({ length: n }, (_, i) => team(i + 1));
  assert.deepEqual(validateRegistration(b).errors, []);
}

// 3. 0 and 6 teams are rejected
for (const n of [0, 6]) {
  const b = base();
  b.teams = Array.from({ length: n }, (_, i) => team(i + 1));
  const { errors } = validateRegistration(b);
  assert.ok(errors.some((e) => e.includes("between 1 and 5")));
}

// 4. teams missing / not an array
for (const t of [undefined, null, "x", {}]) {
  const b = base();
  b.teams = t;
  assert.ok(validateRegistration(b).errors.length > 0);
}

// 5. Garbage body never throws
for (const input of [undefined, null, "hello", 42, []]) {
  assert.ok(validateRegistration(input).errors.length > 0);
}

// 6. Bad email, bad phone, bad grade, empty student name
{
  const b = base();
  b.schoolEmail = "not-an-email";
  b.englishMentorPhone = "abc";
  b.teams[0].student1Grade = "13";
  b.teams[1].student2Name = "   ";
  const { errors } = validateRegistration(b);
  assert.equal(errors.length, 4);
}

// 7. Objects instead of strings (NoSQL injection style) are rejected
{
  const b = base();
  b.schoolEmail = { $ne: "" };
  assert.ok(validateRegistration(b).errors.length > 0);
}

// 8. Numeric grade from the browser is accepted
{
  const b = base();
  b.teams[0].student1Grade = 9;
  assert.deepEqual(validateRegistration(b).errors, []);
}

// 9. NEW: team name is required (missing, empty, spaces only, or not a string)
for (const bad of [undefined, "", "   ", { $ne: "" }, 123]) {
  const b = base();
  b.teams[0].teamName = bad;
  const { errors } = validateRegistration(b);
  assert.ok(errors.length > 0, `teamName ${JSON.stringify(bad)} should be rejected`);
}

// 10. NEW: team name longer than 60 characters is rejected, exactly 60 is fine
{
  const b = base();
  b.teams[0].teamName = "x".repeat(61);
  assert.ok(validateRegistration(b).errors.length > 0);

  const ok = base();
  ok.teams[0].teamName = "x".repeat(60);
  assert.deepEqual(validateRegistration(ok).errors, []);
}

// 11. NEW: team names must be unique within a school (case-insensitive, trimmed)
{
  const b = base();
  b.teams[0].teamName = "Innovators";
  b.teams[1].teamName = "  innovators ";
  const { errors } = validateRegistration(b);
  assert.ok(errors.some((e) => /unique|duplicate/i.test(e)));
}

// 12. NEW: team name is trimmed before saving
{
  const b = base();
  b.teams[0].teamName = "  Robo Wizards  ";
  const { data, errors } = validateRegistration(b);
  assert.deepEqual(errors, []);
  assert.equal(data.teams[0].teamName, "Robo Wizards");
}

console.log("validation tests passed");