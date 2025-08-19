const { execSync } = require("child_process");
const fs = require("fs");

const filename = "index.cjs";

const commitDates = [
  "2025-08-19T11:00:00", 
  "2025-08-20T11:00:00"
];

commitDates.forEach((date) => {
  fs.appendFileSync(filename, `Commit for ${date}\n`);

  execSync(`git add ${filename}`, { stdio: "inherit" });

  const commitCommand = `git commit -m "Commit on ${date}"`;

  const env = {
    ...process.env,
    GIT_AUTHOR_DATE: date,
    GIT_COMMITTER_DATE: date,
  };

  execSync(commitCommand, { stdio: "inherit", env });

  console.log(`✅ Commit created for date: ${date}`);
});

execSync(`git push`, { stdio: "inherit" });
console.log("🚀 All commits pushed to GitHub!");
Commit for 2025-08-19T11:00:00
