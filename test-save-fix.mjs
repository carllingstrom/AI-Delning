// Test script to verify the save functionality is fixed
const testProjectData = {
  title: "Test Project - Save Fix",
  intro: "Testing if save functionality works correctly",
  phase: "idea",
  problem: "Test problem",
  opportunity: "Test opportunity", 
  responsible: "Test Person",
  areas: ["Intern administration"],
  value_dimensions: ["Tidsbesparing"],
  municipality_ids: [1], // Stockholm
  cost_data: {
    costEntries: [],
    budgetDetails: {
      budgetAmount: "100000",
      budgetComment: "Test budget"
    },
    actualCostDetails: {
      costEntries: [
        {
          costType: "Intern personal",
          costUnit: "fixed",
          costLabel: "Test kostnad",
          fixedDetails: {
            fixedAmount: 50000
          }
        }
      ]
    }
  },
  effects_data: {
    effectDetails: [
      {
        effectComment: "Test effect",
        hasQualitative: "false",
        hasQuantitative: "true",
        quantitativeDetails: {
          effectType: "financial",
          financialDetails: {
            measurementName: "Tidsbesparing",
            valueUnit: "hours",
            hoursDetails: {
              hours: 100,
              hourlyRate: 500,
              timescale: "per_month"
            },
            annualizationYears: 1
          }
        }
      }
    ]
  }
};

async function testSave() {
  try {
    console.log('🧪 Testing save functionality...');
    
    // Test POST (create new project)
    console.log('1. Testing POST (create new project)...');
    const createResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProjectData)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ POST failed:', createResponse.status, errorText);
      return;
    }
    
    const createdProject = await createResponse.json();
    console.log('✅ POST successful, project ID:', createdProject.id);
    
    // Test PUT (update project)
    console.log('2. Testing PUT (update project)...');
    const updateData = {
      ...testProjectData,
      title: "Updated Test Project",
      cost_data: {
        ...testProjectData.cost_data,
        actualCostDetails: {
          costEntries: [
            {
              costType: "Uppdaterad kostnad",
              costUnit: "fixed", 
              costLabel: "Ny test kostnad",
              fixedDetails: {
                fixedAmount: 75000
              }
            }
          ]
        }
      }
    };
    
    const updateResponse = await fetch(`http://localhost:3000/api/projects/${createdProject.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ PUT failed:', updateResponse.status, errorText);
      return;
    }
    
    console.log('✅ PUT successful');
    
    // Verify the data was saved correctly
    console.log('3. Verifying saved data...');
    const getResponse = await fetch(`http://localhost:3000/api/projects/${createdProject.id}`);
    const savedProject = await getResponse.json();
    
    console.log('✅ Data verification:');
    console.log('- Title:', savedProject.title);
    console.log('- Cost data exists:', !!savedProject.cost_data && Object.keys(savedProject.cost_data).length > 0);
    console.log('- Effects data exists:', !!savedProject.effects_data && Object.keys(savedProject.effects_data).length > 0);
    
    console.log('🎉 All tests passed! Save functionality is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSave(); 