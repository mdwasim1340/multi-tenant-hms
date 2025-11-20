// Test the date calculation logic
const new_date = '2025-11-21';
const new_time = '14:00';
const duration = 30;

console.log('🧪 Testing Reschedule Date Calculation\n');
console.log('Input:');
console.log(`  Date: ${new_date}`);
console.log(`  Time: ${new_time}`);
console.log(`  Duration: ${duration} minutes\n`);

// Combine date and time
const newAppointmentDate = `${new_date}T${new_time}:00`;
console.log(`Combined: ${newAppointmentDate}`);

// Parse the date
const appointmentDate = new Date(newAppointmentDate);
console.log(`Parsed Date: ${appointmentDate}`);
console.log(`Timestamp: ${appointmentDate.getTime()}`);

// Calculate end time
const endTimeDate = new Date(appointmentDate);
endTimeDate.setMinutes(endTimeDate.getMinutes() + duration);
console.log(`\nEnd Date Object: ${endTimeDate}`);

// Format end time in LOCAL time (not UTC)
const year = endTimeDate.getFullYear();
const month = String(endTimeDate.getMonth() + 1).padStart(2, '0');
const day = String(endTimeDate.getDate()).padStart(2, '0');
const hours = String(endTimeDate.getHours()).padStart(2, '0');
const minutes = String(endTimeDate.getMinutes()).padStart(2, '0');
const seconds = String(endTimeDate.getSeconds()).padStart(2, '0');
const endTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
console.log(`Formatted End Time (Local): ${endTime}`);

// Verify constraint
console.log(`\n✅ Constraint Check:`);
console.log(`  Start: ${newAppointmentDate}`);
console.log(`  End:   ${endTime}`);
console.log(`  End > Start: ${endTime > newAppointmentDate}`);

if (endTime > newAppointmentDate) {
  console.log('\n🎉 SUCCESS! Constraint will be satisfied');
} else {
  console.log('\n❌ FAIL! Constraint will be violated');
}
