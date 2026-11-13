#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  One time: installs rclone in ~/bin and creates the Google Drive remote "gdrive" from a token file
#  made on the owner's computer (rclone authorize "drive"), then deletes the token file.
#    bash ~/yusr-drive-setup.sh ~/.yusr-gdrive-token.json
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
TOKEN_FILE="${1:-$HOME/.yusr-gdrive-token.json}"
mkdir -p "$HOME/bin"
if [[ ! -x "$HOME/bin/rclone" ]]; then
  tmp=$(mktemp -d); cd "$tmp"
  curl -sSLo rclone.zip https://downloads.rclone.org/rclone-current-linux-amd64.zip
  php -r '$z=new ZipArchive(); $z->open("rclone.zip"); $z->extractTo("."); $z->close();'
  cp rclone-*-linux-amd64/rclone "$HOME/bin/rclone"; chmod 700 "$HOME/bin/rclone"; cd ~; rm -rf "$tmp"
fi
"$HOME/bin/rclone" version | head -1
[[ -s "$TOKEN_FILE" ]] || { echo "مفيش ملف التوكن: $TOKEN_FILE"; exit 1; }
"$HOME/bin/rclone" config create gdrive drive scope=drive token="$(cat "$TOKEN_FILE")" --non-interactive >/dev/null
rm -f "$TOKEN_FILE"
chmod 600 "$HOME/.config/rclone/rclone.conf"
"$HOME/bin/rclone" mkdir gdrive:ElyusrBackups
"$HOME/bin/rclone" lsd gdrive: | grep -q ElyusrBackups && echo "✅ جوجل درايف اتربط، والفولدر ElyusrBackups جاهز."
