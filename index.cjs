const { execSync } = require("child_process");

// Your actual file
const filename = "index.cjs";

// Commit date — 7th August 2025 at 11:00 AM
const commitDate = "2025-08-07T11:00:00";

// Stage the file
execSync(`git add ${filename}`, { stdio: "inherit" });

// Commit command
const commitCommand = `git commit -m "Commit on 7th August 2025"`;

// Set env variables
const env = {
  ...process.env,
  GIT_AUTHOR_DATE: commitDate,
  GIT_COMMITTER_DATE: commitDate,
};

// Commit
execSync(commitCommand, { stdio: "inherit", env });

// Push
execSync(`git push`, { stdio: "inherit" });

console.log("✅ Commit created and pushed with date:", commitDate);
