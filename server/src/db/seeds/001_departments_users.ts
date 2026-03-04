import type { Knex } from 'knex';
import bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
  await knex('request_history').del();
  await knex('request_comments').del();
  await knex('requests').del();
  await knex('users').del();
  await knex('departments').del();

  // Departments
  const [production, quality, maintenance, admin, warehouse, lab, ehs] = await knex('departments')
    .insert([
      { name: 'Production' },
      { name: 'Quality Control' },
      { name: 'Maintenance' },
      { name: 'Administration' },
      { name: 'Warehouse' },
      { name: 'Laboratory' },
      { name: 'EHS' },
    ])
    .returning('id');

  const hash = await bcrypt.hash('admin123!', 10);

  // IT Admin (you)
  const [itAdmin] = await knex('users').insert({
    email: 'admin@facility.local',
    password_hash: hash,
    name: 'IT Admin',
    role: 'it_admin',
    department_id: admin.id,
    manager_id: null,
  }).returning('id');

  // Managers
  const [prodMgr] = await knex('users').insert({
    email: 'prod.manager@facility.local',
    password_hash: hash,
    name: 'Production Manager',
    role: 'manager',
    department_id: production.id,
    manager_id: null,
  }).returning('id');

  const [qcMgr] = await knex('users').insert({
    email: 'qc.manager@facility.local',
    password_hash: hash,
    name: 'QC Manager',
    role: 'manager',
    department_id: quality.id,
    manager_id: null,
  }).returning('id');

  const [maintMgr] = await knex('users').insert({
    email: 'maint.manager@facility.local',
    password_hash: hash,
    name: 'Maintenance Manager',
    role: 'manager',
    department_id: maintenance.id,
    manager_id: null,
  }).returning('id');

  const [whMgr] = await knex('users').insert({
    email: 'warehouse.manager@facility.local',
    password_hash: hash,
    name: 'Warehouse Manager',
    role: 'manager',
    department_id: warehouse.id,
    manager_id: null,
  }).returning('id');

  const [ehsMgr] = await knex('users').insert({
    email: 'ehs.manager@facility.local',
    password_hash: hash,
    name: 'EHS Manager',
    role: 'manager',
    department_id: ehs.id,
    manager_id: null,
  }).returning('id');

  // Employees
  await knex('users').insert([
    { email: 'john.doe@facility.local', password_hash: hash, name: 'John Doe', role: 'employee', department_id: production.id, manager_id: prodMgr.id },
    { email: 'jane.smith@facility.local', password_hash: hash, name: 'Jane Smith', role: 'employee', department_id: quality.id, manager_id: qcMgr.id },
    { email: 'bob.wilson@facility.local', password_hash: hash, name: 'Bob Wilson', role: 'employee', department_id: maintenance.id, manager_id: maintMgr.id },
    { email: 'alice.brown@facility.local', password_hash: hash, name: 'Alice Brown', role: 'employee', department_id: warehouse.id, manager_id: whMgr.id },
    { email: 'charlie.davis@facility.local', password_hash: hash, name: 'Charlie Davis', role: 'employee', department_id: ehs.id, manager_id: ehsMgr.id },
  ]);
}
