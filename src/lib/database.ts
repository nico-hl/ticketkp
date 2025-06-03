import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ticketuser:SuperSicheresPasswort2024!@localhost:5432/ticketsystem',
  ssl: false,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  
  async testConnection() {
    try {
      const result = await pool.query('SELECT NOW()');
      console.log('Database connected:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }
};

export default db; 