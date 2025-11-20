# Appointment Calendar Setup Guide

## 📦 Installation Required

The appointment calendar component requires FullCalendar packages to be installed.

### Quick Install (Windows)

Run the installation script:
```bash
install-calendar.bat
```

### Manual Install

Or install manually:
```bash
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction date-fns
```

### Linux/Mac

Use the shell script:
```bash
chmod +x install-calendar.sh
./install-calendar.sh
```

---

## 🚀 After Installation

### 1. Start Development Server
```bash
npm run dev
```

### 2. Navigate to Calendar
Open your browser to:
```
http://localhost:3001/appointments/calendar
```

---

## 📋 What Gets Installed

### FullCalendar Packages
- `@fullcalendar/react` - React wrapper for FullCalendar
- `@fullcalendar/core` - Core FullCalendar functionality
- `@fullcalendar/daygrid` - Month view plugin
- `@fullcalendar/timegrid` - Week/day view plugin
- `@fullcalendar/interaction` - Click/select interactions

### Date Utilities
- `date-fns` - Date manipulation library

---

## ✅ Verification

After installation, the TypeScript errors in `AppointmentCalendar.tsx` should disappear.

### Check Installation
```bash
npm list @fullcalendar/react
```

Should show:
```
@fullcalendar/react@6.x.x
```

---

## 🎨 Features

Once installed, the calendar will provide:

- ✅ **Month View** - Full month grid
- ✅ **Week View** - 7-day time grid
- ✅ **Day View** - Single day hourly view
- ✅ **Color Coding** - Status-based colors
- ✅ **Click Handlers** - View/create appointments
- ✅ **Responsive** - Works on all screen sizes

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@fullcalendar/react'"

**Solution**: Run the installation script or manual install command

### Issue: "Module not found" after install

**Solution**: 
1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install`
4. Run installation script again

### Issue: TypeScript errors persist

**Solution**:
1. Restart your IDE/editor
2. Run `npm run build` to verify
3. Check that packages are in `package.json`

---

## 📚 Documentation

- [FullCalendar Docs](https://fullcalendar.io/docs)
- [FullCalendar React](https://fullcalendar.io/docs/react)
- [date-fns Docs](https://date-fns.org/)

---

**Team Alpha - Calendar Setup Guide**
