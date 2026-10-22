#!/usr/bin/env bash
# Quick launcher to view the SPIT Cache Module Dashboard locally
cd "$(dirname "$0")"
PORT=3000

# Find available port if 3000 is occupied
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; do
    PORT=$((PORT + 1))
done

echo "=========================================================="
echo " 🎓 SPIT Cache Module — Academic Project Dashboard"
echo " 🌐 Serving at: http://localhost:$PORT"
echo "=========================================================="

sleep 0.5
open "http://localhost:$PORT" 2>/dev/null || xdg-open "http://localhost:$PORT" 2>/dev/null

python3 -m http.server "$PORT" --directory "Phase2/dist"
