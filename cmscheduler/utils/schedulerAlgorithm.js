//This algorithm generates a weekly schedule for a store with the following constraints:
//- Each day must have at least 1 MOD (manager on duty) who is a lead employee.
//- Leads prefer either opening or closing shifts, but can be scheduled for the opposite if needed.
//- Full-time employees should be scheduled for 9-hour shifts to meet their weekly hours, but can be adjusted if needed.
//- Part-time employees are scheduled based on their availability windows and remaining hours, with a minimum shift length of 3 hours.
//- Employees have a preferred day off, which is a soft constraint (try to honor but can override if necessary).
//The algorithm first filters available employees for each day, then assigns MODs, followed by remaining leads and non-leads, while tracking assigned hours and days worked to ensure constraints are met. Finally, it validates the schedule and outputs any warnings.

class Employee {
    constructor(name, role, isFullTime, hoursPerWeek, isLead, preferredDayOff, preferClosing, availability, isOffSaturday = false) {
        this.name = name;
        this.role = role;
        this.isFullTime = isFullTime;
        this.hoursPerWeek = hoursPerWeek;
        this.isLead = isLead;
        this.preferredDayOff = preferredDayOff;
        this.preferClosing = preferClosing;
        this.availability = availability;
        this.assignedHours = 0;
        this.modHours = 0;
        this.daysWorked = 0;
        this.daysToWork = isFullTime ? Math.ceil(hoursPerWeek / 9) : Infinity; //PT uses hours remaining, not days
        this.schedule = {};
        this.isOffSaturday = isOffSaturday;
        this.saturdayReserved = false;
        this.reservedSaturdayHours = 0;
    }
}

const fullTimeShifts = {
    "8-5":  { start: 8,  end: 17 },
    "9-6":  { start: 9,  end: 18 },
    "10-7": { start: 10, end: 19 },
    "11-8": { start: 11, end: 20 },
    "1-10": { start: 13, end: 22 }
};

const workDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const storeHours = {
    "Monday":    { open: 10, close: 21 },
    "Tuesday":   { open: 10, close: 21 },
    "Wednesday": { open: 10, close: 21 },
    "Thursday":  { open: 10, close: 21 },
    "Friday":    { open: 10, close: 21 },
    "Saturday":  { open: 9,  close: 21 },
};

let finalSchedule = {
    "Monday":    [],
    "Tuesday":   [],
    "Wednesday": [],
    "Thursday":  [],
    "Friday":    [],
    "Saturday":  []
};

function canWork(emp, day) {
    if (!emp.isFullTime) {
        // On Saturday use full budget; Mon-Fri subtract reserved Saturday hours
        let effectiveMax = (day === "Saturday") ? emp.hoursPerWeek : emp.hoursPerWeek - emp.reservedSaturdayHours;
        return emp.assignedHours < effectiveMax;
    }
    // FT: on Mon-Fri, reserve one day for Saturday if flagged
    let effectiveDaysToWork = (day !== "Saturday" && emp.saturdayReserved) ? emp.daysToWork - 1 : emp.daysToWork;
    return emp.assignedHours < emp.hoursPerWeek && emp.daysWorked < effectiveDaysToWork;
}

function getPTShiftHours(emp, day) {
    let window = emp.availability[day];
    let windowLength = window[1] - window[0];
    let effectiveMax = (day === "Saturday") ? emp.hoursPerWeek : emp.hoursPerWeek - emp.reservedSaturdayHours;
    let hoursRemaining = effectiveMax - emp.assignedHours;
    return Math.min(windowLength, hoursRemaining);
}

function getPTShiftLabel(emp, day) {
    let window = emp.availability[day];
    let effectiveMax = (day === "Saturday") ? emp.hoursPerWeek : emp.hoursPerWeek - emp.reservedSaturdayHours;
    let hoursRemaining = effectiveMax - emp.assignedHours;
    let shiftLength = Math.min(window[1] - window[0], hoursRemaining);
    let start = emp.preferClosing ? window[1] - shiftLength : window[0];
    let end = start + shiftLength;
    return `${start > 12 ? start - 12 : start}:00-${end > 12 ? end - 12 : end}:00`;
}

function assignEmployee(day, emp, shift, isMOD, shiftHours = 9) {
    finalSchedule[day].push({ name: emp.name, shift: shift, isMOD: isMOD });
    emp.assignedHours += shiftHours;
    emp.daysWorked += 1;
    emp.schedule[day] = { shift: shift, isMOD: isMOD, hours: shiftHours };
    if (isMOD) emp.modHours += shiftHours;
}

function assignShifts(day, availableEmployees) {
    let leads = availableEmployees.filter(emp => emp.isLead && canWork(emp, day));
    let nonLeads = availableEmployees.filter(emp => !emp.isLead && canWork(emp, day));

    let assignedLeadNames = [];

    //assign opening lead MOD
    let openerLead = leads.find(l => !l.preferClosing);
    if (openerLead) {
        let shift = day === "Saturday" ? "8-5" : "9-6";
        assignEmployee(day, openerLead, shift, true);
        assignedLeadNames.push(openerLead.name);
    }

    //assign closing lead MOD
    let closerLead = leads.find(l => l.preferClosing && !assignedLeadNames.includes(l.name));

    //if no prefer-closing lead found, use any remaining lead
    if (!closerLead) {
        closerLead = leads.find(l => !assignedLeadNames.includes(l.name));
    }

    if (closerLead) {
        assignEmployee(day, closerLead, "1-10", true);
        assignedLeadNames.push(closerLead.name);
    }

    //flag if MOD coverage is incomplete
    if (assignedLeadNames.length < 2) {
        finalSchedule[day].push({ warning: "MOD coverage incomplete - review needed" });
    }

    //assign remaining leads as regular employees if any left
    let remainingLeads = leads.filter(l => !assignedLeadNames.includes(l.name));
    for (let lead of remainingLeads) {
        if (!canWork(lead, day)) continue;
        let shift = lead.preferClosing ? "1-10" : "9-6";
        assignEmployee(day, lead, shift, false);
    }

    //assign non-leads
    for (let emp of nonLeads) {
        if (!canWork(emp, day)) continue;
        if (emp.isFullTime) {
            let shift = emp.preferClosing ? "1-10" : "9-6";
            assignEmployee(day, emp, shift, false);
        } else {
            //PT: calculate shift based on availability window and remaining hours
            let shiftHours = getPTShiftHours(emp, day);
            if (shiftHours < 3) continue; //not worth scheduling for less than 3 hours
            let shiftLabel = getPTShiftLabel(emp, day);
            assignEmployee(day, emp, shiftLabel, false, shiftHours);
        }
    }
}

function reserveSaturday(employees) {
    for (let emp of employees) {
        emp.saturdayReserved = false;
        emp.reservedSaturdayHours = 0;

        if (emp.isOffSaturday) continue;
        if (emp.preferredDayOff === "Saturday") continue;

        if (emp.isFullTime) {
            emp.saturdayReserved = true;
        } else {
            if (emp.availability["Saturday"] !== null) {
                let window = emp.availability["Saturday"];
                let shiftHours = Math.min(window[1] - window[0], emp.hoursPerWeek);
                if (shiftHours >= 3) {
                    emp.saturdayReserved = true;
                    emp.reservedSaturdayHours = shiftHours;
                }
            }
        }
    }
}

function generateSchedule(employees) {
    reserveSaturday(employees);
    for (let i = 0; i < workDays.length; i++) {
        let day = workDays[i];
        let availableEmployees = [];

        for (let j = 0; j < employees.length; j++) {
            let emp = employees[j];

            //skip if already hit their hours or days limit
            if (!canWork(emp, day)) continue;

            //skip preferred day off (soft constraint)
            if (emp.preferredDayOff === day) continue;

            //FT: skip Saturday if they have their monthly Saturday off
            if (emp.isFullTime && day === "Saturday" && emp.isOffSaturday) continue;

            //FT always available
            if (emp.isFullTime) {
                availableEmployees.push(emp);
                continue;
            }

            //PT check availability map
            if (emp.availability[day] !== null) {
                availableEmployees.push(emp);
            }
        }

        assignShifts(day, availableEmployees);
    }
}

function validateSchedule(employees) {
    let warnings = [];

    for (let emp of employees) {
        if (emp.isLead && emp.modHours < 10) {
            warnings.push(`${emp.name} only has ${emp.modHours} MOD hours this week (minimum 10)`);
        }
        if (emp.isFullTime) {
            //FT employees may go slightly over due to 9hr shift math, allow up to 5hr overage
            if (emp.assignedHours > emp.hoursPerWeek + 5) {
                warnings.push(`${emp.name} is assigned ${emp.assignedHours} hours but needs ${emp.hoursPerWeek} (significantly over)`);
            } else if (emp.assignedHours < emp.hoursPerWeek) {
                warnings.push(`${emp.name} is assigned ${emp.assignedHours} hours but needs ${emp.hoursPerWeek} (under)`);
            }
        } else {
            if (emp.assignedHours !== emp.hoursPerWeek) {
                warnings.push(`${emp.name} is assigned ${emp.assignedHours} hours but needs ${emp.hoursPerWeek}`);
            }
        }
    }

    for (let day of workDays) {
        let hasMOD = finalSchedule[day].some(entry => entry.isMOD === true);
        if (!hasMOD) {
            warnings.push(`${day} has no MOD coverage`);
        }
    }

    return warnings;
}


//tests

let employees = [ //name, role, isFullTime, hoursPerWeek, isLead, preferredDayOff, preferClosing, availability, isOffSaturday
    new Employee("Alice",   "BOA", true,  40, true,  "Monday",    false, null, false), // working Saturday
    new Employee("Bob",     "BOA", true,  40, true,  "Tuesday",   true,  null, false), // working Saturday
    new Employee("Charlie", "BOA", true,  36, false, "Wednesday", false, null, true),  // off Saturday this month
    new Employee("Grace",   "BOA", true,  32, false, "Monday",    false, null, true),  // off Saturday this month
    new Employee("Heidi",   "BOA", true,  32, false, "Tuesday",   true,  null, false), // working Saturday
    new Employee("Diana",   "BOA", false, 24, false, "Thursday",  true,  { "Monday": [13, 22], "Tuesday": [13, 22], "Wednesday": [13, 22], "Thursday": null,    "Friday": [13, 22], "Saturday": [9, 18] }),
    new Employee("Eve",     "BOA", false, 19, false, "Friday",    false, { "Monday": [8, 14],  "Tuesday": [8, 14],  "Wednesday": [8, 14],  "Thursday": [8, 14], "Friday": null,     "Saturday": [9, 15] }),
    new Employee("Frank",   "BOA", false, 15, false, "Saturday",  true,  { "Monday": [14, 22], "Tuesday": [14, 22], "Wednesday": [14, 22], "Thursday": [14, 22], "Friday": [14, 22], "Saturday": null }),
    new Employee("Ivan",    "BOA", false, 11, false, "Wednesday", false, { "Monday": null,     "Tuesday": [8, 14],  "Wednesday": null,     "Thursday": null,    "Friday": [16, 22], "Saturday": [9, 14] }),
];

generateSchedule(employees);
console.log("Final Schedule:", JSON.stringify(finalSchedule, null, 2));
console.log("Validation Warnings:", validateSchedule(employees));