import { MongoClient } from 'mongodb';
declare global { var tablelogMongo: Promise<MongoClient> | undefined; }
export async function db() {
 const uri = process.env.MONGODB_URI;
 if(!uri) throw new Error('MongoDB is not configured');
 if(!global.tablelogMongo) global.tablelogMongo = new MongoClient(uri,{maxPoolSize:10,serverSelectionTimeoutMS:8000}).connect().catch(error=>{global.tablelogMongo=undefined;throw error;});
 return (await global.tablelogMongo).db(process.env.MONGODB_DB || 'tablelog');
}
