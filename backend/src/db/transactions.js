import { pool } from '../db/index.js';

/**
 * Add database transaction helpers
 */
export class Transaction {
  constructor(client) {
    this.client = client;
  }

  async query(text, params) {
    return this.client.query(text, params);
  }

  async commit() {
    await this.client.query('COMMIT');
    this.client.release();
  }

  async rollback() {
    await this.client.query('ROLLBACK');
    this.client.release();
  }
}

/**
 * Begin a database transaction
 */
export async function beginTransaction() {
  const client = await pool.connect();
  await client.query('BEGIN');
  return new Transaction(client);
}

/**
 * Execute a function within a transaction
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const transaction = new Transaction(client);
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    throw error;
  }
}
