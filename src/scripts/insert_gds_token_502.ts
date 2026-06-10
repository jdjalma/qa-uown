/** Insert real GDS token (JWT) into uown_gds_token pk=1 — provided by user. AUTHORIZED. */
import { Pool } from 'pg';

const pool = new Pool({
  host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1nTech', database: 'svc',
});

const TOKEN =
  'eyJraWQiOiI1Y1p0RTFxTWRZeWtMOWFSOGtMazVLcWJlaXRGQ2FVQ0JXRmE1czByajMwPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIzMWtwYWI5MzZjaGR2b3VvaGQ5YmRzc2FtMSIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiaW50ZWdyYXRlXC90cmFuc2FjdGlvbiIsImF1dGhfdGltZSI6MTc3ODA2MDQwMCwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfcXl4STVzbEZVIiwiZXhwIjoxNzc4MDY3NjAwLCJpYXQiOjE3NzgwNjA0MDAsInZlcnNpb24iOjIsImp0aSI6Ijk3YWYwYWQwLWM1NjgtNGUzMS04Nzg5LWM2NGFhODJjMTc0ZiIsImNsaWVudF9pZCI6IjMxa3BhYjkzNmNoZHZvdW9oZDliZHNzYW0xIn0.ekoizJmupscAOUWWOWAw6k7zl1mvhe6PW0bMySuij-jHWpsvcUhgc8uxVgPlyzk2NvAOXJGxeEJN8xme6KNmP8qTFFb40YbkXb1Xj65nds1MKgjcuiXu1NdwjjlEDIDhBDZyecgZyFPN9HuRCQlSiYprr3x43xia0q8vGqmQHPbLj1bPtjmXg3WstJ9gu0kmz1xmJSP5Cnhf-ysaQuehNr1hxHKV_MjEcJfyY5JlYmatli7hELSDcCuPvYdX4CNtgTzuc-DhwOet2YBDU97bfeCO3-n7GwJSyQu0Ita5UOf4UsFksGGmVDnLU6Xxci76vPYr6FLBRK91K8kKmQoHRQ';
// JWT exp claim: 1778067600 → 2026-05-06T14:20:00Z (2h validity from iat)
const EXP_EPOCH = 1778067600;

async function main() {
  const r = await pool.query(
    `UPDATE uown_gds_token
       SET access_token = $1,
           expiration_time = to_timestamp($2),
           row_updated_timestamp = now()
     WHERE pk = 1
     RETURNING pk, length(access_token) AS tok_len, expiration_time, expiration_time > now() AS valid_now`,
    [TOKEN, EXP_EPOCH],
  );
  if (r.rowCount === 0) {
    // pk=1 missing — INSERT instead
    const ins = await pool.query(
      `INSERT INTO uown_gds_token (pk, row_created_timestamp, row_updated_timestamp, access_token, expiration_time)
       VALUES (1, now(), now(), $1, to_timestamp($2))
       RETURNING pk, length(access_token) AS tok_len, expiration_time, expiration_time > now() AS valid_now`,
      [TOKEN, EXP_EPOCH],
    );
    console.log('INSERTED:', ins.rows[0]);
  } else {
    console.log('UPDATED:', r.rows[0]);
  }
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
