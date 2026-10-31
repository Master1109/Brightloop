import { Pool } from 'pg';
import { newDb } from 'pg-mem';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
export const demo = !process.env.DATABASE_URL && process.env.NODE_ENV !== 'production';
if (!demo && !process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in production');
export const db: Pool = demo ? new (newDb().adapters.createPg().Pool)() : new Pool({ connectionString: process.env.DATABASE_URL });
export const entities = ['products','plans','customers','templates','subscriptions','quotations','invoices','payments','taxes','discounts','team'] as const;
export type Entity = typeof entities[number];
export async function init() {
 await db.query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL, customer_id TEXT, reset_token TEXT, reset_expires BIGINT);
 CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, kind TEXT NOT NULL, name TEXT NOT NULL, status TEXT NOT NULL, amount NUMERIC(14,2) NOT NULL DEFAULT 0, customer_id TEXT REFERENCES records(id), plan_id TEXT REFERENCES records(id), data JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
 CREATE INDEX IF NOT EXISTS records_kind ON records(kind,created_at);
 CREATE INDEX IF NOT EXISTS records_customer ON records(customer_id,kind);
 CREATE TABLE IF NOT EXISTS billing_periods (subscription_id TEXT REFERENCES records(id), period TEXT, invoice_id TEXT REFERENCES records(id), PRIMARY KEY(subscription_id,period));
 CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, record_id TEXT REFERENCES records(id), actor TEXT, action TEXT, created_at TIMESTAMPTZ DEFAULT NOW());`);
 if (demo && !(await db.query('SELECT id FROM users LIMIT 1')).rowCount) await seed();
 if (!demo && !(await db.query('SELECT id FROM users LIMIT 1')).rowCount) {
  const email=process.env.ADMIN_EMAIL, password=process.env.ADMIN_PASSWORD;
  if(!email||!password||password.length<12||!/[A-Z]/.test(password)||!/[a-z]/.test(password)||! /[^A-Za-z0-9]/.test(password)) throw Error('Set ADMIN_EMAIL and a strong ADMIN_PASSWORD (12+ characters) for first startup');
  await db.query('INSERT INTO users(id,email,name,password,role) VALUES($1,$2,$3,$4,$5)',[randomUUID(),email.toLowerCase(),'Workspace Admin',await hash(password,12),'ADMIN']);
 }
}
export async function insert(kind:string,name:string,status:string,amount:number,data:any={},customer_id:string|null=null,plan_id:string|null=null,id=randomUUID() as string) {
 const result=await db.query('INSERT INTO records(id,kind,name,status,amount,data,customer_id,plan_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[id,kind,name,status,amount,JSON.stringify(data),customer_id,plan_id]); return result.rows[0];
}
async function seed(){
 const customerNames=['Acme Studio','Layers Design','Orbit Technologies','Sienna Creative','Northstar Labs','Mint & Co.','Forma Digital','Notion Works'];
 for(let i=0;i<customerNames.length;i++) await insert('customers',customerNames[i],'Active',0,{email:`billing@${customerNames[i].split(' ')[0].toLowerCase()}.example`,contact:['Alex Morgan','Priya Shah','James Wilson','Maya Patel'][i%4],notes:'Development sample customer'},null,null,`c${i}`);
 for(let i=0;i<3;i++) {await insert('products',['Workspace','Automations','Analytics'][i],'Active',[1250,2490,4990][i],{type:'Software',cost:200,notes:'Team productivity suite',variants:[]},null,null,`p${i}`);await insert('plans',['Starter','Professional','Enterprise'][i],'Active',[1250,2490,4990][i],{product_id:`p${i}`,frequency:'Monthly',minimum_quantity:1,end_behavior:'Close'},null,null,`plan${i}`);}
 for(let i=0;i<24;i++) await insert('subscriptions',`SUB-${String(1001+i)}`,['Active','Active','Active','Confirmed','Quotation','Paused'][i%6],[1250,2490,4990][i%3],{quantity:1,unit_price:[1250,2490,4990][i%3],tax_rate:0,start_date:'2026-01-01',next_billing:'2026-11-01',payment_terms:14,frequency:'Monthly'},`c${i%8}`,`plan${i%3}`,`s${i}`);
 for(let i=0;i<36;i++){const amount=[1250,2490,4990][i%3]*(1+i%4);const month=String(1+i%10).padStart(2,'0');await insert('invoices',`INV-${String(2001+i)}`,i>29?'Confirmed':'Paid',amount,{subscription_id:`s${i%24}`,invoice_date:`2026-${month}-01`,due_date:`2026-${month}-15`,paid:i>29?0:amount,subtotal:amount,tax:0,discount:0,total:amount,quantity:1,unit_price:amount},`c${i%8}`,`plan${i%3}`,`i${i}`);if(i<=29) await insert('payments',`PAY-${3001+i}`,'Recorded',amount,{invoice_id:`i${i}`,method:['Bank transfer','Card','UPI'][i%3],payment_date:`2026-${month}-05`},`c${i%8}`);}
 await insert('quotations','QUO-1001','Quotation',4990,{quantity:1,unit_price:4990,tax_rate:0,start_date:'2026-11-01',expiry_date:'2026-11-30',payment_terms:14},'c1','plan2');
 await insert('templates','Standard monthly subscription','Active',0,{validity_days:30,notes:'Monthly recurring service quotation'});
 await db.query('INSERT INTO users(id,email,name,password,role,customer_id) VALUES($1,$2,$3,$4,$5,$6)',['demo-admin','admin@brightloop.local','Aarav Shah',await hash('Brightloop!2026',12),'ADMIN',null]);
 await db.query('INSERT INTO users(id,email,name,password,role,customer_id) VALUES($1,$2,$3,$4,$5,$6)',['demo-staff','staff@brightloop.local','Meera Patel',await hash('Brightloop!2026',12),'STAFF',null]);
 await db.query('INSERT INTO users(id,email,name,password,role,customer_id) VALUES($1,$2,$3,$4,$5,$6)',['demo-customer','customer@brightloop.local','Alex Morgan',await hash('Brightloop!2026',12),'CUSTOMER','c0']);
}
