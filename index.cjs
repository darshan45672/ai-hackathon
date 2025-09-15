const { execSync } = require("child_process");

// Your actual file
const filename = "index.cjs";

// Dates for commits
const commitDates = [
  "2025-09-13T11:00:00",
  "2025-09-14T11:00:00",
  "2025-09-15T11:00:00",
];

commitDates.forEach((commitDate) => {
  // Append something to file so each commit is unique
  execSync(`echo "Commit on ${commitDate}" >> ${filename}`);

  // Stage the file
  execSync(`git add ${filename}`, { stdio: "inherit" });

  // Commit message
  const commitCommand = `git commit -m "Commit on ${commitDate}"`;

  // Set env variables for commit date
  const env = {
    ...process.env,
    GIT_AUTHOR_DATE: commitDate,
    GIT_COMMITTER_DATE: commitDate,
  };

  // Commit with custom date
  execSync(commitCommand, { stdio: "inherit", env });

  console.log("✅ Commit created with date:", commitDate);
});

// Push all commits together
execSync(`git push`, { stdio: "inherit" });

console.log("🚀 All commits pushed!");Commit on 2025-09-13T11:00:00
Commit on 2025-09-14T11:00:00
Commit on 2025-09-15T11:00:00
