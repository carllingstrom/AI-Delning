// Simulate the exact data structure from the database
const effectEntry = {
  "effectComment": "Inget uppmätt utan uppskattat värde på grund av den smala utrullningen och projektet som är i innovationsstadiet och inte brett implementerat i organisationen. 15000kr/h baserat på 500kr/anställd x 30 anställda. ",
  "hasQualitative": "false",
  "valueDimension": "",
  "hasQuantitative": "true",
  "quantitativeDetails": {
    "effectType": "redistribution",
    "redistributionDetails": {
      "valueUnit": "hours",
      "countDetails": {
        "newCount": null,
        "timescale": "",
        "currentCount": null,
        "valuePerUnit": null
      },
      "hoursDetails": {
        "newHours": 39,
        "timescale": "per_week",
        "hourlyRate": 500,
        "currentHours": 40,
        "affectedPeople": 30,
        "newTimePerPerson": 39,
        "currentTimePerPerson": 40
      },
      "otherDetails": {
        "newAmount": null,
        "timescale": "per_month",
        "customUnit": "",
        "valuePerUnit": null,
        "currentAmount": null
      },
      "resourceType": "Handläggare och chefer",
      "currencyDetails": {
        "newAmount": null,
        "timescale": "",
        "currentAmount": null
      },
      "annualizationYears": 1
    }
  },
  "customValueDimension": ""
};

console.log('Effect entry from database:');
console.log(JSON.stringify(effectEntry, null, 2));

// Extract the redistribution details
const redistributionDetails = effectEntry.quantitativeDetails.redistributionDetails;
console.log('\nRedistribution details:');
console.log(JSON.stringify(redistributionDetails, null, 2));

// Simulate calculateSavedAmount logic
const currentHours = redistributionDetails.hoursDetails.currentHours || 
                    (redistributionDetails.hoursDetails.currentTimePerPerson || 0) * (redistributionDetails.hoursDetails.affectedPeople || 0);
const newHours = redistributionDetails.hoursDetails.newHours || 
                (redistributionDetails.hoursDetails.newTimePerPerson || 0) * (redistributionDetails.hoursDetails.affectedPeople || 0);
const hourlyRate = redistributionDetails.hoursDetails.hourlyRate || 0;
const timescale = redistributionDetails.hoursDetails.timescale || 'week';

console.log('\nCalculated values:');
console.log('- currentHours:', currentHours);
console.log('- newHours:', newHours);
console.log('- hourlyRate:', hourlyRate);
console.log('- timescale:', timescale);

// Calculate multiplier
function getTimescaleMultiplier(timescale) {
  switch (timescale.toLowerCase()) {
    case 'hour':
    case 'timme':
      return 2080;
    case 'day':
    case 'dag':
      return 260;
    case 'week':
    case 'vecka':
    case 'per_week':
      return 52;
    case 'month':
    case 'månad':
    case 'per_month':
      return 12;
    case 'year':
    case 'år':
    case 'per_year':
      return 1;
    default:
      return 1;
  }
}

const multiplier = getTimescaleMultiplier(timescale);
const savedAmount = (currentHours - newHours) * hourlyRate * multiplier;

console.log('- multiplier:', multiplier);
console.log('- savedAmount:', savedAmount);

// Expected calculation
const expectedCurrentHours = 40 * 30; // 1200
const expectedNewHours = 39 * 30; // 1170
const expectedSavedAmount = (expectedCurrentHours - expectedNewHours) * 500 * 52; // 780,000

console.log('\nExpected calculation:');
console.log('- expectedCurrentHours:', expectedCurrentHours);
console.log('- expectedNewHours:', expectedNewHours);
console.log('- expectedSavedAmount:', expectedSavedAmount); 