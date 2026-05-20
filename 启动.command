#!/bin/bash
cd "$(dirname "$0")"
chmod +x ./经营宝助手 2>/dev/null
./经营宝助手 &
sleep 2
open "http://localhost:3000"
