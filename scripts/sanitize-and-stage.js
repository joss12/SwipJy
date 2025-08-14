#!/usr/bin/env node
/* eslint-disable no-console */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function sh(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", shell: "/bin/bash", ...opts });
}
function exists(p) {
  return fs.existsSync(p);
}
function copyIfExists(p, destDir) {
  if (!exists(p)) return;
  // -aL: archive + DEREFERENCE links
  sh(`cp -aL ${p} ${destDir}/`);
}

const ROOT = process.cwd();
const PUBLISH_DIR = path.join(ROOT, ".publish");

try {
  // 1) Clean up common link troublemakers in the SOURCE tree (safe to run always)
  // nested node_modules (esp. inside templates/**), pnpm/yarn stores, template .git dirs
  try {
    sh(`find . -path '*/node_modules' -type d -prune -exec rm -rf '{}' +`);
  } catch {}
  try {
    sh(
      `find . -type d \\( -name '.pnpm' -o -name '.yarn' \\) -prune -exec rm -rf '{}' +`,
    );
  } catch {}
  try {
    sh(
      `find . -type f \\( -name 'pnpm-lock.yaml' -o -name 'yarn.lock' \\) -delete`,
    );
  } catch {}
  try {
    sh(`find templates -type d -name '.git' -prune -exec rm -rf '{}' +`);
  } catch {}

  // 2) Recreate staging dir
  sh(`rm -rf ${PUBLISH_DIR}`);
  fs.mkdirSync(PUBLISH_DIR, { recursive: true });

  // 3) Copy payload while DEREFERENCING links
  ["lib", "cli", "bin", "templates", "views", "public", "commands"].forEach(
    (p) => copyIfExists(p, PUBLISH_DIR),
  );
  copyIfExists("package.json", PUBLISH_DIR);
  copyIfExists("README.md", PUBLISH_DIR);
  copyIfExists("LICENSE", PUBLISH_DIR);

  // 4) Verify no links remain in staging
  console.log("> verifying staging (.publish) has no links…");
  try {
    // If these print anything, we abort
    execSync(
      `cd ${PUBLISH_DIR} && { find . -type l -print -quit | grep -q . && echo 'Symlinks present in staging' && exit 1 || true; }`,
      { stdio: "inherit", shell: "/bin/bash" },
    );
    execSync(
      `cd ${PUBLISH_DIR} && { find . -type f -links +1 -print -quit | grep -q . && echo 'Hard links present in staging' && exit 1 || true; }`,
      { stdio: "inherit", shell: "/bin/bash" },
    );
  } catch (e) {
    console.error(
      "Staging verification failed. Fix the reported paths and re-run.",
    );
    process.exit(1);
  }

  // 5) Tighten files whitelist inside staged package.json (optional but safer)
  const stagedPkgPath = path.join(PUBLISH_DIR, "package.json");
  if (exists(stagedPkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(stagedPkgPath, "utf8"));
    pkg.files = [
      "lib/**",
      "cli/**",
      "bin/**",
      "templates/**",
      "views/**",
      "public/**",
      "commands/**",
      "README.md",
      "LICENSE",
    ];
    // ensure main/bin unchanged
    fs.writeFileSync(stagedPkgPath, JSON.stringify(pkg, null, 2));
  }

  console.log("✅ Staging ready at .publish");
  console.log(
    '   Next: run "npm run release" to bump & publish from .publish/',
  );
} catch (err) {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
}
