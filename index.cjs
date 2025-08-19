const { execSync } = require("child_process");
const fs = require("fs");

// Your actual file
const filename = "index.cjs";

// Dates you want to commit
const commitDates = [
  "2025-08-19T11:00:00", // 19th August 2025
  "2025-08-20T11:00:00"  // 20th August 2025
];

commitDates.forEach((date) => {
  // Make a tiny change so git sees a difference
  fs.appendFileSync(filename, `Commit for ${date}\n`);

  // Stage the file
  execSync(`git add ${filename}`, { stdio: "inherit" });

  // Commit command
  const commitCommand = `git commit -m "Commit on ${date}"`;

  // Set env variables
  const env = {
    ...process.env,
    GIT_AUTHOR_DATE: date,
    GIT_COMMITTER_DATE: date,
  };

  // Commit
  execSync(commitCommand, { stdio: "inherit", env });

  console.log(`✅ Commit created for date: ${date}`);
});

// Push all commits after loop
execSync(`git push`, { stdio: "inherit" });
console.log("🚀 All commits pushed to GitHub!");
Commit for 2025-08-19T11:00:00
