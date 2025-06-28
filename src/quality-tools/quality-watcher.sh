#!/bin/bash

# Quality watcher that runs checks every 2 minutes
# Usage: ./quality-watcher.sh [start|stop|status]

PIDFILE="/tmp/refakts-quality-watcher.pid"
LOGFILE="/tmp/refakts-quality-watcher.log"

case "${1:-start}" in
  start)
    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
      echo "Quality watcher is already running (PID: $(cat $PIDFILE))"
      exit 1
    fi
    
    echo "Starting quality watcher (checks every 2 minutes)..."
    echo "Log: $LOGFILE"
    
    # Start background process and properly detach
    nohup bash -c '
      while true; do
        echo "$(date): Running quality checks..." >> "'"$LOGFILE"'"
        
        # Run quality checks - these interrupt Claude, not the user
        if ! npm run quality >> "'"$LOGFILE"'" 2>&1; then
          echo "🚨 QUALITY ISSUES DETECTED - Check terminal for 👧🏻💬 prompts!" >> "'"$LOGFILE"'"
        fi
        
        # Check if tests were run recently (within last 2 minutes)
        LAST_TEST_RUN=$(find . -name "*.test.*" -newer /tmp/refakts-last-test 2>/dev/null | head -1)
        if [ ! -f "/tmp/refakts-last-test" ] || [ -z "$(find /tmp/refakts-last-test -mmin -2 2>/dev/null)" ]; then
          echo "👧🏻💬 TESTS: You haven'\''t run tests recently! Run \`npm test\` to verify your changes work." >> "'"$LOGFILE"'"
        fi
        
        sleep 120  # 2 minutes
      done
    ' > /dev/null 2>&1 &
    
    echo $! > "$PIDFILE"
    echo "Quality watcher started (PID: $!)"
    ;;
    
  stop)
    if [ -f "$PIDFILE" ]; then
      PID=$(cat "$PIDFILE")
      if kill "$PID" 2>/dev/null; then
        echo "Quality watcher stopped (PID: $PID)"
        rm -f "$PIDFILE"
      else
        echo "Failed to stop quality watcher (PID: $PID)"
        rm -f "$PIDFILE"
        exit 1
      fi
    else
      echo "Quality watcher is not running"
      exit 1
    fi
    ;;
    
  status)
    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
      echo "Quality watcher is running (PID: $(cat $PIDFILE))"
      echo "Last 10 log entries:"
      tail -10 "$LOGFILE" 2>/dev/null || echo "No log file found"
    else
      echo "Quality watcher is not running"
      rm -f "$PIDFILE"
    fi
    ;;
    
  *)
    echo "Usage: $0 {start|stop|status}"
    echo ""
    echo "  start  - Start quality watcher (runs checks every 2 minutes)"
    echo "  stop   - Stop quality watcher"
    echo "  status - Check if watcher is running and show recent logs"
    exit 1
    ;;
esac