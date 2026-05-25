const crypto = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");
const https = require("https");
const path = require("path");
const { spawn } = require("child_process");
const tar = require("tar");

const rootDir = path.resolve(__dirname, "..");
const releaseName = "dmg-builder@1.2.0";
const releaseVersion = "75c8a6c";
const arch = process.arch === "arm64" ? "arm64" : "x86_64";
const filename = `dmgbuild-bundle-${arch}-${releaseVersion}.tar.gz`;
const checksums = {
  "dmgbuild-bundle-arm64-75c8a6c.tar.gz": "a785f2a385c8c31996a089ef8e26361904b40c772d5ea65a36001212f1fc25e0",
  "dmgbuild-bundle-x86_64-75c8a6c.tar.gz": "87b3bb72148b11451ee90ede79cc8d59305c9173b68b0f2b50a3bea51fc4a4e2",
};

const cacheDir = path.join(rootDir, ".cache");
const dmgbuildDir = path.join(cacheDir, "dmgbuild", releaseName, filename.replace(/\.tar\.gz$/, ""));
const dmgbuildPath = path.join(dmgbuildDir, "dmgbuild");
const archivePath = path.join(cacheDir, "downloads", filename);

function download(url, output) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        download(response.headers.location, output).then(resolve, reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Download failed: ${response.statusCode} ${response.statusMessage} (${url})`));
        return;
      }

      const file = fs.createWriteStream(output);
      response.pipe(file);
      file.on("finish", () => file.close(resolve));
      file.on("error", reject);
    });

    request.on("error", reject);
  });
}

async function sha256(file) {
  const hash = crypto.createHash("sha256");
  await new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .on("data", chunk => hash.update(chunk))
      .on("end", resolve)
      .on("error", reject);
  });
  return hash.digest("hex");
}

async function ensureDmgbuild() {
  if (fs.existsSync(dmgbuildPath)) {
    return;
  }

  await fsp.mkdir(path.dirname(archivePath), { recursive: true });
  await fsp.mkdir(dmgbuildDir, { recursive: true });

  const expected = checksums[filename];
  let validArchive = false;
  if (fs.existsSync(archivePath)) {
    validArchive = (await sha256(archivePath)) === expected;
  }

  if (!validArchive) {
    const encodedRelease = encodeURIComponent(releaseName);
    const url = `https://mirrors.huaweicloud.com/electron-builder-binaries/${encodedRelease}/${filename}`;
    console.log(`Downloading ${filename} from Huawei Cloud mirror...`);
    await download(url, archivePath);
  }

  const actual = await sha256(archivePath);
  if (actual !== expected) {
    throw new Error(`Checksum mismatch for ${filename}: expected ${expected}, got ${actual}`);
  }

  await tar.extract({ file: archivePath, cwd: dmgbuildDir, strip: 1 });
}

async function main() {
  await ensureDmgbuild();

  const env = {
    ...process.env,
    ELECTRON_BUILDER_CACHE: path.join(cacheDir, "electron-builder"),
    CUSTOM_DMGBUILD_PATH: dmgbuildPath,
  };

  delete env.ELECTRON_MIRROR;
  delete env.ELECTRON_CUSTOM_DIR;
  delete env.ELECTRON_CUSTOM_FILENAME;
  delete env.npm_config_electron_mirror;
  delete env.npm_config_electron_custom_dir;
  delete env.npm_config_electron_custom_filename;
  delete env.NPM_CONFIG_ELECTRON_MIRROR;
  delete env.NPM_CONFIG_ELECTRON_CUSTOM_DIR;
  delete env.NPM_CONFIG_ELECTRON_CUSTOM_FILENAME;

  const builder = path.join(rootDir, "node_modules", ".bin", "electron-builder");
  const child = spawn(builder, ["--mac", "--arm64"], {
    cwd: rootDir,
    env,
    stdio: "inherit",
  });

  child.on("exit", code => {
    process.exit(code || 0);
  });
  child.on("error", error => {
    console.error(error);
    process.exit(1);
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
