// Full End-to-End Automated Test Script for Hadafeto Features

const BASE_URL = 'http://localhost:3000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  console.log('🚀 Starting Comprehensive Features Verification...');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Auth: Student Login
  const studentLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ role: 'STUDENT', username: 'aryan', password: '1234567890' }),
  });
  assert(studentLogin.ok && studentLogin.data.token, 'Student login succeeds with token');
  const studentToken = studentLogin.data.token;
  const studentAuth = { Authorization: `Bearer ${studentToken}` };

  // 2. Auth: Counselor Login
  const counselorLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ role: 'COUNSELOR', username: 'dr.parsa', password: '1234567890' }),
  });
  assert(counselorLogin.ok && counselorLogin.data.token, 'Counselor login succeeds with token');
  const counselorToken = counselorLogin.data.token;
  const counselorAuth = { Authorization: `Bearer ${counselorToken}` };

  // 3. Security: Student blocked from Counselor endpoints (403)
  const studentForbidden = await request('/api/counselor/badge-grants', {
    headers: studentAuth,
  });
  assert(studentForbidden.status === 403, 'Student blocked from counselor endpoint (403)');

  // 4. Study Hall: Entry without valid part is rejected
  const emptyHallEnter = await request('/api/study-hall/enter', {
    method: 'POST',
    headers: studentAuth,
    body: JSON.stringify({ taskId: 'non_existent_task' }),
  });
  assert(
    !emptyHallEnter.ok && emptyHallEnter.data.error.includes('برای ورود به سالن مطالعه ابتدا یک پارت از برنامه امروز انتخاب کنید'),
    'Study Hall blocks entrance without valid task with exact Persian message'
  );

  // 5. Study Hall: Get or Create Today's task for student and enter
  const today = new Date().toISOString().split('T')[0];
  const createTask = await request('/api/tasks', {
    method: 'POST',
    headers: counselorAuth,
    body: JSON.stringify({
      studentId: 'student_1',
      date: today,
      courseName: 'زیست‌شناسی دوازدهم - ژنتیک',
      activityType: 'مطالعه',
      testMode: 'ندارد',
      minTests: 0,
      durationMinutes: 75,
      order: 1,
    }),
  });
  assert(createTask.ok && createTask.data.id, "Counselor creates valid part for today's plan");
  const taskId = createTask.data.id;

  // Now enter Study Hall with this task
  const validHallEnter = await request('/api/study-hall/enter', {
    method: 'POST',
    headers: studentAuth,
    body: JSON.stringify({ taskId }),
  });
  assert(validHallEnter.ok && validHallEnter.data.presence, 'Student enters Study Hall with valid task');

  // Verify presence list
  const presenceList = await request('/api/study-hall/presence', { headers: studentAuth });
  assert(
    presenceList.ok && presenceList.data.some((p) => p.studentId === 'student_1'),
    'Student appears in public Study Hall presence list'
  );

  // Heartbeat
  const heartbeat = await request('/api/study-hall/heartbeat', {
    method: 'POST',
    headers: studentAuth,
  });
  assert(heartbeat.ok && heartbeat.data.success, 'Study Hall heartbeat succeeds');

  // Leave Hall
  const leaveHall = await request('/api/study-hall/leave', {
    method: 'POST',
    headers: studentAuth,
  });
  assert(leaveHall.ok, 'Student leaves Study Hall successfully');

  // 6. Store Products & Purchasing
  // Ensure student has sufficient FP for test purchases
  await request('/api/students/student_1/adjust-fp', {
    method: 'POST',
    headers: counselorAuth,
    body: JSON.stringify({ amount: 1000, reason: 'شارژ تستی امتیاز تمرکز', isPenalty: false }),
  });

  const storeProds = await request('/api/store/products', { headers: studentAuth });
  assert(storeProds.ok && Array.isArray(storeProds.data) && storeProds.data.length > 0, 'Store products returned');

  // Purchase permanent item atomically
  const permRes = await request('/api/store/purchase', {
    method: 'POST',
    headers: studentAuth,
    body: JSON.stringify({ productId: 'sp_t2' }),
  });
  // If already purchased in previous test run, permRes will fail with duplicate error, which is fine
  const isFirstPurchase = permRes.ok && permRes.data.success;
  assert(isFirstPurchase || (permRes.data?.error && permRes.data.error.includes('قبلاً خریداری کرده‌اید')), 'Student purchases store item atomically');

  // Duplicate purchase of permanent item rejected
  const dupPurchase = await request('/api/store/purchase', {
    method: 'POST',
    headers: studentAuth,
    body: JSON.stringify({ productId: 'sp_t2' }),
  });
  assert(
    !dupPurchase.ok && dupPurchase.data?.error && dupPurchase.data.error.includes('قبلاً خریداری کرده‌اید'),
    'Duplicate permanent purchase rejected with Persian message'
  );

  // 7. Inventory & Equip / Unequip
  const invRes = await request('/api/inventory', { headers: studentAuth });
  assert(invRes.ok && Array.isArray(invRes.data), 'Student retrieves inventory');
  const purchasedItem = invRes.data.find((i) => i.productId === 'sp_t2');
  assert(purchasedItem, 'Purchased item exists in inventory');

  if (purchasedItem) {
    // Equip Title
    const equipRes = await request(`/api/inventory/${purchasedItem.id}/equip`, {
      method: 'POST',
      headers: studentAuth,
    });
    assert(equipRes.ok && equipRes.data.student.equippedTitle, 'Equipping title updates student profile');

    // Unequip Title
    const unequipRes = await request(`/api/inventory/${purchasedItem.id}/unequip`, {
      method: 'POST',
      headers: studentAuth,
    });
    assert(unequipRes.ok && !unequipRes.data.student.equippedTitle, 'Unequipping title clears equipped title');
  }

  // 8. Achievements Engine: Authoritative 5 Milestones
  const achRes = await request('/api/achievements', { headers: studentAuth });
  assert(achRes.ok && Array.isArray(achRes.data) && achRes.data.length === 5, 'All 5 official achievements returned');

  // Student 1 has streak = 34, so 30_DAY_STREAK should be unlocked
  const streakAch = achRes.data.find((a) => a.code === '30_DAY_STREAK');
  assert(streakAch && streakAch.isUnlocked, '30-Day streak achievement is automatically unlocked by server');

  if (streakAch && !streakAch.isClaimed) {
    const claimAch = await request('/api/achievements/claim', {
      method: 'POST',
      headers: studentAuth,
      body: JSON.stringify({ code: '30_DAY_STREAK' }),
    });
    assert(claimAch.ok && claimAch.data.success, 'Claiming unlocked achievement succeeds and awards badge + 100 FP');

    // Second claim of same achievement must be rejected
    const dupClaim = await request('/api/achievements/claim', {
      method: 'POST',
      headers: studentAuth,
      body: JSON.stringify({ code: '30_DAY_STREAK' }),
    });
    assert(!dupClaim.ok && dupClaim.data.error.includes('قبلاً دریافت شده است'), 'Duplicate achievement claim rejected');
  }

  // 9. Counselor-Only Badges (3 Ultra-Rare Badges)
  // Attempting to delete a counselor-only badge must fail
  const deleteSpecialBadge = await request('/api/badges/badge_c_nabz', {
    method: 'DELETE',
    headers: counselorAuth,
  });
  assert(
    !deleteSpecialBadge.ok && deleteSpecialBadge.data.error.includes('انحصاری مشاور است و قابل حذف نمی‌باشد'),
    'Counselor-only badge protected from deletion'
  );

  // Grant counselor-only badge to student
  const grantBadge = await request('/api/counselor/badge-grants', {
    method: 'POST',
    headers: counselorAuth,
    body: JSON.stringify({
      studentId: 'student_1',
      badgeId: 'badge_c_nabz',
      reason: 'ارزیابی بالینی مشاور به پاس اراده و انگیزه عالی',
    }),
  });
  assert(grantBadge.ok && grantBadge.data.success, 'Counselor grants exclusive badge with reason audit trail');

  // Verify audit list
  const grantsList = await request('/api/counselor/badge-grants', { headers: counselorAuth });
  assert(grantsList.ok && grantsList.data.some((g) => g.badgeId === 'badge_c_nabz'), 'Grant logged in counselor audit trail');

  const createdGrant = grantsList.data.find((g) => g.badgeId === 'badge_c_nabz');
  if (createdGrant) {
    // Revoke the badge
    const revokeRes = await request(`/api/counselor/badge-grants/${createdGrant.id}`, {
      method: 'DELETE',
      headers: counselorAuth,
    });
    assert(revokeRes.ok && revokeRes.data.success, 'Counselor revokes badge successfully');
  }

  // 10. Counselor Store Product Management
  const createProd = await request('/api/store/products', {
    method: 'POST',
    headers: counselorAuth,
    body: JSON.stringify({
      title: 'عنوان آزمایشی مشاور',
      description: 'تستی برای بررسی صحت عملکرد',
      cost: 450,
      rarity: 'حماسی',
      category: 'TITLE',
      icon: 'Tag',
      isConsumable: false,
      featured: true,
    }),
  });
  assert(createProd.ok && createProd.data.id, 'Counselor creates new store product');

  if (createProd.ok && createProd.data.id) {
    const delProd = await request(`/api/store/products/${createProd.data.id}`, {
      method: 'DELETE',
      headers: counselorAuth,
    });
    assert(delProd.ok, 'Counselor deletes / deactivates store product');
  }

  console.log(`\n========================================`);
  console.log(`TOTAL PASSED: ${passed} | TOTAL FAILED: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
