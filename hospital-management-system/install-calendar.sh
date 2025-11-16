#!/bin/bash
# Team Alpha - Install Calendar Dependencies
# Run this script to install FullCalendar packages

echo "📦 Installing FullCalendar packages..."
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction date-fns

echo "✅ Calendar packages installed successfully!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Navigate to: http://localhost:3001/appointments/calendar"
echo ""
