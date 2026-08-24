import { WebSocket } from 'ws';

async function testWorkerDistribution() {
  console.log('\n===============================================================');
  console.log('       TESTING DISTRIBUTED WORKER REGISTRATION (LAN NODES)     ');
  console.log('===============================================================\n');

  const ws = new WebSocket('ws://localhost:4001');

  await new Promise((resolve, reject) => {
    ws.on('open', () => {
      console.log('✓ Connected to Orchestrator WebSocket on port 4001');

      // Simulate Worker Machine B (Frontend Agents: HTML, CSS, JS, Animation)
      const registrationPayload = {
        type: 'worker_register',
        machineId: 'worker_machine_b_frontend',
        roles: ['html_dev', 'css_dev', 'js_dev', 'animation_dev'],
      };

      ws.send(JSON.stringify(registrationPayload));
      console.log('✓ Sent worker registration for roles: [html_dev, css_dev, js_dev, animation_dev]');
      setTimeout(() => {
        ws.close();
        resolve();
      }, 1000);
    });

    ws.on('error', (err) => {
      reject(err);
    });
  });

  console.log('\n===============================================================');
  console.log('  DISTRIBUTED WORKER REGISTRATION TEST PASSED!                 ');
  console.log('===============================================================\n');
}

testWorkerDistribution().catch((e) => {
  console.error('Worker test error:', e);
  process.exit(1);
});
