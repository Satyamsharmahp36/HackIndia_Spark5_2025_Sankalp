// Test script for LinkedIn integration
// Run this to test if the LinkedIn service is working properly

const LINKEDIN_SERVICE_URL = 'http://localhost:4000';

async function testLinkedInIntegration() {
  console.log('🧪 Testing LinkedIn Integration...\n');
  
  const tests = [
    {
      name: 'Service Health Check',
      test: async () => {
        const response = await fetch(`${LINKEDIN_SERVICE_URL}/`);
        return response.ok;
      }
    },
    {
      name: 'Get LinkedIn Accounts',
      test: async () => {
        const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/linkedin/accounts`);
        return response.ok;
      }
    },
    {
      name: 'Generate HackIndia Post',
      test: async () => {
        const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/ai/posts/hackindia`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'finalist' })
        });
        return response.ok;
      }
    },
    {
      name: 'Generate Achievement Post',
      test: async () => {
        const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/ai/posts/achievement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            achievement: 'Successfully integrated LinkedIn service',
            details: { team: 'Team Sankalp', competition: 'HackIndia 2025' }
          })
        });
        return response.ok;
      }
    },
    {
      name: 'Quick Post Generation',
      test: async () => {
        const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/linkedin/posts/quick-post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: 'Testing LinkedIn integration',
            autoPost: false
          })
        });
        return response.ok;
      }
    },
    {
      name: 'Auto-Create Post',
      test: async () => {
        const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/linkedin/posts/auto-create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            brief: 'Testing the LinkedIn integration for HackIndia project',
            type: 'achievement',
            postImmediately: false
          })
        });
        return response.ok;
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`⏳ Testing: ${test.name}...`);
      const result = await test.test();
      
      if (result) {
        console.log(`✅ ${test.name}: PASSED\n`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAILED\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}\n`);
      failed++;
    }
  }

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! LinkedIn integration is working properly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the LinkedIn service configuration.');
  }
}

// Run the tests
testLinkedInIntegration().catch(console.error);
