import mongoose from "mongoose";

type connectionOjbect = {
        isConnected?: number
}

const connection:connectionOjbect = {}
//void means what datatype is coming , it doesnt matter
async function DBconnect (): Promise<void>{
    if(connection.isConnected){
        console.log("Already connected to datatabase");
        return 
    }

    try {
       const DB =  await mongoose.connect(process.env.MONGODB_URI || "" , {})
       console.log(DB);
       connection.isConnected = DB.connections[0].readyState
       console.log("DB CONNECTED SECCUESSFULLY");
       
    } catch (error) {
        console.log("db connection failed" ,error);
        
        process.exit(1)
    }
}

export default DBconnect;