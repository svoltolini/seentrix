#!/bin/bash
# Generate localized Academy audio briefings (DE/FR/IT) with distinct native
# voices per language, then place them at public/academy/<lesson>-briefing.<lang>.mp3
set -u
cd /home/user/workspace/seentrix
OUT=public/academy
mkdir -p "$OUT"
LOG=/home/user/workspace/seentrix/audio_gen.log
echo "=== audio generation started $(date) ===" > "$LOG"

# Distinct native voice per language
declare -A VOICE=( [de]="charon" [fr]="aoede" [it]="rasalgethi" )

for script in audio-scripts/*.txt; do
  base=$(basename "$script" .txt)          # e.g. cra-101.de
  lesson="${base%.*}"                        # cra-101
  lang="${base##*.}"                         # de
  dest="$OUT/${lesson}-briefing.${lang}.mp3"
  if [ -f "$dest" ]; then
    echo "SKIP (exists): $dest" >> "$LOG"
    continue
  fi
  voice="${VOICE[$lang]}"
  echo ">>> $(date +%H:%M:%S) generating $base with voice=$voice" >> "$LOG"
  asi-text-to-speech "{\"file_path\": \"/home/user/workspace/seentrix/$script\", \"voice\": \"$voice\"}" >> "$LOG" 2>&1
  produced="/home/user/workspace/${base}.mp3"
  if [ -f "$produced" ]; then
    mv "$produced" "$dest"
    echo "OK: $dest" >> "$LOG"
  else
    echo "FAIL: no output for $base" >> "$LOG"
  fi
done
echo "=== audio generation finished $(date) ===" >> "$LOG"
