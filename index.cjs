const { execSync } = require("child_process");

const filename = "index.cjs";

const commitDate = "2025-08-07T11:00:00";

execSync(`git add ${filename}`, { stdio: "inherit" });

const commitCommand = `git commit -m "Commit on 7th August 2025"`;

const env = {
  ...process.env,
  GIT_AUTHOR_DATE: commitDate,
  GIT_COMMITTER_DATE: commitDate,
};

execSync(commitCommand, { stdio: "inherit", env });

execSync(`git push`, { stdio: "inherit" });

console.log("✅ Commit created and pushed with date:", commitDate);
