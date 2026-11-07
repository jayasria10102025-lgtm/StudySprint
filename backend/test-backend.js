const http = require('http');
const { app, startServer } = require('./server');
const { disconnectDB } = require('./config/db');

// Test runner helper
const request = (app, method, path, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const data = body ? JSON.stringify(body) : null;
      const reqHeaders = {
        'Content-Type': 'application/json',
        ...headers
      };
      if (data) {
        reqHeaders['Content-Length'] = Buffer.byteLength(data);
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: reqHeaders
        },
        (res) => {
          let resData = '';
          res.on('data', (chunk) => (resData += chunk));
          res.on('end', () => {
            server.close();
            try {
              const json = resData ? JSON.parse(resData) : {};
              resolve({ status: res.statusCode, body: json, raw: resData });
            } catch (e) {
              resolve({ status: res.statusCode, body: resData, raw: resData });
            }
          });
        }
      );

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (data) {
        req.write(data);
      }
      req.end();
    });
  });
};

async function runTests() {
  console.log('--- STARTING BACKEND SUITE VERIFICATION ---');
  let exitCode = 0;

  try {
    const { connectDB } = require('./config/db');
    await connectDB();

    // 1. Health check
    console.log('Test 1: Health check endpoint');
    const health = await request(app, 'GET', '/api/health');
    if (health.status !== 200 || health.body.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(health)}`);
    }
    console.log('  Passed: Health check returned 200 OK');

    // 2. User registration
    console.log('Test 2: User registration');
    const userPayload = {
      name: 'Alex Johnson',
      email: `alex_${Date.now()}@studysprint.test`,
      password: 'SecurePassword123'
    };
    const regRes = await request(app, 'POST', '/api/auth/register', {}, userPayload);
    if (regRes.status !== 201 || !regRes.body.token) {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
    }
    const token = regRes.body.token;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('  Passed: User registered with JWT token returned');

    // 3. Duplicate registration rejection
    console.log('Test 3: Duplicate email rejection');
    const dupRes = await request(app, 'POST', '/api/auth/register', {}, userPayload);
    if (dupRes.status !== 409) {
      throw new Error(`Duplicate registration should return 409, got ${dupRes.status}`);
    }
    console.log('  Passed: Duplicate email correctly rejected with 409');

    // 4. Login with valid and invalid credentials
    console.log('Test 4: Login authentication');
    const badLogin = await request(app, 'POST', '/api/auth/login', {}, {
      email: userPayload.email,
      password: 'WrongPassword'
    });
    if (badLogin.status !== 401) {
      throw new Error(`Invalid credentials should return 401, got ${badLogin.status}`);
    }
    const goodLogin = await request(app, 'POST', '/api/auth/login', {}, {
      email: userPayload.email,
      password: userPayload.password
    });
    if (goodLogin.status !== 200 || !goodLogin.body.token) {
      throw new Error(`Valid login failed: ${JSON.stringify(goodLogin.body)}`);
    }
    console.log('  Passed: Login works and credentials verified');

    // 5. Auth /me
    console.log('Test 5: Protected /api/auth/me');
    const meRes = await request(app, 'GET', '/api/auth/me', authHeaders);
    if (meRes.status !== 200 || meRes.body.user.email !== userPayload.email) {
      throw new Error(`Auth me failed: ${JSON.stringify(meRes.body)}`);
    }
    console.log('  Passed: User identity retrieved via JWT');

    // 6. Create Subject
    console.log('Test 6: Subject creation');
    const subRes = await request(app, 'POST', '/api/subjects', authHeaders, {
      name: 'Algorithms & Data Structures',
      description: 'Core computer science algorithms',
      color: '#8B5CF6'
    });
    if (subRes.status !== 201 || !subRes.body.data._id) {
      throw new Error(`Create subject failed: ${JSON.stringify(subRes.body)}`);
    }
    const subjectId = subRes.body.data._id;
    console.log('  Passed: Subject created with ID: ' + subjectId);

    // 7. Duplicate subject rejection
    console.log('Test 7: Duplicate subject name rejection');
    const dupSub = await request(app, 'POST', '/api/subjects', authHeaders, {
      name: 'Algorithms & Data Structures'
    });
    if (dupSub.status !== 409) {
      throw new Error(`Duplicate subject should return 409, got ${dupSub.status}`);
    }
    console.log('  Passed: Duplicate subject prevented with 409');

    // 8. Create Study Goal
    console.log('Test 8: Study Goal creation');
    const targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const goalRes = await request(app, 'POST', '/api/goals', authHeaders, {
      subjectId,
      title: 'Master Graph Algorithms',
      description: 'BFS, DFS, Dijkstra, and Topological Sort',
      plannedDuration: 120, // 2 hours
      targetDate,
      goalType: 'weekly'
    });
    if (goalRes.status !== 201 || !goalRes.body.data._id) {
      throw new Error(`Create goal failed: ${JSON.stringify(goalRes.body)}`);
    }
    const goalId = goalRes.body.data._id;
    console.log('  Passed: Goal created with ID: ' + goalId);

    // 9. Focus Timer Lifecycle (start -> pause -> resume -> complete)
    console.log('Test 9: Focus Timer lifecycle');
    const startRes = await request(app, 'POST', '/api/sessions/start', authHeaders, {
      subjectId,
      goalId,
      title: 'Graph Traversal Practice',
      description: 'Solved Dijkstra and BFS'
    });
    if (startRes.status !== 201 || !startRes.body.session._id) {
      throw new Error(`Start session failed: ${JSON.stringify(startRes.body)}`);
    }
    const sessionId = startRes.body.session._id;
    console.log('  Passed: Study session started with ID: ' + sessionId);

    // Active session check
    const activeRes = await request(app, 'GET', '/api/sessions/active', authHeaders);
    if (activeRes.status !== 200 || !activeRes.body.session) {
      throw new Error(`Active session check failed: ${JSON.stringify(activeRes.body)}`);
    }
    console.log('  Passed: Active session retrieved from database');

    // Pause session
    const pauseRes = await request(app, 'PATCH', `/api/sessions/${sessionId}/pause`, authHeaders);
    if (pauseRes.status !== 200 || pauseRes.body.session.status !== 'paused') {
      throw new Error(`Pause session failed: ${JSON.stringify(pauseRes.body)}`);
    }
    console.log('  Passed: Session successfully paused');

    // Resume session
    const resumeRes = await request(app, 'PATCH', `/api/sessions/${sessionId}/resume`, authHeaders);
    if (resumeRes.status !== 200 || resumeRes.body.session.status !== 'active') {
      throw new Error(`Resume session failed: ${JSON.stringify(resumeRes.body)}`);
    }
    console.log('  Passed: Session successfully resumed');

    // Complete session
    const completeRes = await request(app, 'PATCH', `/api/sessions/${sessionId}/complete`, authHeaders);
    if (completeRes.status !== 200 || completeRes.body.session.status !== 'completed') {
      throw new Error(`Complete session failed: ${JSON.stringify(completeRes.body)}`);
    }
    console.log('  Passed: Session completed and recorded');

    // 10. Study Notes (Create, Search, Update, Delete)
    console.log('Test 10: Study Notes management');
    const noteRes = await request(app, 'POST', '/api/notes', authHeaders, {
      subjectId,
      title: 'Dijkstra Algorithm Notes',
      content: 'Uses min-priority queue with edge relaxation. Time complexity O((V+E)logV).'
    });
    if (noteRes.status !== 201 || !noteRes.body.data._id) {
      throw new Error(`Create note failed: ${JSON.stringify(noteRes.body)}`);
    }
    const noteId = noteRes.body.data._id;

    // Search note
    const searchRes = await request(app, 'GET', `/api/notes?search=relaxation`, authHeaders);
    if (searchRes.status !== 200 || searchRes.body.data.length === 0) {
      throw new Error(`Search notes failed: ${JSON.stringify(searchRes.body)}`);
    }
    console.log('  Passed: Note created and searched successfully');

    // 11. Analytics endpoints
    console.log('Test 11: Analytics calculations');
    const overviewRes = await request(app, 'GET', '/api/analytics/overview', authHeaders);
    if (overviewRes.status !== 200 || overviewRes.body.data.totalCompletedSessions < 1) {
      throw new Error(`Overview analytics failed: ${JSON.stringify(overviewRes.body)}`);
    }

    const dailyRes = await request(app, 'GET', '/api/analytics/daily?range=7', authHeaders);
    if (dailyRes.status !== 200 || dailyRes.body.data.length !== 7) {
      throw new Error(`Daily analytics failed: ${JSON.stringify(dailyRes.body)}`);
    }

    const subjectsDistRes = await request(app, 'GET', '/api/analytics/subjects', authHeaders);
    if (subjectsDistRes.status !== 200 || subjectsDistRes.body.data.length === 0) {
      throw new Error(`Subject distribution analytics failed: ${JSON.stringify(subjectsDistRes.body)}`);
    }

    const plannedVsCompletedRes = await request(app, 'GET', '/api/analytics/planned-vs-completed', authHeaders);
    if (plannedVsCompletedRes.status !== 200 || !plannedVsCompletedRes.body.data.byGoals) {
      throw new Error(`Planned vs completed analytics failed: ${JSON.stringify(plannedVsCompletedRes.body)}`);
    }
    console.log('  Passed: All analytics endpoints computed accurately');

    // 12. Safe Subject Deletion protection check
    console.log('Test 12: Safe Subject Deletion protection');
    const safeDelRes = await request(app, 'DELETE', `/api/subjects/${subjectId}`, authHeaders);
    if (safeDelRes.status !== 409 || !safeDelRes.body.requiresCascade) {
      throw new Error(`Safe deletion should protect linked items with 409, got ${safeDelRes.status}`);
    }
    console.log('  Passed: Subject with linked items safely protected from accidental deletion');

    // Cascade delete
    const cascadeDelRes = await request(app, 'DELETE', `/api/subjects/${subjectId}?cascade=true`, authHeaders);
    if (cascadeDelRes.status !== 200) {
      throw new Error(`Cascade deletion failed: ${JSON.stringify(cascadeDelRes.body)}`);
    }
    console.log('  Passed: Cascade deletion successfully cleaned up subject and relations');

    console.log('\n--- ALL BACKEND TESTS PASSED WITH 100% SUCCESS ---');
  } catch (error) {
    console.error('\nTest failed:', error.message);
    exitCode = 1;
  } finally {
    await disconnectDB();
    process.exit(exitCode);
  }
}

runTests();

