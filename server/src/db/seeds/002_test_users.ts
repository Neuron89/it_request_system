import type { Knex } from 'knex';

/**
 * Idempotent seed for the test-mode role sandbox. Re-running this seed
 * resets all `is_test=true` users — those rows are the ones the
 * /test-login page signs into, so blowing them away is a clean reset.
 *
 * The set covers all 5 testable roles plus a manager linkage from the
 * test Employee → test Manager so you can exercise the request-approval
 * flow end-to-end.
 */
export async function seed(knex: Knex): Promise<void> {
  // Wipe any prior test rows so this seed is safe to re-run.
  await knex('users').where({ is_test: true }).del();

  // Pick or create a department for the test users — keeping them in
  // an isolated "Test" department avoids polluting the real org chart.
  let testDept = await knex('departments').where({ name: 'Test (sandbox)' }).first();
  if (!testDept) {
    const [created] = await knex('departments')
      .insert({ name: 'Test (sandbox)' })
      .returning('*');
    testDept = created;
  }

  const password_hash = '!test'; // placeholder; password login is gated off

  // Insert manager first so the employee can reference manager_id.
  const [mgr] = await knex('users')
    .insert({
      email: 'test-mgr@nycoa.test',
      name: 'Test Manager',
      role: 'manager',
      department_id: testDept.id,
      is_active: true,
      is_test: true,
      password_hash,
    })
    .returning('*');

  await knex('users').insert([
    {
      email: 'test-it@nycoa.test',
      name: 'Test IT Admin',
      role: 'it_admin',
      department_id: testDept.id,
      is_active: true,
      is_test: true,
      password_hash,
    },
    {
      email: 'test-hr@nycoa.test',
      name: 'Test HR',
      role: 'hr',
      department_id: testDept.id,
      is_active: true,
      is_test: true,
      password_hash,
    },
    {
      email: 'test-ehs@nycoa.test',
      name: 'Test EHS',
      role: 'ehs',
      department_id: testDept.id,
      is_active: true,
      is_test: true,
      password_hash,
    },
    {
      email: 'test-emp@nycoa.test',
      name: 'Test Employee',
      role: 'employee',
      department_id: testDept.id,
      manager_id: mgr.id,
      is_active: true,
      is_test: true,
      password_hash,
    },
  ]);
}
